import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { ToolsSidebar } from './ToolsSidebar';
import { LoadModal } from './LoadModal';
import { useSupabaseStrategies } from '../hooks/useSupabase';
import { drawSmoothLine, drawArrowHead } from '../utils/canvasDrawing';
import { renderDrawings } from '../utils/canvasRenderer';
import { createDrawingFromDrop } from '../utils/dropFactory';
import { TextEditorModal } from './TextEditorModal';
import type { DrawingObject, ToolType, StrokeType } from '../types/canvas';

// NOUVEAUX IMPORTS
import { useCanvasZoom } from '../hooks/useCanvasZoom';
import { checkAbilityHit, updateAbilityPosition } from '../utils/canvasHitDetection';
import { MAPS_REGISTRY } from '../utils/mapsRegistry'; // <--- Import du registre des cartes

interface EditorCanvasProps {
    // mapSrc: string;  <-- SUPPRIMÉ car géré en interne maintenant
    strategyId: string;
}

export const EditorCanvas = ({ strategyId }: EditorCanvasProps) => {
    // --- REFS ---
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const pointsRef = useRef<{x: number, y: number}[]>([]);
    const startPosRef = useRef<{x: number, y: number}>({x: 0, y: 0});
    const panStartRef = useRef({ x: 0, y: 0 });
    const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

    // --- HOOKS PERSONNALISÉS ---
    const { transformRef, contentRef, updateTransformStyle } = useCanvasZoom(containerRef);
    const { savedStrategies, isLoading, showLoadModal, setShowLoadModal, fetchStrategies, getStrategyById, updateStrategyData } = useSupabaseStrategies();

    // --- STATES ---
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentMapSrc, setCurrentMapSrc] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [drawings, setDrawings] = useState<DrawingObject[]>([]);
    const [showZones, setShowZones] = useState(true);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

    // Texte
    const [isTextModalOpen, setIsTextModalOpen] = useState(false);
    const [editingTextId, setEditingTextId] = useState<number | null>(null);

    // Outils & Style
    const [currentTool, setCurrentTool] = useState<ToolType | 'tools' | 'settings' | 'text' | null>('cursor');
    const [strokeType, setStrokeType] = useState<StrokeType>('solid');
    const [color, setColor] = useState('#ef4444');
    const [opacity, setOpacity] = useState(1);
    const [thickness, setThickness] = useState(4);
    const [selectedAgent, setSelectedAgent] = useState('jett');

    // Interactions
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [draggingObjectId, setDraggingObjectId] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [specialDragMode, setSpecialDragMode] = useState<string | null>(null);
    const [wallCenterStart, setWallCenterStart] = useState({ x: 0, y: 0 });

    // --- NOTIFICATIONS ---
    const showToast = (msg: string) => {
        setNotification({ message: msg, type: 'success' });
        setTimeout(() => setNotification(null), 3000);
    };

    // --- INITIALISATION & CHARGEMENT DE LA MAP ---
    useEffect(() => {
        const loadInitialData = async () => {
            if (!strategyId) return;
            const data = await getStrategyById(strategyId);

            if (data) {
                // 1. Charger les dessins
                if (data.data) {
                    setDrawings(data.data);
                }

                // 2. Charger la bonne image de MAP
                if (data.map_name) {
                    const mapKey = data.map_name.toLowerCase();
                    const src = MAPS_REGISTRY[mapKey];
                    if (src) {
                        setCurrentMapSrc(src);
                    } else {
                        console.error(`Map "${mapKey}" introuvable dans le registre.`);
                    }
                }
            }
            setIsLoaded(true);
        };
        loadInitialData();
    }, [strategyId]);

    // --- AUTO-SAVE ---
    const debouncedSave = useMemo(
        () => debounce((id: string, data: any[]) => {
            updateStrategyData(id, data).then(() => {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            });
        }, 500),
        [updateStrategyData]
    );

    useEffect(() => {
        if (!isLoaded || !strategyId) return;
        setSaveStatus('saving');
        debouncedSave(strategyId, drawings);
        return () => debouncedSave.cancel();
    }, [drawings, strategyId, isLoaded, debouncedSave]);

    // --- GESTION TEXTE ---
    useEffect(() => {
        if (currentTool === 'text') setIsTextModalOpen(true);
    }, [currentTool]);

    // --- GESTION CANVAS ---
    const getContext = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
        const canvas = canvasRef.current;
        return canvas ? canvas.getContext('2d') : null;
    };

    const redrawMainCanvas = useCallback(() => {
        const canvas = mainCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        renderDrawings(ctx, drawings, imageCache.current, redrawMainCanvas, draggingObjectId, showZones);
    }, [drawings, draggingObjectId, showZones]);

    useEffect(() => { redrawMainCanvas(); }, [drawings, redrawMainCanvas, draggingObjectId]);

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
        return () => { img.removeEventListener('load', onLoad); resizeObserver.disconnect(); };
    }, [syncCanvasSize]);


    // --- HELPERS SOURIS ---
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const getMousePos = (e: React.MouseEvent) => {
        const canvas = tempCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0) return { x: 0, y: 0 };
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    // --- LOGIQUE TEXTE (Double Clic + Save) ---
    const handleDoubleClick = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const { x, y, scale } = transformRef.current;
        const finalX = (mouseX - x) / scale;
        const finalY = (mouseY - y) / scale;

        for (let i = drawings.length - 1; i >= 0; i--) {
            const obj = drawings[i];
            if (obj.tool === 'text' && obj.x !== undefined && obj.y !== undefined) {
                const fontSize = obj.fontSize || 20;
                const approxWidth = (obj.text?.length || 0) * (fontSize * 0.6);
                const halfH = fontSize / 2;

                if (finalX >= obj.x - approxWidth / 2 && finalX <= obj.x + approxWidth / 2 && finalY >= obj.y - halfH && finalY <= obj.y + halfH) {
                    setEditingTextId(obj.id);
                    setIsTextModalOpen(true);
                    return;
                }
            }
        }
    };

    const handleSaveText = (data: { text: string; color: string; fontSize: number; isBold: boolean; isItalic: boolean }) => {
        // Mode Mise à jour
        if (editingTextId !== null) {
            setDrawings(prev => prev.map(obj => {
                if (obj.id === editingTextId) {
                    return { ...obj, text: data.text, color: data.color, fontSize: data.fontSize, fontWeight: data.isBold ? 'bold' : 'normal', fontStyle: data.isItalic ? 'italic' : 'normal' };
                }
                return obj;
            }));
            setEditingTextId(null);
            setIsTextModalOpen(false);
            setCurrentTool('cursor');
            return;
        }

        // Mode Création (avec Clamping)
        if (!containerRef.current || !imgRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        const { x, y, scale } = transformRef.current;

        let mapX = (centerX - x) / scale;
        let mapY = (centerY - y) / scale;

        // Force dans l'image
        const margin = 20;
        const imgW = imgRef.current.clientWidth;
        const imgH = imgRef.current.clientHeight;
        mapX = Math.max(margin, Math.min(imgW - margin, mapX));
        mapY = Math.max(margin, Math.min(imgH - margin, mapY));

        const newText: DrawingObject = {
            id: Date.now(), tool: 'text', text: data.text, points: [], x: mapX, y: mapY,
            color: data.color, fontSize: data.fontSize, fontWeight: data.isBold ? 'bold' : 'normal',
            fontStyle: data.isItalic ? 'italic' : 'normal', thickness: 0, opacity: 1
        };
        setDrawings(prev => [...prev, newText]);
        setIsTextModalOpen(false);
        setCurrentTool('cursor');
    };

    const handleCloseModal = () => {
        setIsTextModalOpen(false);
        setEditingTextId(null);
        setCurrentTool('cursor');
    };

    // --- EVENT HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1) { // Middle Click Pan
            setIsPanning(true);
            panStartRef.current = { x: e.clientX, y: e.clientY };
            if(containerRef.current) containerRef.current.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }

        const pos = getMousePos(e);

        if (currentTool === 'cursor') {
            for (let i = drawings.length - 1; i >= 0; i--) {
                const obj = drawings[i];

                // Hit Test Texte
                if (obj.tool === 'text' && obj.x !== undefined && obj.y !== undefined) {
                    const fontSize = obj.fontSize || 20;
                    const approxWidth = (obj.text?.length || 0) * (fontSize * 0.6);
                    if (pos.x >= obj.x - approxWidth / 2 && pos.x <= obj.x + approxWidth / 2 && pos.y >= obj.y - fontSize / 2 && pos.y <= obj.y + fontSize / 2) {
                        setDraggingObjectId(obj.id); setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y }); return;
                    }
                }
                // Hit Test Images
                if (obj.tool === 'image' && obj.x != null && obj.y != null) {
                    const w = obj.width || 50; const h = obj.height || 50;
                    if (pos.x >= obj.x - w/2 && pos.x <= obj.x + w/2 && pos.y >= obj.y - h/2 && pos.y <= obj.y + h/2) {
                        setDraggingObjectId(obj.id); setSpecialDragMode(null); setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y }); return;
                    }
                }
                // Hit Test Abilities
                const hit = checkAbilityHit(pos, obj);
                if (hit) {
                    setDraggingObjectId(hit.id); setSpecialDragMode(hit.mode);
                    if (hit.offset) setDragOffset(hit.offset);
                    if (hit.centerStart) setWallCenterStart(hit.centerStart);
                    return;
                }
            }
            setDraggingObjectId(null);
            return;
        }

        if (currentTool === 'agent') {
            const newAgent: DrawingObject = { id: Date.now(), tool: 'image', subtype: 'agent', points: [], color: '#fff', thickness: 0, opacity: 1, imageSrc: selectedAgent, x: pos.x, y: pos.y, width: 50, height: 50 };
            setDrawings(prev => [...prev, newAgent]); return;
        }
        if (currentTool === 'eraser') { setIsDrawing(true); eraseObjectAt(pos.x, pos.y); return; }

        if (currentTool === 'pen') {
            setIsDrawing(true);
            const canvas = mainCanvasRef.current;
            const x = canvas ? clamp(pos.x, 0, canvas.width) : pos.x;
            const y = canvas ? clamp(pos.y, 0, canvas.height) : pos.y;
            startPosRef.current = { x, y };
            pointsRef.current = [{ x, y }];
            const tempCtx = getContext(tempCanvasRef);
            if (tempCtx) {
                tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
                tempCtx.beginPath(); tempCtx.moveTo(x, y);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            e.preventDefault();
            const dx = e.clientX - panStartRef.current.x;
            const dy = e.clientY - panStartRef.current.y;
            const { x, y, scale } = transformRef.current;
            transformRef.current = { scale, x: x + dx, y: y + dy };
            updateTransformStyle();
            panStartRef.current = { x: e.clientX, y: e.clientY };
            return;
        }

        const rawPos = getMousePos(e);
        const canvas = mainCanvasRef.current;
        const pos = { x: canvas ? clamp(rawPos.x, 0, canvas.width) : rawPos.x, y: canvas ? clamp(rawPos.y, 0, canvas.height) : rawPos.y };

        if (draggingObjectId !== null) {
            setDrawings(prev => prev.map(obj => {
                if (obj.id !== draggingObjectId) return obj;

                // Drag Image/Text (avec clamping objet)
                if ((obj.tool === 'image' || obj.tool === 'text') && obj.x !== undefined) {
                    let newX = pos.x - dragOffset.x;
                    let newY = pos.y - dragOffset.y;
                    if (canvas) {
                        newX = clamp(newX, 0, canvas.width);
                        newY = clamp(newY, 0, canvas.height);
                    }
                    return { ...obj, x: newX, y: newY };
                }

                return updateAbilityPosition(obj, pos, specialDragMode, dragOffset, wallCenterStart);
            }));
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

            if (strokeType === 'dashed' || strokeType === 'dashed-arrow') tempCtx.setLineDash([thickness * 2, thickness * 2]);
            else tempCtx.setLineDash([]);

            if (strokeType === 'rect') {
                tempCtx.strokeRect(startPosRef.current.x, startPosRef.current.y, pos.x - startPosRef.current.x, pos.y - startPosRef.current.y);
            } else {
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
        if (isPanning) {
            setIsPanning(false);
            if(containerRef.current) containerRef.current.style.cursor = currentTool === 'cursor' ? 'default' : (currentTool ? 'crosshair' : 'grab');
            return;
        }
        setDraggingObjectId(null);
        setSpecialDragMode(null);
        setDragOffset({ x: 0, y: 0 });

        if (isDrawing) {
            setIsDrawing(false);
            if (currentTool === 'pen') {
                const newDrawing: DrawingObject = {
                    id: Date.now(),
                    tool: strokeType,
                    points: strokeType === 'rect' ? [startPosRef.current, pointsRef.current[pointsRef.current.length - 1]] : [...pointsRef.current],
                    color: color, thickness: thickness, opacity: opacity
                };
                setDrawings(prev => [...prev, newDrawing]);
                const tempCtx = getContext(tempCanvasRef);
                if (tempCtx) tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
            }
            pointsRef.current = [];
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const { x, y, scale } = transformRef.current;
        const finalX = (mouseX - x) / scale;
        const finalY = (mouseY - y) / scale;

        const newDrawings = [...drawings];
        let hasDeleted = false;
        let deletedName = "Élément";

        for (let i = newDrawings.length - 1; i >= 0; i--) {
            const obj = newDrawings[i];
            let hit = false;
            if (obj.tool === 'image' && obj.x !== undefined && obj.y !== undefined) {
                const w = obj.width || 50; const h = obj.height || 50;
                if (finalX >= obj.x - w/2 && finalX <= obj.x + w/2 && finalY >= obj.y - h/2 && finalY <= obj.y + h/2) {
                    hit = true; deletedName = obj.subtype === 'icon' ? 'Icône' : (obj.subtype === 'agent' ? 'Agent' : 'Compétence');
                }
            }
            else if (obj.tool === 'text' && obj.x !== undefined && obj.y !== undefined) {
                const fontSize = obj.fontSize || 20;
                const approxWidth = (obj.text?.length || 0) * (fontSize * 0.6);
                if (finalX >= obj.x - approxWidth / 2 && finalX <= obj.x + approxWidth / 2 && finalY >= obj.y - fontSize / 2 && finalY <= obj.y + fontSize / 2) {
                    hit = true; deletedName = 'Texte';
                }
            }
            else if (!['pen', 'rect', 'arrow', 'dashed', 'dashed-arrow', 'cursor'].includes(obj.tool)) {
                if (obj.points && obj.points.length > 0) {
                    const center = obj.points[0];
                    if (Math.hypot(finalX - center.x, finalY - center.y) < 30) {
                        hit = true; deletedName = 'Compétence';
                    }
                }
            }
            if (hit) { newDrawings.splice(i, 1); hasDeleted = true; break; }
        }
        if (hasDeleted) { setDrawings(newDrawings); showToast(`🗑️ ${deletedName} supprimé`); }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const jsonData = e.dataTransfer.getData("application/json");
        if (!jsonData) return;
        try {
            const { type, name } = JSON.parse(jsonData);
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const { x, y, scale } = transformRef.current;
            const finalX = (e.clientX - rect.left - x) / scale;
            const finalY = (e.clientY - rect.top - y) / scale;

            const img = imgRef.current;
            if (!img) return;
            const clampedX = clamp(finalX, 0, img.clientWidth);
            const clampedY = clamp(finalY, 0, img.clientHeight);
            const newObj = createDrawingFromDrop(type, name, clampedX, clampedY);
            if (newObj) { setDrawings(prev => [...prev, newObj]); setCurrentTool('cursor'); }
        } catch (err) { console.error("Drop error", err); }
    };

    const eraseObjectAt = (x: number, y: number) => {
        const eraserRadius = thickness / 2;
        const newDrawings = drawings.filter(obj => {
            const erasableTypes = ['solid', 'dashed', 'arrow', 'dashed-arrow', 'rect', 'pen'];
            if (!erasableTypes.includes(obj.tool as string)) return true;
            if (obj.tool === 'rect' && obj.points.length >= 2) {
                const s = obj.points[0]; const e = obj.points[1];
                const minX = Math.min(s.x, e.x) - eraserRadius; const maxX = Math.max(s.x, e.x) + eraserRadius;
                const minY = Math.min(s.y, e.y) - eraserRadius; const maxY = Math.max(s.y, e.y) + eraserRadius;
                return !(x >= minX && x <= maxX && y >= minY && y <= maxY);
            }
            return !obj.points.some(p => Math.hypot(p.x - x, p.y - y) < (obj.thickness / 2 + eraserRadius));
        });
        if (newDrawings.length !== drawings.length) setDrawings(newDrawings);
    };

    const handleLoadStrategy = (strat: any) => {
        if (strat && strat.data) setDrawings(strat.data);
        setShowLoadModal(false);
    };

    const getCursorStyle = () => {
        if (isPanning) return 'grabbing';
        if (currentTool === 'cursor' || currentTool === 'tools' || currentTool === 'settings') return 'default';
        if (currentTool === 'eraser') {
            const size = Math.max(thickness, 10);
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="none" stroke="white" stroke-width="2" /><circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="none" stroke="black" stroke-width="1" /></svg>`;
            return `url('data:image/svg+xml;base64,${btoa(svg)}') ${size/2} ${size/2}, auto`;
        }
        return 'crosshair';
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };

    // Objet Texte en cours d'édition (s'il y en a un)
    const editingObj = editingTextId ? drawings.find(d => d.id === editingTextId) : null;

    return (
        <div className="flex flex-col lg:flex-row h-full w-full
          bg-[#121212]
            bg-[linear-gradient(0deg,rgba(255,255,255,0.03),rgba(0,0,0,0.05)),
            radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.04),transparent_35%),
            radial-gradient(circle_at_90%_80%,rgba(0,0,0,0.5),transparent_45%),
            linear-gradient(180deg,rgba(0,0,0,0.6),transparent)]">
            <div className="absolute top-4 left-4 z-30 lg:static lg:h-full lg:w-auto lg:p-4 lg:bg-[#181b1e] lg:border-r lg:border-gray-800">
                <ToolsSidebar
                    currentTool={currentTool} setTool={setCurrentTool}
                    strokeType={strokeType} setStrokeType={setStrokeType}
                    color={color} setColor={setColor}
                    opacity={opacity} setOpacity={setOpacity}
                    thickness={thickness} setThickness={setThickness}
                    selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent}
                    onSave={() => alert("Sauvegarde automatique active !")} onLoad={fetchStrategies}
                    showZones={showZones} setShowZones={setShowZones}
                />
            </div>

            <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden select-none" style={{ cursor: getCursorStyle() }}
                 onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                 onDragOver={handleDragOver} onDrop={handleDrop} onContextMenu={handleContextMenu} onDoubleClick={handleDoubleClick}>

                <div ref={contentRef} className="origin-top-left absolute top-0 left-0" draggable={false}>

                    {currentMapSrc && (
                        <img ref={imgRef} src={currentMapSrc} alt="Map" draggable={false} className="block select-none pointer-events-none min-w-[1500px] m-4 pr-150 p-6 h-auto  shadow-lg" onLoad={syncCanvasSize} />
                    )}
                    <canvas ref={mainCanvasRef} draggable={false} className="absolute inset-0 w-full h-full pointer-events-none" />
                    <canvas ref={tempCanvasRef} draggable={false} className="absolute inset-0 w-full h-full pointer-events-none" />
                </div>

                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-1 rounded-full text-sm font-medium backdrop-blur-sm pointer-events-none z-50">
                    {!isLoaded && <span className="text-blue-400">Chargement...</span>}
                    {isLoaded && saveStatus === 'idle' && <span className="text-gray-400">Prêt</span>}
                    {isLoaded && saveStatus === 'saving' && <span className="text-yellow-400 flex items-center gap-2"><span className="animate-spin h-3 w-3 border-2 border-yellow-400 border-t-transparent rounded-full"></span>Sauvegarde...</span>}
                    {isLoaded && saveStatus === 'saved' && <span className="text-green-400">☁️ Sauvegardé</span>}
                </div>

                <LoadModal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} isLoading={isLoading} strategies={savedStrategies} onLoadStrategy={handleLoadStrategy} />

                {notification && (
                    <div className="absolute bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-600 flex items-center gap-3">
                            <div className="bg-red-500/20 p-1.5 rounded-full text-red-400">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </div>
                            <span className="font-medium text-sm">{notification.message}</span>
                        </div>
                    </div>
                )}

                <TextEditorModal
                    isOpen={isTextModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveText}

                    initialText={editingObj?.text || ''}
                    initialColor={editingObj?.color || color}
                    initialFontSize={editingObj?.fontSize || 24}
                    initialBold={editingObj?.fontWeight === 'bold'}
                    initialItalic={editingObj?.fontStyle === 'italic'}
                />
            </div>
        </div>
    );
};