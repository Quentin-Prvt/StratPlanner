import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { supabase } from '../../supabaseClient';
import { useCanvasZoom } from '../../hooks/useCanvasZoom';
import { useSupabaseStrategies } from '../../hooks/useSupabase';
import { useRealtimeStrategy } from '../../hooks/useRealtimeStrategy';
import { checkAbilityHit, updateAbilityPosition } from '../../utils/canvasHitDetection';
import { drawSmoothLine, drawArrowHead } from '../../utils/canvasDrawing';
import { renderDrawings } from '../../utils/canvasRenderer';
import { createDrawingFromDrop } from '../../utils/dropFactory';
import { MAP_CONFIGS } from '../../utils/mapsRegistry';
import type { DrawingObject, ToolType, StrokeType, StrategyStep } from '../../types/canvas';

// Helper ID
const generateId = () => Date.now() + Math.random();

// --- MATH HELPERS POUR LA DETECTION DE CLIC ---
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

    // --- STATE REFS ---
    const drawingsRef = useRef<DrawingObject[]>([]);

    // Realtime Refs
    const isInteractingRef = useRef(false);
    const isRemoteUpdate = useRef(false);

    // Drawing Refs
    const pointsRef = useRef<{x: number, y: number}[]>([]);
    const startPosRef = useRef<{x: number, y: number}>({x: 0, y: 0});
    const panStartRef = useRef({ x: 0, y: 0 });
    const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

    // --- HOOKS ---
    const { transformRef, contentRef, updateTransformStyle } = useCanvasZoom(containerRef);
    const { savedStrategies, isLoading, showLoadModal, setShowLoadModal, fetchStrategies, getStrategyById, updateStrategyData } = useSupabaseStrategies();

    // --- STATES ---
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentMapSrc, setCurrentMapSrc] = useState<string | null>(null);

    const [isRotated, setIsRotated] = useState(false);
    const [showMapCalls, setShowMapCalls] = useState(true);
    const [reverseMapError, setReverseMapError] = useState(false);
    const [reverseCallsError, setReverseCallsError] = useState(false);

    const [steps, setSteps] = useState<StrategyStep[]>([{ id: 'init', name: 'Setup', data: [] }]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

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

    // --- COMPUTED ---
    const getCurrentScale = () => {
        const entry = Object.entries(MAP_CONFIGS).find(([_, config]) => config.src === currentMapSrc);
        return entry ? entry[1].scale : 1.0;
    };

    // Synchro State -> Ref
    useEffect(() => {
        if (steps[currentStepIndex]) {
            drawingsRef.current = steps[currentStepIndex].data;
            redrawMainCanvas();
        }
    }, [steps, currentStepIndex]);

    const editingObj = editingTextId ? drawingsRef.current.find(d => d.id === editingTextId) : null;

    useEffect(() => {
        setReverseMapError(false);
        setReverseCallsError(false);
    }, [currentMapSrc]);

    useEffect(() => {
        if (currentTool === 'text') setIsTextModalOpen(true);
    }, [currentTool]);

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

    // --- DATA HANDLING ---
    const updateDrawingsState = useCallback((action: React.SetStateAction<DrawingObject[]>) => {
        setSteps(prevSteps => {
            const newSteps = [...prevSteps];
            if (!newSteps[currentStepIndex]) return prevSteps;

            const currentData = newSteps[currentStepIndex].data;
            const newData = typeof action === 'function' ? (action as (prev: DrawingObject[]) => DrawingObject[])(currentData) : action;

            newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], data: newData };
            drawingsRef.current = newData;
            return newSteps;
        });
    }, [currentStepIndex]);

    const immediateSave = (stepsData: StrategyStep[], idx: number = currentStepIndex) => {
        if (!strategyId) return;
        updateStrategyData(strategyId, { steps: stepsData, currentStepIndex: idx } as any);
    };

    const debouncedSave = useMemo(() => debounce((id: string, stepsData: StrategyStep[], idx: number) => {
        updateStrategyData(id, { steps: stepsData, currentStepIndex: idx } as any);
    }, 1000), [updateStrategyData]);

    // --- INITIAL DATA ---
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
                if (data.map_name) {
                    const mapKey = data.map_name.toLowerCase();
                    const mapConfig = MAP_CONFIGS[mapKey];
                    if (mapConfig) setCurrentMapSrc(mapConfig.src);
                }
                const rawData = data.data;
                if (Array.isArray(rawData)) {
                    setSteps([{ id: 'init', name: 'Setup', data: rawData }]);
                    setCurrentStepIndex(0);
                } else if (rawData && rawData.steps) {
                    setSteps(rawData.steps);
                    setCurrentStepIndex(rawData.currentStepIndex || 0);
                }
            }
            setIsLoaded(true);
        };
        loadInitialData();
    }, [strategyId]);

    // --- REALTIME ---
    useRealtimeStrategy(
        strategyId,
        (newDrawings: any) => {
            if (isInteractingRef.current) return;
            if (Array.isArray(newDrawings)) {
                setSteps(prev => {
                    const newSteps = [...prev];
                    if(newSteps[currentStepIndex]) {
                        newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], data: newDrawings };
                    }
                    return newSteps;
                });
            } else if (newDrawings.steps) {
                setSteps(newDrawings.steps);
            }
        },
        isRemoteUpdate,
        isInteractingRef
    );

    // --- AUTO-SAVE ---
    useEffect(() => {
        if (!isLoaded || !strategyId) return;
        if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }
        if (isInteractingRef.current) return;
        return () => debouncedSave.cancel();
    }, [steps, currentStepIndex, strategyId, isLoaded, debouncedSave]);

    // --- GRAPHIC HELPERS ---
    const getAdjustedCoordinates = (clientX: number, clientY: number) => {
        const canvas = tempCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let x = (clientX - rect.left) * scaleX;
        let y = (clientY - rect.top) * scaleY;
        if (isRotated) {
            x = canvas.width - x;
            y = canvas.height - y;
        }
        return { x, y };
    };

    const getMousePos = (e: React.MouseEvent) => getAdjustedCoordinates(e.clientX, e.clientY);
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const eraseObjectAt = (x: number, y: number) => {
        const eraserRadius = thickness / 2;
        const newDrawings = drawingsRef.current.filter((obj: DrawingObject) => {
            // Logique gomme (inchangée pour l'instant, mais pourrait bénéficier de distanceToSegment aussi)
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
            updateDrawingsState(newDrawings);
            redrawMainCanvas();
        }
    };

    const getContext = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => canvasRef.current?.getContext('2d');

    const redrawMainCanvas = useCallback(() => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(() => {
            const canvas = mainCanvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            const mapScale = getCurrentScale();
            // @ts-ignore
            renderDrawings(ctx, drawingsRef.current, imageCache.current, redrawMainCanvas, draggingObjectId, showZones, mapScale, iconSize, isRotated);
        });
    }, [draggingObjectId, showZones, currentMapSrc, iconSize, isRotated]);

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

    // --- MOUSE HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        isInteractingRef.current = true;

        if (e.button === 1) {
            setIsPanning(true); panStartRef.current = { x: e.clientX, y: e.clientY };
            if(containerRef.current) containerRef.current.style.cursor = 'grabbing';
            e.preventDefault(); return;
        }
        const mapScale = getCurrentScale();
        const pos = getMousePos(e);

        if (currentTool === 'cursor'|| currentTool === 'settings' || currentTool === 'tools') {
            for (let i = drawingsRef.current.length - 1; i >= 0; i--) {
                const obj = drawingsRef.current[i];
                // Hit text
                if (obj.tool === 'text' && obj.x !== undefined && obj.y !== undefined) {
                    const fontSize = obj.fontSize || 20;
                    const approxWidth = (obj.text?.length || 0) * (fontSize * 0.6);
                    if (Math.abs(pos.x - obj.x) < approxWidth/2 && Math.abs(pos.y - obj.y) < fontSize/2) {
                        setDraggingObjectId(obj.id); setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y }); return;
                    }
                }
                // Hit image/icon
                if (obj.tool === 'image' && obj.x != null && obj.y != null) {
                    const w = (obj.width || iconSize) * mapScale; const h = (obj.height || iconSize) * mapScale;
                    if (pos.x >= obj.x - w/2 && pos.x <= obj.x + w/2 && pos.y >= obj.y - h/2 && pos.y <= obj.y + h/2) {
                        setDraggingObjectId(obj.id); setSpecialDragMode(null); setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y }); return;
                    }
                }
                // Hit ability
                // @ts-ignore
                const hit = checkAbilityHit(pos, obj, mapScale);
                if (hit) {
                    setDraggingObjectId(hit.id); setSpecialDragMode(hit.mode);
                    if (hit.offset) setDragOffset(hit.offset);
                    if (hit.centerStart) setWallCenterStart(hit.centerStart);
                    return;
                }
            }
            setDraggingObjectId(null); return;
        }

        if (currentTool === 'agent') {
            const newObj: DrawingObject = { id: generateId(), tool: 'image', subtype: 'agent', points: [], color: '#fff', thickness: 0, opacity: 1, imageSrc: selectedAgent, x: pos.x, y: pos.y, width: iconSize, height: iconSize };
            const newList = [...drawingsRef.current, newObj];
            drawingsRef.current = newList;
            updateDrawingsState(newList);
            const newSteps = steps.map((s, i) => i === currentStepIndex ? { ...s, data: newList } : s);
            immediateSave(newSteps);
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
            const dx = e.clientX - panStartRef.current.x; const dy = e.clientY - panStartRef.current.y;
            const { x, y, scale } = transformRef.current;
            transformRef.current = { scale, x: x + dx, y: y + dy }; updateTransformStyle();
            panStartRef.current = { x: e.clientX, y: e.clientY }; return;
        }
        const rawPos = getMousePos(e);
        const canvas = mainCanvasRef.current;
        const pos = { x: canvas ? clamp(rawPos.x, 0, canvas.width) : rawPos.x, y: canvas ? clamp(rawPos.y, 0, canvas.height) : rawPos.y };

        if (draggingObjectId !== null) {
            const updatedList = drawingsRef.current.map(obj => {
                if (obj.id !== draggingObjectId) return obj;
                if ((obj.tool === 'image' || obj.tool === 'text') && obj.x !== undefined) {
                    let newX = pos.x - dragOffset.x; let newY = pos.y - dragOffset.y;
                    if (canvas) { newX = clamp(newX, 0, canvas.width); newY = clamp(newY, 0, canvas.height); }
                    return { ...obj, x: newX, y: newY };
                }
                const mapScale = getCurrentScale();
                // @ts-ignore
                return updateAbilityPosition(obj, pos, specialDragMode, dragOffset, wallCenterStart, mapScale);
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
            updateDrawingsState(updatedDrawings);
            const newSteps = steps.map((s, i) => i === currentStepIndex ? { ...s, data: updatedDrawings } : s);
            immediateSave(newSteps);
            setIsOverTrash(false);
            setDraggingObjectId(null);
            setSpecialDragMode(null);
            setDragOffset({ x: 0, y: 0 });
            isInteractingRef.current = false;
            redrawMainCanvas();
            return;
        }

        if (draggingObjectId !== null) {
            const finalData = [...drawingsRef.current];
            updateDrawingsState(finalData);
            const newSteps = steps.map((s, i) => i === currentStepIndex ? { ...s, data: finalData } : s);
            immediateSave(newSteps);
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
                        // @ts-ignore
                        lineType: strokeType,
                        points: strokeType === 'rect' ? [startPosRef.current, pointsRef.current[pointsRef.current.length - 1]] : [...pointsRef.current],
                        color: color,
                        thickness: thickness,
                        opacity: opacity
                    };
                    const newList = [...drawingsRef.current, newPenObject];
                    drawingsRef.current = newList;
                    updateDrawingsState(newList);
                    const newSteps = steps.map((s, i) => i === currentStepIndex ? { ...s, data: newList } : s);
                    immediateSave(newSteps);
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
        drawingsRef.current = [];
        updateDrawingsState([]);
        setCurrentTool('cursor');
        redrawMainCanvas();
        if(strategyId) {
            const newSteps = steps.map((s, i) => i === currentStepIndex ? { ...s, data: [] } : s);
            immediateSave(newSteps, currentStepIndex);
        }
    };

    // --- CONTEXT MENU (CLIC DROIT) AMÉLIORÉ ---
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const pos = getMousePos(e);
        const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return;
        const finalX = pos.x;
        const finalY = pos.y;

        const currentList = [...drawingsRef.current];
        let hasDeleted = false;
        const mapScale = getCurrentScale();

        // On boucle à l'envers pour supprimer l'élément le plus haut en Z
        for (let i = currentList.length - 1; i >= 0; i--) {
            const obj = currentList[i];
            let hit = false;

            // 1. Detection IMAGES / AGENTS / ICONES (Box un peu plus large)
            if (obj.tool === 'image' && obj.x != null && obj.y != null) {
                const w = (obj.width || iconSize) * mapScale;
                const h = (obj.height || iconSize) * mapScale;
                // Marge de 5px pour faciliter le clic
                if (finalX >= obj.x - w/2 - 5 && finalX <= obj.x + w/2 + 5 &&
                    finalY >= obj.y - h/2 - 5 && finalY <= obj.y + h/2 + 5) {
                    hit = true;
                }
            }
            // 2. Detection TEXTE (Estimation plus précise)
            else if (obj.tool === 'text' && obj.x != null) {
                const fontSize = obj.fontSize || 20;
                // Estimation largeur : nbr caractères * taille * ratio (~0.6)
                const textWidth = (obj.text?.length || 5) * fontSize * 0.6;
                // Box centrée sur obj.x/y
                if (Math.abs(finalX - obj.x) < (textWidth / 2) + 10 &&
                    Math.abs(finalY - obj.y!) < (fontSize / 2) + 10) {
                    hit = true;
                }
            }
            // 3. Detection TRAITS (PEN) - Algorithme Distance Segment
            else if (['pen', 'dashed', 'arrow', 'dashed-arrow'].includes(obj.tool as string) || obj.tool === 'pen') {
                // On vérifie si un segment est proche de la souris (tolerance 15px)
                const hitLine = obj.points.some((p, idx) => {
                    if (idx === 0) return false; // Besoin de 2 points pour un segment
                    const prev = obj.points[idx - 1];
                    const dist = distanceToSegment(pos, prev, p);
                    return dist < (obj.thickness || 4) + 15; // Tolérance généreuse
                });
                if (hitLine) hit = true;
            }
            // 4. Detection RECTANGLE (Bords)
            else if (obj.tool === 'rect' && obj.points.length > 1) {
                const p1 = obj.points[0];
                const p2 = obj.points[1];
                // Vérifie si on est proche des 4 côtés
                const minX = Math.min(p1.x, p2.x) - 10;
                const maxX = Math.max(p1.x, p2.x) + 10;
                const minY = Math.min(p1.y, p2.y) - 10;
                const maxY = Math.max(p1.y, p2.y) + 10;
                // Clic à l'intérieur ou sur le bord
                if(finalX >= minX && finalX <= maxX && finalY >= minY && finalY <= maxY) {
                    hit = true;
                }
            }
            // 5. Detection ABILITES (Vectorielles)
            else {
                // @ts-ignore
                if (checkAbilityHit(pos, obj, mapScale)) hit = true;
            }

            if (hit) {
                currentList.splice(i, 1);
                hasDeleted = true;
                break; // On supprime un seul élément à la fois (le plus haut)
            }
        }

        if (hasDeleted) {
            drawingsRef.current = currentList;
            updateDrawingsState(currentList);
            redrawMainCanvas();
            const newSteps = steps.map((s, i) => i === currentStepIndex ? { ...s, data: currentList } : s);
            immediateSave(newSteps);
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
            const newObj = createDrawingFromDrop(type, name, finalX, finalY);
            if (newObj) {
                newObj.id = generateId();
                const newList = [...drawingsRef.current, newObj];
                drawingsRef.current = newList;
                updateDrawingsState(newList);

                setCurrentTool('cursor');
                const newSteps = steps.map((s, i) => i === currentStepIndex ? { ...s, data: newList } : s);
                immediateSave(newSteps);
            }
        } catch (err) { console.error("Drop error", err); }
    };

    const getCursorStyle = () => {
        if (isPanning) return 'grabbing';
        if (currentTool === 'cursor' || currentTool === 'tools' || currentTool === 'settings') return 'default';
        if (currentTool === 'eraser') return 'crosshair';
        return 'crosshair';
    };

    const handleSaveText = (data: { text: string; color: string; fontSize: number; isBold: boolean; isItalic: boolean }) => {
        const newId = generateId();
        let currentList = [...drawingsRef.current];

        if (editingTextId !== null) {
            currentList = currentList.map(obj => obj.id === editingTextId ? { ...obj, text: data.text, color: data.color, fontSize: data.fontSize, fontWeight: data.isBold ? 'bold' : 'normal', fontStyle: data.isItalic ? 'italic' : 'normal' } : obj);
            setEditingTextId(null);
        } else if (containerRef.current && imgRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const { x, y, scale } = transformRef.current;
            const centerX = containerRect.width / 2;
            const centerY = containerRect.height / 2;
            let mapX = (centerX - x) / scale;
            let mapY = (centerY - y) / scale;
            if (isRotated && imgRef.current) {
                mapX = imgRef.current.clientWidth - mapX;
                mapY = imgRef.current.clientHeight - mapY;
            }
            const newText: DrawingObject = {
                id: newId, tool: 'text', text: data.text, points: [], x: mapX, y: mapY,
                color: data.color, fontSize: data.fontSize, fontWeight: data.isBold ? 'bold' : 'normal',
                fontStyle: data.isItalic ? 'italic' : 'normal', thickness: 0, opacity: 1
            };
            currentList.push(newText);
        }

        drawingsRef.current = currentList;
        updateDrawingsState(currentList);
        const newSteps = steps.map((s, i) => i === currentStepIndex ? { ...s, data: currentList } : s);
        immediateSave(newSteps);

        setIsTextModalOpen(false);
        setCurrentTool('cursor');
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

    // --- STEP ACTIONS ---
    const handleAddStep = () => {
        const newSteps = [...steps, { id: generateId().toString(), name: `Phase ${steps.length + 1}`, data: [] }];
        setSteps(newSteps);
        setCurrentStepIndex(prev => prev + 1);
        immediateSave(newSteps, steps.length);
    };

    const handleDuplicateStep = () => {
        const currentStep = steps[currentStepIndex];
        const clonedData = JSON.parse(JSON.stringify(currentStep.data));
        const newStep = {
            id: generateId().toString(),
            name: `${currentStep.name} (Copy)`,
            data: clonedData
        };
        setSteps(prev => {
            const newSteps = [...prev];
            newSteps.splice(currentStepIndex + 1, 0, newStep);
            return newSteps;
        });
        setCurrentStepIndex(prev => prev + 1);
        const newSteps = [...steps];
        newSteps.splice(currentStepIndex + 1, 0, newStep);
        immediateSave(newSteps, currentStepIndex + 1);
    };

    const handleDeleteStep = (index: number) => {
        if (steps.length <= 1) return;
        const newSteps = steps.filter((_, i) => i !== index);
        setSteps(newSteps);
        const newIndex = currentStepIndex >= index && currentStepIndex > 0 ? currentStepIndex - 1 : currentStepIndex;
        setCurrentStepIndex(newIndex);
        immediateSave(newSteps, newIndex);
    };

    const handleRenameStep = (index: number, newName: string) => {
        const newSteps = steps.map((s, i) => i === index ? { ...s, name: newName } : s);
        setSteps(newSteps);
        immediateSave(newSteps, currentStepIndex);
    };

    // --- FILE ACTIONS ---
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

    const handleLoadStrategy = (strat: any) => {
        if (strat && strat.data) {
            if (Array.isArray(strat.data)) {
                setSteps([{ id: 'init', name: 'Setup', data: strat.data }]);
                setCurrentStepIndex(0);
            } else if (strat.data.steps) {
                setSteps(strat.data.steps);
                setCurrentStepIndex(strat.data.currentStepIndex || 0);
            }
        }
        setShowLoadModal(false);
    };

    return {
        mainCanvasRef, tempCanvasRef, containerRef, imgRef, trashRef, contentRef,

        drawings: drawingsRef.current,
        steps, currentStepIndex, setCurrentStepIndex,
        currentMapSrc,
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

        handleClearAll, handleSaveText, handleLoadStrategy,
        handleAddStep, handleDuplicateStep, handleDeleteStep, handleRenameStep,
        handleFolderChange, handleDeleteRequest: () => setShowDeleteModal(true), confirmDelete,
        fetchStrategies
    };
};