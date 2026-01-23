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
    const currentStepIndexRef = useRef(0);

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

    // Rotation State (Initialisé via DB dans loadInitialData)
    const [isRotated, setIsRotated] = useState(false);

    const [showMapCalls, setShowMapCalls] = useState(true);
    const [reverseMapError, setReverseMapError] = useState(false);
    const [reverseCallsError, setReverseCallsError] = useState(false);
    const [steps, setSteps] = useState<StrategyStep[]>([{ id: 'init', name: 'Setup', data: [], notes: [] }]);
    const [currentStepIndex, setCurrentStepIndexState] = useState(0);
    const [showZones, setShowZones] = useState(true);
    const [iconSize, setIconSize] = useState(30);
    const [folders, setFolders] = useState<{id: string, name: string}[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string>("");
    const [isTextModalOpen, setIsTextModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingTextId, setEditingTextId] = useState<number | null>(null);
    const [currentTool, setCurrentTool] = useState<ToolType | 'tools' | 'settings' | 'text' | null>('cursor');
    const [strokeType, setStrokeType] = useState<StrokeType>('solid');
    const [color, setColor] = useState('#ef4444');
    const [opacity, setOpacity] = useState(1);
    const [thickness, setThickness] = useState(4);
    const [selectedAgent, setSelectedAgent] = useState('jett');
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [draggingObjectId, setDraggingObjectId] = useState<number | null>(null);
    const [isOverTrash, setIsOverTrash] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [specialDragMode, setSpecialDragMode] = useState<string | null>(null);
    const [wallCenterStart, setWallCenterStart] = useState({ x: 0, y: 0 });
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

    // --- AUTH ---
    const { user } = useAuth();

    // --- COMPUTED MAP SOURCES (GESTION ROTATION) ---
    // C'est ici que la magie opère pour la rotation
    const { reverseMapSrc, callsMapSrc, reverseCallsMapSrc } = useMemo(() => {
        if (!currentMapSrc) return { reverseMapSrc: null, callsMapSrc: null, reverseCallsMapSrc: null };

        // Exemple: /maps/bind.svg
        const parts = currentMapSrc.split('.');
        const ext = parts.pop();
        const base = parts.join('.');

        return {
            reverseMapSrc: `${base}_reverse.${ext}`,       // /maps/bind_reverse.svg
            callsMapSrc: `${base}_calls.${ext}`,           // /maps/bind_calls.svg
            reverseCallsMapSrc: `${base}_calls_reverse.${ext}` // /maps/bind_calls_reverse.svg
        };
    }, [currentMapSrc]);

    // La source active pour la MAP (normale ou inversée)
    const activeMapSrc = useMemo(() => {
        if (!currentMapSrc) return null;

        return isRotated ? (reverseMapSrc || currentMapSrc) : currentMapSrc;
    }, [isRotated, currentMapSrc, reverseMapSrc]);

    // La source active pour les CALLS (normale ou inversée)
    const activeCallsSrc = useMemo(() => {
        if (!callsMapSrc) return null;
        return isRotated ? (reverseCallsMapSrc || callsMapSrc) : callsMapSrc;
    }, [isRotated, callsMapSrc, reverseCallsMapSrc]);


    // --- COMPUTED ---
    const getCurrentScale = () => {
        const entry = Object.entries(MAP_CONFIGS).find(([, config]) => config.src === currentMapSrc);
        return entry ? entry[1].scale : 0.75;
    };

    const setCurrentStepIndex = (index: number) => {
        currentStepIndexRef.current = index;
        setCurrentStepIndexState(index);
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
            // On passe isRotated au renderer pour qu'il sache comment dessiner les objets (s'il gère leur rotation interne)
            renderDrawings(ctx, drawingsRef.current, imageCache.current, redrawMainCanvas, draggingObjectId, showZones, mapScale, iconSize, isRotated);
        });
    }, [draggingObjectId, showZones, currentMapSrc, iconSize, isRotated]);

    // --- SAVE LOGIC ---
    const immediateSave = useCallback((stepsData: StrategyStep[], idx: number = currentStepIndex) => {
        if (!strategyId) return;
        // @ts-expect-error - Partial update
        updateStrategyData(strategyId, { steps: stepsData, currentStepIndex: idx });
    }, [strategyId, currentStepIndex, updateStrategyData]);

    const debouncedSave = useMemo(() => debounce((id: string, stepsData: StrategyStep[], idx: number) => {
        // @ts-expect-error - Partial update
        updateStrategyData(id, { steps: stepsData, currentStepIndex: idx });
    }, 1000), [updateStrategyData]);

    // --- HISTORY ---
    const applyHistoryState = useCallback((newState: DrawingObject[]) => {
        drawingsRef.current = newState;
        redrawMainCanvas();
        setSteps(prev => {
            const newSteps = [...prev];
            if (newSteps[currentStepIndex]) {
                newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], data: newState };
            }
            immediateSave(newSteps);
            return newSteps;
        });
    }, [currentStepIndex, redrawMainCanvas, immediateSave]);

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

    const editingObj = editingTextId ? drawingsRef.current.find(d => d.id === editingTextId) : null;

    // --- EFFECTS ---
    useEffect(() => {
        if (steps[currentStepIndex]) {
            drawingsRef.current = steps[currentStepIndex].data;
            redrawMainCanvas();
        }
    }, [steps, currentStepIndex, redrawMainCanvas]);

    useEffect(() => {
        setReverseMapError(false);
        setReverseCallsError(false);
    }, [currentMapSrc]);

    useEffect(() => {
        if (currentTool === 'text') setIsTextModalOpen(true);
    }, [currentTool]);

    // --- SAVE ROTATION STATE TO DB ---
    useEffect(() => {
        if (!isLoaded || !strategyId) return;
        // @ts-expect-error - adding is_rotated to payload
        updateStrategyData(strategyId, { is_rotated: isRotated });
    }, [isRotated, isLoaded, strategyId, updateStrategyData]);

    // --- INITIAL DATA LOADING ---
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

                // Charger l'état de rotation
                if (data.is_rotated !== undefined) {
                    setIsRotated(data.is_rotated);
                }

                const rawData = data.data;
                if (Array.isArray(rawData)) {
                    setSteps([{ id: 'init', name: 'Setup', data: rawData, notes: [] }]);
                    setCurrentStepIndex(0);
                } else if (rawData && rawData.steps) {
                    const loadedSteps = rawData.steps.map((s: StrategyStep) => ({
                        ...s,
                        notes: s.notes || []
                    }));
                    setSteps(loadedSteps);
                    setCurrentStepIndex(rawData.currentStepIndex || 0);
                }
            }
            setIsLoaded(true);
        };
        loadInitialData();
    }, [strategyId, fetchStrategies, user, getStrategyById]);

    // --- REALTIME ---
    const { broadcastMove, broadcastCursor, remoteCursors } = useRealtimeStrategy(
        strategyId,
        user,
        setSteps,
        currentStepIndexRef,
        isRemoteUpdate,
        isInteractingRef
    );

    // --- AUTO-SAVE ---
    useEffect(() => {
        if (!isLoaded || !strategyId) return;
        if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }
        if (isInteractingRef.current) return;

        debouncedSave(strategyId, steps, currentStepIndex);

        return () => debouncedSave.cancel();
    }, [steps, currentStepIndex, strategyId, isLoaded, debouncedSave, isRemoteUpdate, isInteractingRef]);

    // --- GRAPHIC HELPERS ---
    const getAdjustedCoordinates = (clientX: number, clientY: number) => {
        const canvas = tempCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let x = (clientX - rect.left) * scaleX;
        let y = (clientY - rect.top) * scaleY;
        // NOTE: Si on utilise une image "map_reverse.svg", le canvas lui-même n'est PAS forcément rotaté géométriquement par CSS.
        // Si votre logique précédente inversait les coordonnées ici, il faut le garder.
        // Si vous utilisiez juste une image différente, alors "isRotated" ici doit peut-être être désactivé ou adapté.
        // Je laisse comme c'était :
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
            setSteps(prev => {
                const newSteps = [...prev];
                if (newSteps[currentStepIndex]) {
                    newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], data: newDrawings };
                }
                debouncedSave.cancel();
                immediateSave(newSteps);
                return newSteps;
            });
            redrawMainCanvas();
        }
    };

    // --- CANVAS RESIZE ---
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
        // On écoute le load pour redimensionner quand l'image change (ex: rotation)
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

        if (currentTool === 'agent') {
            const newObj: DrawingObject = { id: generateId(), tool: 'image', subtype: 'agent', points: [], color: '#fff', thickness: 0, opacity: 1, imageSrc: selectedAgent, x: pos.x, y: pos.y, width: iconSize, height: iconSize };
            drawingsRef.current = [...drawingsRef.current, newObj];
            redrawMainCanvas();
            setSteps(prev => {
                const newSteps = [...prev];
                if (newSteps[currentStepIndex]) {
                    newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], data: drawingsRef.current };
                }
                debouncedSave.cancel();
                immediateSave(newSteps);
                return newSteps;
            });
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
            const isOver = e.clientX >= trashRect.left && e.clientX <= trashRect.right &&
                e.clientY >= trashRect.top && e.clientY <= trashRect.bottom;
            setIsOverTrash(isOver);
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
            drawingsRef.current = updatedList;
            redrawMainCanvas();
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
        if (draggingObjectId !== null && isOverTrash) {
            const updatedDrawings = drawingsRef.current.filter(obj => obj.id !== draggingObjectId);
            drawingsRef.current = updatedDrawings;
            setSteps(prev => {
                const newSteps = [...prev];
                if (newSteps[currentStepIndex]) {
                    newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], data: updatedDrawings };
                }
                debouncedSave.cancel();
                immediateSave(newSteps);
                return newSteps;
            });
            setIsOverTrash(false);
            setDraggingObjectId(null);
            setSpecialDragMode(null);
            setDragOffset({ x: 0, y: 0 });
            isInteractingRef.current = false;
            redrawMainCanvas();
            return;
        }

        if (isDrawing || draggingObjectId !== null) {
            if (JSON.stringify(startHistoryRef.current) !== JSON.stringify(drawingsRef.current)) {
                addToHistory(startHistoryRef.current);
            }
        }

        if (draggingObjectId !== null) {
            const finalData = [...drawingsRef.current];
            setSteps(prev => {
                const newSteps = [...prev];
                if (newSteps[currentStepIndex]) {
                    newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], data: finalData };
                }
                debouncedSave.cancel();
                immediateSave(newSteps);
                return newSteps;
            });
        }

        if (isPanning) {
            setIsPanning(false);
            if(containerRef.current) containerRef.current.style.cursor = currentTool === 'cursor' ? 'default' : (currentTool ? 'crosshair' : 'grab');
        }
        setDraggingObjectId(null); setSpecialDragMode(null); setDragOffset({ x: 0, y: 0 });
        setIsOverTrash(false);

        if (isDrawing) {
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

                    setSteps(prev => {
                        const newSteps = [...prev];
                        if (newSteps[currentStepIndex]) {
                            newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], data: drawingsRef.current };
                        }
                        debouncedSave.cancel();
                        immediateSave(newSteps);
                        return newSteps;
                    });
                }
                const tempCtx = getContext(tempCanvasRef);
                if (tempCtx) tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
            }
            pointsRef.current = [];
        }

        isInteractingRef.current = false;
    };

    const handleMouseLeave = () => {
        handleMouseUp();
        isInteractingRef.current = false;
        setIsOverTrash(false);
    };

    const handleClearAll = () => {
        addToHistory(drawingsRef.current);
        drawingsRef.current = [];
        redrawMainCanvas();
        setCurrentTool('cursor');

        if(strategyId) {
            setSteps(prevSteps => {
                const newSteps = prevSteps.map((s, i) =>
                    i === currentStepIndex ? { ...s, data: [] } : s
                );
                debouncedSave.cancel();
                immediateSave(newSteps, currentStepIndex);
                return newSteps;
            });
        }
    };

    const handleClearType = (typeFilter: (obj: DrawingObject) => boolean) => {
        const newDrawings = drawingsRef.current.filter(obj => !typeFilter(obj));
        drawingsRef.current = newDrawings;
        redrawMainCanvas();
        if(strategyId) {
            setSteps(prevSteps => {
                const newSteps = prevSteps.map((s, i) =>
                    i === currentStepIndex ? { ...s, data: newDrawings } : s
                );
                debouncedSave.cancel();
                immediateSave(newSteps, currentStepIndex);
                return newSteps;
            });
        }
    };
    const handleClearAgents = () => handleClearType(obj => obj.tool === 'image' && obj.subtype === 'agent');
    const handleClearAbilities = () => handleClearType(obj =>
        (obj.tool === 'image' && obj.subtype === 'ability') ||
        (!['image', 'text', 'pen', 'rect'].includes(obj.tool as string) && !obj.lineType)
    );
    const handleClearText = () => handleClearType(obj => obj.tool === 'text');
    const handleClearDrawings = () => handleClearType(obj =>
        ['pen', 'dashed', 'arrow', 'dashed-arrow', 'rect'].includes(obj.tool as string) ||
        (obj.tool === 'pen')
    );

    const getCursorStyle = () => {
        if (transformRef.current.scale <= 0.501) {
            if (currentTool === 'cursor') return 'default';
        }

        if (isPanning) return 'grabbing';
        if (currentTool === 'cursor' || currentTool === 'tools' || currentTool === 'settings') {
            return 'default';
        }
        if (currentTool === 'eraser') return 'crosshair';
        return 'crosshair';
    };

    const handleAddNote = () => {
        setSteps(prevSteps => {
            const newSteps = [...prevSteps];
            const currentNotes = newSteps[currentStepIndex].notes || [];

            newSteps[currentStepIndex] = {
                ...newSteps[currentStepIndex],
                notes: [
                    ...currentNotes,
                    {
                        id: generateId().toString(),
                        text: 'Nouvelle note',
                        createdAt: Date.now(),
                        color: '#ffffff',
                        fontSize: 16,
                        fontWeight: 'normal',
                        fontStyle: 'normal',
                        textDecoration: 'none',
                        backgroundColor: null
                    }
                ]
            };
            immediateSave(newSteps);
            return newSteps;
        });
    };

    const handleUpdateNote = (noteId: string, updates: Partial<StrategyNote>) => {
        setSteps(prevSteps => {
            const newSteps = [...prevSteps];
            const currentStep = newSteps[currentStepIndex];
            if (!currentStep.notes) return prevSteps;

            const noteIndex = currentStep.notes.findIndex(n => n.id === noteId);
            if (noteIndex === -1) return prevSteps;

            const updatedNotes = [...currentStep.notes];
            updatedNotes[noteIndex] = { ...updatedNotes[noteIndex], ...updates };

            newSteps[currentStepIndex] = { ...currentStep, notes: updatedNotes };

            debouncedSave(strategyId, newSteps, currentStepIndex);
            return newSteps;
        });
        setIsTextModalOpen(false);
        setEditingNoteId(null);
    };
    const handleDeleteNote = (noteId: string) => {
        setSteps(prevSteps => {
            const newSteps = [...prevSteps];
            const currentStep = newSteps[currentStepIndex];
            if (!currentStep.notes) return prevSteps;

            newSteps[currentStepIndex] = {
                ...currentStep,
                notes: currentStep.notes.filter(n => n.id !== noteId)
            };
            immediateSave(newSteps);
            return newSteps;
        });
    };

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
            setSteps(prevSteps => {
                const newSteps = [...prevSteps];
                if (newSteps[currentStepIndex]) {
                    newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], data: currentList };
                }
                debouncedSave.cancel();
                immediateSave(newSteps);
                return newSteps;
            });
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const jsonData = e.dataTransfer.getData("application/json"); if (!jsonData) return;
        try {
            const { type, name } = JSON.parse(jsonData);
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
                setSteps(prevSteps => {
                    const newSteps = [...prevSteps];
                    if (newSteps[currentStepIndex]) {
                        newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], data: newList };
                    }
                    debouncedSave.cancel();
                    immediateSave(newSteps);
                    return newSteps;
                });
            }
        } catch (err) { console.error("Drop error", err); }
    };

    const handleSaveText = (drawingData: DrawingObject) => {
        addToHistory(drawingsRef.current);

        const currentList = [...drawingsRef.current];

        const existingIndex = currentList.findIndex(d => d.id === drawingData.id);

        if (existingIndex !== -1) {
            currentList[existingIndex] = {
                ...currentList[existingIndex],
                ...drawingData
            };
            setEditingTextId(null);
        } else {
            const newTextObj: DrawingObject = {
                ...drawingData,
                id: drawingData.id || generateId(),
                tool: 'text',
                points: [],
                thickness: 0,
                opacity: 1
            };
            currentList.push(newTextObj);
        }

        drawingsRef.current = currentList;

        setSteps(prevSteps => {
            const newSteps = [...prevSteps];
            if (newSteps[currentStepIndex]) {
                newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], data: currentList };
            }
            debouncedSave.cancel();
            immediateSave(newSteps);
            return newSteps;
        });

        setIsTextModalOpen(false);
        setCurrentTool('cursor');
        redrawMainCanvas();
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        const pos = getMousePos(e);
        for (let i = drawingsRef.current.length - 1; i >= 0; i--) {
            const obj = drawingsRef.current[i];
            if (obj.tool === 'text' && obj.x !== undefined && obj.y !== undefined) {
                const fontSize = obj.fontSize || 20;
                const approxWidth = (obj.text?.length || 0) * (fontSize * 0.6);
                if (Math.abs(pos.x - obj.x) < approxWidth/2 && Math.abs(pos.y - obj.y) < fontSize/2) {
                    setEditingTextId(obj.id);
                    setIsTextModalOpen(true);
                    return;
                }
            }
        }
    };

    const handleAddStep = () => {
        setSteps(prevSteps => {
            const newSteps = [...prevSteps, { id: generateId().toString(), name: `Phase ${prevSteps.length + 1}`, data: [], notes: [] }];
            const newIndex = prevSteps.length;
            immediateSave(newSteps, newIndex);
            setCurrentStepIndex(newIndex);
            return newSteps;
        });
    };

    const handleDuplicateStep = () => {
        setSteps(prevSteps => {
            const currentStep = prevSteps[currentStepIndex];
            const clonedData = JSON.parse(JSON.stringify(currentStep.data));
            const newStep = {
                id: generateId().toString(),
                name: `${currentStep.name} (Copy)`,
                data: clonedData,
                notes: currentStep.notes ? JSON.parse(JSON.stringify(currentStep.notes)) : []
            };
            const newSteps = [...prevSteps];
            newSteps.splice(currentStepIndex + 1, 0, newStep);
            const newIndex = currentStepIndex + 1;
            immediateSave(newSteps, newIndex);
            setCurrentStepIndex(newIndex);
            return newSteps;
        });
    };

    const handleDeleteStep = (index: number) => {
        if (steps.length <= 1) return;
        setSteps(prevSteps => {
            const newSteps = prevSteps.filter((_, i) => i !== index);
            let newIndex = currentStepIndex;
            if (currentStepIndex >= index && currentStepIndex > 0) {
                newIndex = currentStepIndex - 1;
            }
            immediateSave(newSteps, newIndex);
            setCurrentStepIndex(newIndex);
            return newSteps;
        });
    };

    const handleRenameStep = (index: number, newName: string) => {
        setSteps(prevSteps => {
            const newSteps = prevSteps.map((s, i) => i === index ? { ...s, name: newName } : s);
            immediateSave(newSteps, currentStepIndex);
            return newSteps;
        });
    };

    const handleNavigateToStrategy = (id: string) => {
        navigate(`/editor/${id}`);
    };

    const handleCreateInFolder = () => {
        if (currentFolderId) {
            navigate(`/create?folderId=${currentFolderId}`);
        } else {
            navigate('/create');
        }
    };

    const handleFolderChange = async (newFolderId: string) => {
        setCurrentFolderId(newFolderId);
        if (strategyId) {
            await supabase.from('strategies').update({ folder_id: newFolderId || null }).eq('id', strategyId);
        }
    };

    const confirmDelete = async () => {
        if (!strategyId) return;
        const { error } = await supabase.from('strategies').delete().eq('id', strategyId);
        if (!error) navigate('/');
        else console.error("Error deleting:", error);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleLoadStrategy = (strat: any) => {
        if (strat && strat.data) {
            if (Array.isArray(strat.data)) {
                setSteps([{ id: 'init', name: 'Setup', data: strat.data, notes: [] }]);
                setCurrentStepIndex(0);
            } else if (strat.data.steps) {
                setSteps(strat.data.steps);
                setCurrentStepIndex(strat.data.currentStepIndex || 0);
            }
        }
        setShowLoadModal(false);
    };

    return {
        mainCanvasRef, tempCanvasRef, containerRef, imgRef, trashRef, contentRef, centerView, panCanvas,
        drawings: drawingsRef.current,
        steps, currentStepIndex, setCurrentStepIndex,
        currentMapSrc,
        activeMapSrc,
        activeCallsSrc,
        reverseMapSrc, callsMapSrc, reverseCallsMapSrc,
        reverseMapError, setReverseMapError,
        reverseCallsError, setReverseCallsError,
        isLoading, showLoadModal, setShowLoadModal, savedStrategies,
        isTextModalOpen, setIsTextModalOpen,
        showDeleteModal, setShowDeleteModal,
        editingObj, setEditingTextId,
        folders, currentFolderId,
        currentTool, setCurrentTool,
        strokeType, setStrokeType,
        color, setColor,
        opacity, setOpacity,
        thickness, setThickness,
        selectedAgent, setSelectedAgent,
        showZones, setShowZones,
        showMapCalls, setShowMapCalls,
        iconSize, setIconSize,
        isRotated, setIsRotated,
        isOverTrash, getCursorStyle,
        handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave,
        handleContextMenu, handleDrop, handleDoubleClick,
        handleClearAll, handleClearAgents, handleClearAbilities, handleClearText, handleClearDrawings,
        handleSaveText, handleLoadStrategy,
        handleAddStep, handleDuplicateStep, handleDeleteStep, handleRenameStep,
        handleFolderChange, handleDeleteRequest: () => setShowDeleteModal(true), confirmDelete,
        fetchStrategies,
        remoteCursors,
        handleNavigateToStrategy,
        handleCreateInFolder,
        editingNoteId, setEditingNoteId,
        handleAddNote, handleUpdateNote, handleDeleteNote,
        currentNotes: steps[currentStepIndex]?.notes || [],
    };
};