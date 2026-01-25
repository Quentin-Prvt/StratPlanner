import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { supabase } from '../../supabaseClient';
import { useCanvasZoom } from '../../hooks/useCanvasZoom';
import { useSupabaseStrategies } from '../../hooks/useSupabase';
import { useRealtimeStrategy } from '../../hooks/useRealtimeStrategy';
import { checkAbilityHit, updateAbilityPosition, checkVisionHit } from '../../utils/canvasHitDetection';
import { drawSmoothLine, drawArrowHead } from '../../utils/canvasDrawing';
import { renderDrawings } from '../../utils/canvasRenderer';
import { createDrawingFromDrop } from '../../utils/dropFactory';
import { MAP_CONFIGS } from '../../utils/mapsRegistry';
import type { DrawingObject, ToolType, StrokeType, StrategyStep, VisionObject, StrategyNote } from '../../types/canvas';
import { useAuth } from '../../contexts/AuthContext';
import { useUndoRedo } from '../../hooks/useUndoRedo';

// Helper ID
const generateId = () => Date.now() + Math.random();

// --- MATH HELPERS ---
function distanceToSegment(p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) {
    const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

export const useEditorLogic = (strategyId: string) => {
    const navigate = useNavigate();

    // --- REFS ---
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const trashRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);

    // Data Refs
    const currentStepIndexRef = useRef(0);
    const stepsRef = useRef<StrategyStep[]>([{ id: 'init', name: 'Setup', data: [], notes: [] }]);

    // Technical Refs
    const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clickPosRef = useRef<{x: number, y: number} | null>(null);
    const lastSavedDataRef = useRef<string>("");

    // LE VERROU MAGIQUE : Empêche le ping-pong lors du changement de step
    const isSwitchingStepRef = useRef(false);

    // --- STATE REFS ---
    const drawingsRef = useRef<DrawingObject[]>([]);
    const startHistoryRef = useRef<DrawingObject[]>([]);

    // Realtime Refs
    const isInteractingRef = useRef(false);
    const isRemoteUpdate = useRef(false);

    // --- HISTORIQUE ---
    const { addToHistory, undo, redo } = useUndoRedo();

    // Drawing Refs
    const pointsRef = useRef<{x: number, y: number}[]>([]);
    const startPosRef = useRef<{x: number, y: number}>({x: 0, y: 0});
    const panStartRef = useRef({ x: 0, y: 0 });
    const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

    // --- HOOKS ---
    const { transformRef, contentRef, centerView, panCanvas } = useCanvasZoom(containerRef);
    const { savedStrategies, isLoading, showLoadModal, setShowLoadModal, fetchStrategies, getStrategyById, updateStrategyData } = useSupabaseStrategies();

    // --- STATES ---
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentMapSrc, setCurrentMapSrc] = useState<string | null>(null);
    const [isRotated, setIsRotated] = useState(false);

    const [showMapCalls, setShowMapCalls] = useState(true);
    const [reverseMapError, setReverseMapError] = useState(false);
    const [reverseCallsError, setReverseCallsError] = useState(false);

    // UI States
    const [steps, setStepsState] = useState<StrategyStep[]>([{ id: 'init', name: 'Setup', data: [], notes: [] }]);
    const [currentStepIndex, setCurrentStepIndexState] = useState(0);

    const [showZones, setShowZones] = useState(true);
    const [iconSize, setIconSize] = useState(30);
    const [folders, setFolders] = useState<{id: string, name: string}[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string>("");
    const [isTextModalOpen, setIsTextModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingTextId, setEditingTextId] = useState<number | null>(null);

    // Tools
    const [currentTool, setCurrentTool] = useState<ToolType | 'tools' | 'settings' | 'text' | null>('cursor');
    const [strokeType, setStrokeType] = useState<StrokeType>('solid');
    const [color, setColor] = useState('#ef4444');
    const [opacity, setOpacity] = useState(1);
    const [thickness, setThickness] = useState(4);

    // Selection
    const [selectedAgent, setSelectedAgent] = useState('jett');
    const [selectedAbility, setSelectedAbility] = useState<string | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [draggingObjectId, setDraggingObjectId] = useState<number | null>(null);
    const [isOverTrash, setIsOverTrash] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [specialDragMode, setSpecialDragMode] = useState<string | null>(null);
    const [wallCenterStart, setWallCenterStart] = useState({ x: 0, y: 0 });
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

    const { user } = useAuth();
    const editingObj = editingTextId ? drawingsRef.current.find(d => d.id === editingTextId) : null;

    // --- COMPUTED ---
    const getCurrentScale = () => {
        const entry = Object.entries(MAP_CONFIGS).find(([, config]) => config.src === currentMapSrc);
        return entry ? entry[1].scale : 0.75;
    };

    // --- SAVE LOGIC ---
    const debouncedSaveData = useMemo(
        () => debounce((id: string, stepsData: StrategyStep[], idx: number) => {
            updateStrategyData(id, { data: { steps: stepsData, currentStepIndex: idx } });
        }, 2000),
        [updateStrategyData]
    );

    const immediateSave = useCallback((stepsData: StrategyStep[], idx: number = currentStepIndex) => {
        if (!strategyId) return;
        updateStrategyData(strategyId, { data: { steps: stepsData, currentStepIndex: idx } });
    }, [strategyId, currentStepIndex, updateStrategyData]);

    // --- SMART STATE UPDATER ---
    const updateStepsIfChanged = useCallback((newStepsOrUpdater: StrategyStep[] | ((prev: StrategyStep[]) => StrategyStep[])) => {
        // PROTECTION VERROU: Si on change de step manuellement, on ignore les updates externes
        if (isSwitchingStepRef.current) return;

        setStepsState(prev => {
            const newSteps = typeof newStepsOrUpdater === 'function' ? newStepsOrUpdater(prev) : newStepsOrUpdater;
            const prevJson = JSON.stringify(prev);
            const newJson = JSON.stringify(newSteps);

            if (prevJson === newJson) return prev;

            stepsRef.current = newSteps;
            return newSteps;
        });
    }, []);

    // --- CHANGEMENT DE STEP (CORRIGÉ) ---
    const setCurrentStepIndex = (index: number) => {
        if (index === currentStepIndexRef.current) return;

        console.log('[STEP] Manual switch to:', index);

        // 1. ACTIVATION DU VERROU
        isSwitchingStepRef.current = true;

        // 2. Annulation des sauvegardes en attente
        debouncedSaveData.cancel();

        // 3. Mise à jour Locale
        currentStepIndexRef.current = index;
        setCurrentStepIndexState(index);

        // 4. Chargement des dessins
        if (stepsRef.current[index]) {
            drawingsRef.current = stepsRef.current[index].data;
            redrawMainCanvas();
        }

        // 5. Sauvegarde Immédiate du nouvel index
        if (strategyId) {
            updateStrategyData(strategyId, { data: { steps: stepsRef.current, currentStepIndex: index } });

            // CORRECTION: On utilise la variable pour mettre à jour la Ref
            const newDataState = JSON.stringify(stepsRef.current);
            lastSavedDataRef.current = newDataState; // <-- C'ETAIT ICI LE PROBLEME
        }

        // 6. DÉSACTIVATION DU VERROU APRES DÉLAI
        setTimeout(() => {
            isSwitchingStepRef.current = false;
            console.log('[STEP] Unlocked.');
        }, 1000);
    };

    // --- REDRAW ---
    const redrawMainCanvas = useCallback(() => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(() => {
            const canvas = mainCanvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            const mapScale = getCurrentScale();
            renderDrawings(ctx, drawingsRef.current, imageCache.current, redrawMainCanvas, draggingObjectId, showZones, mapScale, iconSize, isRotated);
        });
    }, [draggingObjectId, showZones, currentMapSrc, iconSize, isRotated]);

    // --- ROTATION HANDLER ---
    const handleToggleRotation = (newValue: boolean) => {
        setIsRotated(newValue);
    };

    const applyHistoryState = useCallback((newState: DrawingObject[]) => {
        drawingsRef.current = newState;
        redrawMainCanvas();

        const newSteps = [...stepsRef.current];
        if (newSteps[currentStepIndexRef.current]) {
            newSteps[currentStepIndexRef.current] = { ...newSteps[currentStepIndexRef.current], data: newState };
        }

        updateStepsIfChanged(newSteps);
        lastSavedDataRef.current = JSON.stringify(newSteps);
        debouncedSaveData.cancel();
        immediateSave(newSteps, currentStepIndexRef.current);
    }, [redrawMainCanvas, immediateSave, debouncedSaveData, updateStepsIfChanged]);

    // --- EFFECTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    const nextState = redo(drawingsRef.current);
                    if (nextState) applyHistoryState(nextState);
                } else {
                    const prevState = undo(drawingsRef.current);
                    if (prevState) applyHistoryState(prevState);
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                const nextState = redo(drawingsRef.current);
                if (nextState) applyHistoryState(nextState);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, applyHistoryState]);

    useEffect(() => {
        if (!isSwitchingStepRef.current && steps[currentStepIndex]) {
            if (draggingObjectId === null) {
                drawingsRef.current = steps[currentStepIndex].data;
                redrawMainCanvas();
            }
        }
    }, [steps, currentStepIndex, redrawMainCanvas, draggingObjectId]);

    useEffect(() => {
        setReverseMapError(false);
        setReverseCallsError(false);
    }, [currentMapSrc]);

    // --- AUTO-SAVE TRIGGER ---
    useEffect(() => {
        if (!isLoaded || !strategyId) return;

        // Bloquer l'auto-save si on est en transition manuelle
        if (isSwitchingStepRef.current) return;

        if (isRemoteUpdate.current) {
            lastSavedDataRef.current = JSON.stringify(steps);
            isRemoteUpdate.current = false;
            return;
        }
        if (isInteractingRef.current) return;

        const currentDataString = JSON.stringify(steps);
        if (currentDataString === lastSavedDataRef.current) return;

        lastSavedDataRef.current = currentDataString;
        debouncedSaveData(strategyId, steps, currentStepIndex);

        return () => debouncedSaveData.cancel();
    }, [steps, currentStepIndex, strategyId, isLoaded, debouncedSaveData, isRemoteUpdate, isInteractingRef]);

    const { reverseMapSrc, callsMapSrc, reverseCallsMapSrc } = useMemo(() => {
        if (!currentMapSrc) return { reverseMapSrc: null, callsMapSrc: null, reverseCallsMapSrc: null };
        const parts = currentMapSrc.split('.');
        const ext = parts.pop();
        const base = parts.join('.');
        return {
            reverseMapSrc: `${base}_reverse.${ext}`,
            callsMapSrc: `${base}_calls.${ext}`,
            reverseCallsMapSrc: `${base}_calls_reverse.${ext}`
        };
    }, [currentMapSrc]);

    const activeMapSrc = useMemo(() => {
        if (!currentMapSrc) return null;
        return isRotated ? (reverseMapSrc || currentMapSrc) : currentMapSrc;
    }, [isRotated, currentMapSrc, reverseMapSrc]);

    const activeCallsSrc = useMemo(() => {
        if (!callsMapSrc) return null;
        return isRotated ? (reverseCallsMapSrc || callsMapSrc) : callsMapSrc;
    }, [isRotated, callsMapSrc, reverseCallsMapSrc]);

    // Load Data
    useEffect(() => {
        const fetchFolders = async () => {
            const { data } = await supabase.from('folders').select('id, name');
            if (data) setFolders(data);
        };
        fetchFolders();
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!strategyId) return;
            const data = await getStrategyById(strategyId);
            if (data) {
                if (data.folder_id) setCurrentFolderId(data.folder_id.toString());
                if (user) fetchStrategies(data.team_id);
                if (data.map_name) {
                    const mapKey = data.map_name.toLowerCase();
                    const mapConfig = MAP_CONFIGS[mapKey];
                    if (mapConfig) setCurrentMapSrc(mapConfig.src);
                }

                const rawData = data.data;
                if (Array.isArray(rawData)) {
                    const init = [{ id: 'init', name: 'Setup', data: rawData, notes: [] }];
                    updateStepsIfChanged(init);
                    setCurrentStepIndexState(0);
                    currentStepIndexRef.current = 0;
                    lastSavedDataRef.current = JSON.stringify(init);
                } else if (rawData && rawData.steps) {
                    updateStepsIfChanged(rawData.steps);
                    setCurrentStepIndexState(rawData.currentStepIndex || 0);
                    currentStepIndexRef.current = rawData.currentStepIndex || 0;
                    lastSavedDataRef.current = JSON.stringify(rawData.steps);
                }
            }
            setIsLoaded(true);
        };
        loadInitialData();
    }, [strategyId, fetchStrategies, user, getStrategyById, updateStepsIfChanged]);

    const { broadcastMove, broadcastCursor, remoteCursors } = useRealtimeStrategy(
        strategyId,
        user,
        updateStepsIfChanged,
        currentStepIndexRef,
        isRemoteUpdate,
        isInteractingRef
    );

    // --- GRAPHIC HELPERS ---
    const getAdjustedCoordinates = (clientX: number, clientY: number) => {
        const canvas = tempCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let x = (clientX - rect.left) * scaleX;
        let y = (clientY - rect.top) * scaleY;
        if (isRotated) { x = canvas.width - x; y = canvas.height - y; }
        return { x, y };
    };
    const getMousePos = (e: React.MouseEvent) => getAdjustedCoordinates(e.clientX, e.clientY);
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const eraseObjectAt = (x: number, y: number) => {
        const eraserRadius = thickness / 2;
        const newDrawings = drawingsRef.current.filter((obj: DrawingObject) => {
            const erasableTypes = ['solid', 'dashed', 'arrow', 'dashed-arrow', 'rect', 'pen'];
            if (obj.tool === 'pen') return !obj.points.some((p: {x: number, y: number}) => Math.hypot(p.x - x, p.y - y) < (obj.thickness / 2 + eraserRadius));
            if (!erasableTypes.includes(obj.tool as string)) return true;
            if (obj.tool === 'rect' && obj.points.length >= 2) {
                const s = obj.points[0]; const e = obj.points[1];
                const minX = Math.min(s.x, e.x) - eraserRadius; const maxX = Math.max(s.x, e.x) + eraserRadius;
                const minY = Math.min(s.y, e.y) - eraserRadius; const maxY = Math.max(s.y, e.y) + eraserRadius;
                return !(x >= minX && x <= maxX && y >= minY && y <= maxY);
            }
            return !obj.points.some((p: {x: number, y: number}) => Math.hypot(p.x - x, p.y - y) < (obj.thickness / 2 + eraserRadius));
        });

        if (newDrawings.length !== drawingsRef.current.length) {
            drawingsRef.current = newDrawings;
            // UPDATE STEPS
            const newSteps = [...stepsRef.current];
            if (newSteps[currentStepIndexRef.current]) {
                newSteps[currentStepIndexRef.current] = { ...newSteps[currentStepIndexRef.current], data: newDrawings };
            }
            updateStepsIfChanged(newSteps);
            redrawMainCanvas();
        }
    };

    const getContext = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => canvasRef.current?.getContext('2d');

    const syncCanvasSize = useCallback(() => {
        const main = mainCanvasRef.current;
        const temp = tempCanvasRef.current;
        const img = imgRef.current;
        if (main && temp && img && img.clientWidth > 0) {
            main.width = temp.width = img.clientWidth;
            main.height = temp.height = img.clientHeight;
            redrawMainCanvas();
        }
    }, [redrawMainCanvas]);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;
        if (img.complete && img.naturalWidth > 0) syncCanvasSize();
        const onLoad = () => syncCanvasSize();
        img.addEventListener('load', onLoad);
        const resizeObserver = new ResizeObserver(() => syncCanvasSize());
        resizeObserver.observe(img);
        return () => {
            img.removeEventListener('load', onLoad);
            resizeObserver.disconnect();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [syncCanvasSize]);

    // --- HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (interactionTimeoutRef.current) {
            clearTimeout(interactionTimeoutRef.current);
            interactionTimeoutRef.current = null;
        }

        isInteractingRef.current = true;
        startHistoryRef.current = JSON.parse(JSON.stringify(drawingsRef.current));

        const isMinZoom = transformRef.current.scale <= 0.501;
        const isMiddleClick = e.button === 1;
        const isLeftClick = e.button === 0;

        if (isMiddleClick && !isMinZoom) {
            setIsPanning(true);
            panStartRef.current = { x: e.clientX, y: e.clientY };
            if(containerRef.current) containerRef.current.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }

        const mapScale = getCurrentScale();
        const pos = getMousePos(e);

        if (currentTool === 'cursor'|| currentTool === 'settings' || currentTool === 'tools') {
            for (let i = drawingsRef.current.length - 1; i >= 0; i--) {
                const obj = drawingsRef.current[i];
                if (obj.tool === 'vision') {
                    const vision = obj as VisionObject;
                    const hit = checkVisionHit(pos, vision, mapScale);
                    if (hit) {
                        setDraggingObjectId(hit.id);
                        setSpecialDragMode(hit.mode);
                        if (hit.offset) setDragOffset(hit.offset);
                        return;
                    }
                }
                if (obj.tool === 'text' && obj.x !== undefined && obj.y !== undefined) {
                    const fontSize = obj.fontSize || 20;
                    const approxWidth = (obj.text?.length || 0) * (fontSize * 0.6);
                    if (Math.abs(pos.x - obj.x) < approxWidth/2 && Math.abs(pos.y - obj.y) < fontSize/2) {
                        setDraggingObjectId(obj.id);
                        setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y });
                        return;
                    }
                }
                if (obj.tool === 'image' && obj.x != null && obj.y != null) {
                    const w = (obj.width || iconSize) * mapScale; const h = (obj.height || iconSize) * mapScale;
                    if (pos.x >= obj.x - w/2 && pos.x <= obj.x + w/2 && pos.y >= obj.y - h/2 && pos.y <= obj.y + h/2) {
                        setDraggingObjectId(obj.id);
                        setSpecialDragMode(null);
                        setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y });
                        return;
                    }
                }
                // @ts-expect-error - checkAbilityHit
                const hit = checkAbilityHit(pos, obj, mapScale);
                if (hit) {
                    setDraggingObjectId(hit.id);
                    setSpecialDragMode(hit.mode);
                    if (hit.offset) setDragOffset(hit.offset);
                    if (hit.centerStart) setWallCenterStart(hit.centerStart);
                    return;
                }
            }
            setDraggingObjectId(null);
            if (isLeftClick && !isMinZoom) {
                setIsPanning(true);
                panStartRef.current = { x: e.clientX, y: e.clientY };
                if(containerRef.current) containerRef.current.style.cursor = 'grabbing';
                return;
            }
            return;
        }

        // --- TEXT HANDLER ---
        if (currentTool === 'text') {
            clickPosRef.current = pos;
            setEditingTextId(null);
            setIsTextModalOpen(true);
            return;
        }

        // --- GENERIC ADD HANDLER ---
        if (currentTool !== 'eraser' && currentTool !== 'pen') {
            // CORRECTION ICI: Cast explicite pour éviter l'erreur TS2345
            const type = currentTool as ToolType;

            let name: string = selectedAgent;
            if (currentTool === 'ability') name = selectedAbility || selectedAgent || 'c';

            const newObj = createDrawingFromDrop(type, name, pos.x, pos.y);

            if (newObj) {
                newObj.id = generateId();
                drawingsRef.current = [...drawingsRef.current, newObj];
                redrawMainCanvas();

                // UPDATE STEPS VIA REF
                const newSteps = [...stepsRef.current];
                if (newSteps[currentStepIndexRef.current]) {
                    newSteps[currentStepIndexRef.current] = { ...newSteps[currentStepIndexRef.current], data: drawingsRef.current };
                }
                updateStepsIfChanged(newSteps);
                lastSavedDataRef.current = JSON.stringify(newSteps);
                debouncedSaveData.cancel();
                immediateSave(newSteps, currentStepIndexRef.current);
            }
            return;
        }

        if (currentTool === 'eraser') { setIsDrawing(true); eraseObjectAt(pos.x, pos.y); return; }

        if (currentTool === 'pen') {
            setIsDrawing(true);
            const canvas = mainCanvasRef.current;
            const x = canvas ? clamp(pos.x, 0, canvas.width) : pos.x;
            const y = canvas ? clamp(pos.y, 0, canvas.height) : pos.y;
            startPosRef.current = { x, y }; pointsRef.current = [{ x, y }];
            const tempCtx = getContext(tempCanvasRef);
            if (tempCtx) { tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height); tempCtx.beginPath(); tempCtx.moveTo(x, y); }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingObjectId !== null && trashRef.current) {
            const trashRect = trashRef.current.getBoundingClientRect();
            setIsOverTrash(e.clientX >= trashRect.left && e.clientX <= trashRect.right &&
                e.clientY >= trashRect.top && e.clientY <= trashRect.bottom);
        } else if (isOverTrash) {
            setIsOverTrash(false);
        }

        if (isPanning) {
            e.preventDefault();
            const dx = e.clientX - panStartRef.current.x;
            const dy = e.clientY - panStartRef.current.y;
            panCanvas(dx, dy);
            panStartRef.current = { x: e.clientX, y: e.clientY };
            return;
        }

        const rawPos = getMousePos(e);
        const canvas = mainCanvasRef.current;
        const pos = { x: canvas ? clamp(rawPos.x, 0, canvas.width) : rawPos.x, y: canvas ? clamp(rawPos.y, 0, canvas.height) : rawPos.y };

        broadcastCursor(pos.x, pos.y);

        if (draggingObjectId !== null) {
            // FLUIDITÉ : On met à jour UNIQUEMENT la Ref et le Canvas, pas le State React !
            const updatedList = drawingsRef.current.map(obj => {
                if (obj.id !== draggingObjectId) return obj;

                if (obj.tool === 'vision') {
                    const vision = obj as VisionObject;
                    if (specialDragMode === 'move') {
                        const newX = pos.x - dragOffset.x;
                        const newY = pos.y - dragOffset.y;
                        broadcastMove(obj.id, newX, newY);
                        return { ...vision, x: newX, y: newY };
                    }
                    if (specialDragMode === 'rotate') {
                        const dx = pos.x - vision.x;
                        const dy = pos.y - vision.y;
                        const newRotation = Math.atan2(dy, dx);
                        return { ...vision, rotation: newRotation };
                    }
                }

                let newX = obj.x;
                let newY = obj.y;

                if ((obj.tool === 'image' || obj.tool === 'text') && obj.x !== undefined) {
                    newX = pos.x - dragOffset.x;
                    newY = pos.y - dragOffset.y;
                    if (canvas) {
                        newX = clamp(newX, 0, canvas.width);
                        newY = clamp(newY, 0, canvas.height);
                    }
                    broadcastMove(obj.id, newX, newY);
                    return { ...obj, x: newX, y: newY };
                }
                const mapScale = getCurrentScale();
                // @ts-expect-error - updateAbilityPosition
                const updatedObj = updateAbilityPosition(obj, pos, specialDragMode, dragOffset, wallCenterStart, mapScale);
                if (updatedObj.x !== undefined && updatedObj.y !== undefined) {
                    broadcastMove(updatedObj.id, updatedObj.x, updatedObj.y);
                }
                return updatedObj;
            });
            drawingsRef.current = updatedList; // Mise à jour Ref
            redrawMainCanvas(); // Redessiner
            return;
        }

        if (!isDrawing) return;
        if (currentTool === 'eraser') { eraseObjectAt(pos.x, pos.y); return; }
        if (currentTool === 'pen') {
            pointsRef.current.push(pos);
            const tempCtx = getContext(tempCanvasRef);
            if (!tempCtx || !tempCanvasRef.current) return;
            tempCtx.clearRect(0, 0, tempCanvasRef.current.width, tempCtx.canvas.height);
            tempCtx.strokeStyle = color; tempCtx.lineWidth = thickness;
            tempCtx.lineCap = 'round'; tempCtx.lineJoin = 'round'; tempCtx.globalAlpha = opacity;
            if (strokeType === 'dashed' || strokeType === 'dashed-arrow') tempCtx.setLineDash([thickness * 2, thickness * 2]); else tempCtx.setLineDash([]);
            if (strokeType === 'rect') tempCtx.strokeRect(startPosRef.current.x, startPosRef.current.y, pos.x - startPosRef.current.x, pos.y - startPosRef.current.y);
            else {
                drawSmoothLine(tempCtx, pointsRef.current);
                if ((strokeType === 'arrow' || strokeType === 'dashed-arrow') && pointsRef.current.length > 2) {
                    const last = pointsRef.current[pointsRef.current.length - 1];
                    const prev = pointsRef.current[Math.max(0, pointsRef.current.length - 5)];
                    if(prev && last) drawArrowHead(tempCtx, prev.x, prev.y, last.x, last.y, thickness);
                }
            }
        }
    };

    const handleMouseUp = () => {
        if (draggingObjectId !== null) {
            // COMMIT DU DRAG : C'est ici qu'on met à jour le State React et la DB
            if (isOverTrash) {
                const updatedDrawings = drawingsRef.current.filter(obj => obj.id !== draggingObjectId);
                drawingsRef.current = updatedDrawings;
            }

            // Sync with Steps State via REF to avoid closure issues
            const newSteps = [...stepsRef.current];
            if (newSteps[currentStepIndexRef.current]) {
                newSteps[currentStepIndexRef.current] = { ...newSteps[currentStepIndexRef.current], data: drawingsRef.current };
            }

            updateStepsIfChanged(newSteps); // SMART UPDATE
            lastSavedDataRef.current = JSON.stringify(newSteps);
            debouncedSaveData.cancel();
            immediateSave(newSteps, currentStepIndexRef.current);

            setIsOverTrash(false);
            setDraggingObjectId(null);
            setSpecialDragMode(null);
            setDragOffset({ x: 0, y: 0 });
            interactionTimeoutRef.current = setTimeout(() => { isInteractingRef.current = false; }, 800);
            redrawMainCanvas();
            return;
        }

        if (isDrawing) {
            if (JSON.stringify(startHistoryRef.current) !== JSON.stringify(drawingsRef.current)) {
                addToHistory(startHistoryRef.current);
            }

            setIsDrawing(false);
            if (currentTool === 'pen') {
                if (pointsRef.current.length > 1) {
                    const newPenObject: DrawingObject = {
                        id: generateId(),
                        tool: strokeType === 'rect' ? 'rect' : 'pen',
                        lineType: strokeType,
                        points: strokeType === 'rect' ? [startPosRef.current, pointsRef.current[pointsRef.current.length - 1]] : [...pointsRef.current],
                        color: color,
                        thickness: thickness,
                        opacity: opacity
                    };
                    drawingsRef.current = [...drawingsRef.current, newPenObject];

                    const newSteps = [...stepsRef.current];
                    if (newSteps[currentStepIndexRef.current]) {
                        newSteps[currentStepIndexRef.current] = { ...newSteps[currentStepIndexRef.current], data: drawingsRef.current };
                    }
                    updateStepsIfChanged(newSteps);
                    lastSavedDataRef.current = JSON.stringify(newSteps);
                    debouncedSaveData.cancel();
                    immediateSave(newSteps, currentStepIndexRef.current);
                }
                const tempCtx = getContext(tempCanvasRef);
                if (tempCtx) tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
            }
            pointsRef.current = [];
        }

        if (isPanning) {
            setIsPanning(false);
            if(containerRef.current) containerRef.current.style.cursor = currentTool === 'cursor' ? 'default' : (currentTool ? 'crosshair' : 'grab');
        }

        setIsOverTrash(false);
        interactionTimeoutRef.current = setTimeout(() => { isInteractingRef.current = false; }, 800);
    };

    const handleMouseLeave = () => { handleMouseUp(); };

    const handleClearAll = () => {
        addToHistory(drawingsRef.current);
        drawingsRef.current = [];
        redrawMainCanvas();
        setCurrentTool('cursor');
        if(strategyId) {
            const newSteps = stepsRef.current.map((s, i) => i === currentStepIndexRef.current ? { ...s, data: [] } : s);
            updateStepsIfChanged(newSteps);
            lastSavedDataRef.current = JSON.stringify(newSteps);
            debouncedSaveData.cancel();
            immediateSave(newSteps, currentStepIndexRef.current);
        }
    };

    const handleClearType = (filter: (obj: DrawingObject) => boolean) => {
        const newDrawings = drawingsRef.current.filter(obj => !filter(obj));
        drawingsRef.current = newDrawings;
        redrawMainCanvas();
        if(strategyId) {
            const newSteps = stepsRef.current.map((s, i) => i === currentStepIndexRef.current ? { ...s, data: newDrawings } : s);
            updateStepsIfChanged(newSteps);
            lastSavedDataRef.current = JSON.stringify(newSteps);
            debouncedSaveData.cancel();
            immediateSave(newSteps, currentStepIndexRef.current);
        }
    };
    const handleClearAgents = () => handleClearType(obj => obj.tool === 'image' && obj.subtype === 'agent');
    const handleClearAbilities = () => handleClearType(obj => (obj.tool === 'image' && obj.subtype === 'ability') || (!['image', 'text', 'pen', 'rect'].includes(obj.tool as string) && !obj.lineType));
    const handleClearText = () => handleClearType(obj => obj.tool === 'text');
    const handleClearDrawings = () => handleClearType(obj => ['pen', 'dashed', 'arrow', 'dashed-arrow', 'rect'].includes(obj.tool as string) || (obj.tool === 'pen'));

    // --- UTILS ---
    const getCursorStyle = () => {
        if (transformRef.current.scale <= 0.501) {
            if (currentTool === 'cursor') return 'default';
        }
        if (isPanning) return 'grabbing';
        if (currentTool === 'cursor' || currentTool === 'tools' || currentTool === 'settings') return 'default';
        if (currentTool === 'eraser') return 'crosshair';
        return 'crosshair';
    };

    // --- CONTEXT MENU ---
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const pos = getMousePos(e);
        const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return;
        const finalX = pos.x;
        const finalY = pos.y;

        const currentList = [...drawingsRef.current];
        let hasDeleted = false;
        const mapScale = getCurrentScale();
        const HIT_TOLERANCE = 15;

        for (let i = currentList.length - 1; i >= 0; i--) {
            const obj = currentList[i];
            let hit = false;

            if (obj.tool === 'image' && obj.x != null && obj.y != null) {
                const w = (obj.width || iconSize) * mapScale;
                const h = (obj.height || iconSize) * mapScale;
                if (finalX >= obj.x - w/2 - HIT_TOLERANCE && finalX <= obj.x + w/2 + HIT_TOLERANCE &&
                    finalY >= obj.y - h/2 - HIT_TOLERANCE && finalY <= obj.y + h/2 + HIT_TOLERANCE) hit = true;
            }
            else if (obj.tool === 'vision') {
                if (Math.hypot((obj as VisionObject).x - finalX, (obj as VisionObject).y - finalY) < 20) hit = true;
            }
            else if (obj.tool === 'text' && obj.x != null) {
                const fontSize = (obj.fontSize || 20) * mapScale;
                const textWidth = (obj.text?.length || 1) * fontSize * 0.7 + 20;
                const textHeight = fontSize + 20;
                if (Math.abs(finalX - obj.x) < (textWidth / 2) && Math.abs(finalY - obj.y!) < (textHeight / 2)) hit = true;
            }
            else if (['pen', 'dashed', 'arrow', 'dashed-arrow'].includes(obj.tool as string) || obj.tool === 'pen') {
                const tolerance = (obj.thickness || 4) + 20;
                const hitLine = obj.points.some((p, idx) => {
                    if (idx === 0) return false;
                    const prev = obj.points[idx - 1];
                    return Math.hypot(p.x - finalX, p.y - finalY) < tolerance || distanceToSegment(pos, prev, p) < tolerance;
                });
                if (hitLine) hit = true;
            }
            else if (obj.tool === 'rect' && obj.points.length > 1) {
                const p1 = obj.points[0]; const p2 = obj.points[1];
                const margin = 10;
                const minX = Math.min(p1.x, p2.x) - margin; const maxX = Math.max(p1.x, p2.x) + margin;
                const minY = Math.min(p1.y, p2.y) - margin; const maxY = Math.max(p1.y, p2.y) + margin;
                if(finalX >= minX && finalX <= maxX && finalY >= minY && finalY <= maxY) hit = true;
            }
            else {
                // @ts-expect-error - checkAbilityHit with partial
                if (checkAbilityHit(pos, obj, mapScale)) hit = true;
            }

            if (hit) {
                addToHistory(drawingsRef.current);
                currentList.splice(i, 1);
                hasDeleted = true;
                break;
            }
        }

        if (hasDeleted) {
            drawingsRef.current = currentList;
            redrawMainCanvas();

            const newSteps = [...stepsRef.current];
            if (newSteps[currentStepIndexRef.current]) {
                newSteps[currentStepIndexRef.current] = { ...newSteps[currentStepIndexRef.current], data: currentList };
            }
            updateStepsIfChanged(newSteps);
            lastSavedDataRef.current = JSON.stringify(newSteps);
            debouncedSaveData.cancel();
            immediateSave(newSteps, currentStepIndexRef.current);
        }
    };

    // Step Helpers
    const handleAddStep = () => { const n = [...stepsRef.current, { id: generateId().toString(), name: `Phase ${stepsRef.current.length + 1}`, data: [], notes: [] }]; const idx = stepsRef.current.length; updateStepsIfChanged(n); lastSavedDataRef.current = JSON.stringify(n); immediateSave(n, idx); setCurrentStepIndex(idx); };
    const handleDuplicateStep = () => { const curr = stepsRef.current[currentStepIndexRef.current]; const n = [...stepsRef.current]; n.splice(currentStepIndexRef.current + 1, 0, { id: generateId().toString(), name: `${curr.name} (Copy)`, data: JSON.parse(JSON.stringify(curr.data)), notes: JSON.parse(JSON.stringify(curr.notes || [])) }); const idx = currentStepIndexRef.current + 1; updateStepsIfChanged(n); lastSavedDataRef.current = JSON.stringify(n); immediateSave(n, idx); setCurrentStepIndex(idx); };
    const handleDeleteStep = (idx: number) => { if (stepsRef.current.length <= 1) return; const n = stepsRef.current.filter((_, i) => i !== idx); const newIdx = currentStepIndexRef.current >= idx && currentStepIndexRef.current > 0 ? currentStepIndexRef.current - 1 : currentStepIndexRef.current; updateStepsIfChanged(n); lastSavedDataRef.current = JSON.stringify(n); immediateSave(n, newIdx); setCurrentStepIndex(newIdx); };
    const handleRenameStep = (idx: number, name: string) => { const n = stepsRef.current.map((s, i) => i === idx ? { ...s, name } : s); updateStepsIfChanged(n); lastSavedDataRef.current = JSON.stringify(n); immediateSave(n, currentStepIndexRef.current); };

    // Note Helpers
    const handleAddNote = () => { const n = [...stepsRef.current]; const notes = n[currentStepIndexRef.current].notes || []; n[currentStepIndexRef.current] = { ...n[currentStepIndexRef.current], notes: [...notes, { id: generateId().toString(), text: 'Nouvelle note', createdAt: Date.now(), color: '#ffffff', fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', backgroundColor: null }] }; updateStepsIfChanged(n); lastSavedDataRef.current = JSON.stringify(n); immediateSave(n, currentStepIndexRef.current); };
    const handleUpdateNote = (id: string, u: Partial<StrategyNote>) => { const n = [...stepsRef.current]; const s = n[currentStepIndexRef.current]; if(!s.notes) return; const idx = s.notes.findIndex(x=>x.id===id); if(idx===-1) return; s.notes[idx]={...s.notes[idx], ...u}; updateStepsIfChanged(n); lastSavedDataRef.current = JSON.stringify(n); debouncedSaveData(strategyId, n, currentStepIndexRef.current); };
    const handleDeleteNote = (id: string) => { const n = [...stepsRef.current]; const s = n[currentStepIndexRef.current]; if(!s.notes) return; s.notes = s.notes.filter(x=>x.id!==id); updateStepsIfChanged(n); lastSavedDataRef.current = JSON.stringify(n); immediateSave(n, currentStepIndexRef.current); };

    // Text & Drop Helpers
    const handleSaveText = (d: { text: string; color: string; fontSize: number; isBold: boolean; isItalic: boolean }) => {
        addToHistory(drawingsRef.current);
        let currentList = [...drawingsRef.current];
        if (editingTextId !== null) {
            currentList = currentList.map(obj => obj.id === editingTextId ? { ...obj, text: d.text, color: d.color, fontSize: d.fontSize, fontWeight: d.isBold ? 'bold' : 'normal', fontStyle: d.isItalic ? 'italic' : 'normal' } : obj);
            setEditingTextId(null);
        } else {
            // Création d'un nouveau texte
            let x = 100, y = 100;
            if (clickPosRef.current) {
                x = clickPosRef.current.x;
                y = clickPosRef.current.y;
            } else if (containerRef.current && imgRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const { x: tx, y: ty, scale } = transformRef.current;
                x = (containerRect.width / 2 - tx) / scale;
                y = (containerRect.height / 2 - ty) / scale;
            }

            const newText: DrawingObject = {
                id: generateId(), tool: 'text', text: d.text, points: [], x: x, y: y, color: d.color, fontSize: d.fontSize,
                fontWeight: d.isBold ? 'bold' : 'normal', fontStyle: d.isItalic ? 'italic' : 'normal', thickness: 0, opacity: 1
            };
            currentList.push(newText);
        }

        drawingsRef.current = currentList;

        const newSteps = [...stepsRef.current];
        if (newSteps[currentStepIndexRef.current]) newSteps[currentStepIndexRef.current].data = currentList;
        updateStepsIfChanged(newSteps);

        // Synchro & Save
        lastSavedDataRef.current = JSON.stringify(newSteps);
        debouncedSaveData.cancel();
        immediateSave(newSteps, currentStepIndexRef.current);

        setIsTextModalOpen(false); clickPosRef.current = null; setCurrentTool('cursor'); redrawMainCanvas();
    };

    const handleDoubleClick = (e: React.MouseEvent) => { const pos = getMousePos(e); for(let i=drawingsRef.current.length-1; i>=0; i--) { const obj = drawingsRef.current[i]; if(obj.tool === 'text' && obj.x !== undefined) { const fontSize = obj.fontSize || 20; const w = (obj.text?.length || 0) * fontSize * 0.6; if (Math.abs(pos.x - obj.x) < w / 2 && Math.abs(pos.y - obj.y!) < fontSize / 2) { setEditingTextId(obj.id); setIsTextModalOpen(true); return; } } } };

    // --- TEXT MENU HANDLER ---
    const handleTextMenu = (id: number, updates: Partial<DrawingObject>) => {
        drawingsRef.current = drawingsRef.current.map(obj => obj.id === id ? { ...obj, ...updates } : obj);
        redrawMainCanvas();

        const newSteps = [...stepsRef.current];
        if (newSteps[currentStepIndexRef.current]) newSteps[currentStepIndexRef.current].data = drawingsRef.current;
        updateStepsIfChanged(newSteps);

        lastSavedDataRef.current = JSON.stringify(newSteps);
        debouncedSaveData.cancel();
        immediateSave(newSteps, currentStepIndexRef.current);
    };

    // --- DRAG AND DROP HANDLER ---
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const jsonData = e.dataTransfer.getData("application/json"); if (!jsonData) return;
        try {
            // FIX TS: Cast strict pour éviter l'erreur "Argument type"
            const { type, name } = JSON.parse(jsonData) as { type: ToolType, name: string };

            const { x, y } = getMousePos(e);
            const img = imgRef.current; if (!img) return;
            const finalX = clamp(x, 0, img.clientWidth);
            const finalY = clamp(y, 0, img.clientHeight);
            addToHistory(drawingsRef.current);
            const newObj = createDrawingFromDrop(type, name, finalX, finalY);

            if (newObj) {
                newObj.id = generateId();
                const newList = [...drawingsRef.current, newObj];
                drawingsRef.current = newList;
                setCurrentTool('cursor');

                const newSteps = [...stepsRef.current];
                if (newSteps[currentStepIndexRef.current]) {
                    newSteps[currentStepIndexRef.current] = { ...newSteps[currentStepIndexRef.current], data: newList };
                }
                updateStepsIfChanged(newSteps);

                // Synchro & Save
                lastSavedDataRef.current = JSON.stringify(newSteps);
                debouncedSaveData.cancel();
                immediateSave(newSteps, currentStepIndexRef.current);

                redrawMainCanvas();
            }
        } catch (err) { console.error("Drop error", err); }
    };

    const handleCreateInFolder = () => navigate(currentFolderId ? `/create?folderId=${currentFolderId}` : '/create');
    const handleFolderChange = async (fid: string) => { setCurrentFolderId(fid); if (strategyId) await supabase.from('strategies').update({ folder_id: fid || null }).eq('id', strategyId); };
    const confirmDelete = async () => { if (!strategyId) return; const { error } = await supabase.from('strategies').delete().eq('id', strategyId); if (!error) navigate('/'); };
    const handleDeleteRequest = () => setShowDeleteModal(true);
    const handleNavigateToStrategy = (id: string) => navigate(`/editor/${id}`);
    const handleLoadStrategy = (s: any) => { if (s?.data) { if (Array.isArray(s.data)) { updateStepsIfChanged([{ id: 'init', name: 'Setup', data: s.data }]); setCurrentStepIndex(0); } else if (s.data.steps) { updateStepsIfChanged(s.data.steps); setCurrentStepIndex(s.data.currentStepIndex || 0); } } setShowLoadModal(false); };

    return {
        mainCanvasRef, tempCanvasRef, containerRef, imgRef, trashRef, contentRef, centerView, panCanvas,
        drawings: drawingsRef.current, steps, currentStepIndex, setCurrentStepIndex,
        currentMapSrc, activeMapSrc, activeCallsSrc, reverseMapSrc, callsMapSrc, reverseCallsMapSrc,
        reverseMapError, setReverseMapError, reverseCallsError, setReverseCallsError,
        isLoading, showLoadModal, setShowLoadModal, savedStrategies,
        isTextModalOpen, setIsTextModalOpen, showDeleteModal, setShowDeleteModal,
        editingObj, setEditingTextId, folders, currentFolderId,
        currentTool, setCurrentTool, strokeType, setStrokeType, color, setColor, opacity, setOpacity, thickness, setThickness, selectedAgent, setSelectedAgent,
        // Ajout des états manquants
        selectedAbility, setSelectedAbility,
        showZones, setShowZones, showMapCalls, setShowMapCalls, iconSize, setIconSize,
        // ICI : On passe la fonction personnalisée au lieu du setter classique
        isRotated, setIsRotated: handleToggleRotation,
        isOverTrash, getCursorStyle,
        handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleContextMenu, handleDrop, handleDoubleClick,
        handleClearAll, handleClearAgents, handleClearAbilities, handleClearText, handleClearDrawings,
        handleSaveText, handleLoadStrategy,
        handleAddStep, handleDuplicateStep, handleDeleteStep, handleRenameStep,
        handleFolderChange, handleDeleteRequest, confirmDelete,
        fetchStrategies, remoteCursors, handleNavigateToStrategy, handleCreateInFolder,
        editingNoteId, setEditingNoteId, handleAddNote, handleUpdateNote, handleDeleteNote, handleTextMenu,
        currentNotes: steps[currentStepIndex]?.notes || [],
    };
};