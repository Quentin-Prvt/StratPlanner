import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { ToolsSidebar } from './ToolsSidebar';
import { LoadModal } from './LoadModal';
import { ConfirmModal } from './ConfirmModal';
import { useSupabaseStrategies } from '../hooks/useSupabase';
import { useRealtimeStrategy } from '../hooks/useRealtimeStrategy'; // <--- 1. NOUVEL IMPORT
import { drawSmoothLine, drawArrowHead } from '../utils/canvasDrawing';
import { renderDrawings } from '../utils/canvasRenderer';
import { createDrawingFromDrop } from '../utils/dropFactory';
import { TextEditorModal } from './TextEditorModal';
import type { DrawingObject, ToolType, StrokeType } from '../types/canvas';

import { useCanvasZoom } from '../hooks/useCanvasZoom';
import { checkAbilityHit, updateAbilityPosition } from '../utils/canvasHitDetection';
import { MAP_CONFIGS } from '../utils/mapsRegistry';
import { supabase } from '../supabaseClient';

interface EditorCanvasProps {
    strategyId: string;
}

export const EditorCanvas = ({ strategyId }: EditorCanvasProps) => {
    const navigate = useNavigate();

    // --- REFS ---
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);


    const isInteractingRef = useRef(false); // Est-ce que je clique/dessine ?
    const isRemoteUpdate = useRef(false);   // Est-ce une update serveur ?

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
    const [drawings, setDrawings] = useState<DrawingObject[]>([]);
    const [showZones, setShowZones] = useState(true);
    const [iconSize, setIconSize] = useState(30);

    // Dossiers
    const [folders, setFolders] = useState<{id: string, name: string}[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string>("");

    // Modales
    const [isTextModalOpen, setIsTextModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
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

    const getCurrentScale = () => {
        const entry = Object.entries(MAP_CONFIGS).find(([_, config]) => config.src === currentMapSrc);
        return entry ? entry[1].scale : 1.0;
    };

    // --- FETCH DOSSIERS ---
    useEffect(() => {
        const fetchFolders = async () => {
            const { data } = await supabase.from('folders').select('id, name');
            if (data) setFolders(data);
        };
        fetchFolders();
    }, []);

    // --- LOAD STRATEGY ---
    useEffect(() => {
        const loadInitialData = async () => {
            if (!strategyId) return;
            const data = await getStrategyById(strategyId);

            if (data) {
                if (data.data) setDrawings(data.data);
                if (data.folder_id) setCurrentFolderId(data.folder_id);
                if (data.map_name) {
                    const mapKey = data.map_name.toLowerCase();
                    const mapConfig = MAP_CONFIGS[mapKey];
                    if (mapConfig) setCurrentMapSrc(mapConfig.src);
                }
            }
            setIsLoaded(true);
        };
        loadInitialData();
    }, [strategyId]);

    // --- 3. INTEGRATION DU REALTIME ---
    const { processPendingUpdates } = useRealtimeStrategy(
        strategyId,
        setDrawings,
        isRemoteUpdate,
        isInteractingRef
    );

    // --- AUTO-SAVE ---
    const debouncedSave = useMemo(
        () => debounce((id: string, data: any[]) => {
            updateStrategyData(id, data);
        }, 1000),
        [updateStrategyData]
    );

    useEffect(() => {
        if (!isLoaded || !strategyId) return;

        // --- 4. PROTECTION BOUCLE INFINIE ---
        // Si la mise à jour vient du serveur, on ne la renvoie pas
        if (isRemoteUpdate.current) {
            isRemoteUpdate.current = false;
            return;
        }

        debouncedSave(strategyId, drawings);
        return () => debouncedSave.cancel();
    }, [drawings, strategyId, isLoaded, debouncedSave]);

    // --- CHANGEMENT DE DOSSIER ---
    const handleFolderChange = async (newFolderId: string) => {
        setCurrentFolderId(newFolderId);
        if (strategyId) {
            await supabase
                .from('strategies')
                .update({ folder_id: newFolderId || null })
                .eq('id', strategyId);
        }
    };

    // --- LOGIQUE DE SUPPRESSION ---
    const handleDeleteRequest = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!strategyId) return;

        const { error } = await supabase
            .from('strategies')
            .delete()
            .eq('id', strategyId);

        if (!error) {
            navigate('/');
        } else {
            console.error("Erreur suppression:", error);
        }
    };

    // --- TEXTE ---
    useEffect(() => { if (currentTool === 'text') setIsTextModalOpen(true); }, [currentTool]);

    // --- CANVAS HELPERS & RENDERING ---
    const getContext = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => canvasRef.current?.getContext('2d');

    const redrawMainCanvas = useCallback(() => {
        const canvas = mainCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const mapScale = getCurrentScale();
        // @ts-ignore
        renderDrawings(ctx, drawings, imageCache.current, redrawMainCanvas, draggingObjectId, showZones, mapScale, iconSize);
    }, [drawings, draggingObjectId, showZones, currentMapSrc, iconSize]);

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

    // --- SOURIS & INTERACTION ---
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

    const handleDoubleClick = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const { x, y, scale } = transformRef.current;
        const finalX = (e.clientX - rect.left - x) / scale;
        const finalY = (e.clientY - rect.top - y) / scale;

        for (let i = drawings.length - 1; i >= 0; i--) {
            const obj = drawings[i];
            if (obj.tool === 'text' && obj.x !== undefined && obj.y !== undefined) {
                const fontSize = obj.fontSize || 20;
                const approxWidth = (obj.text?.length || 0) * (fontSize * 0.6);
                if (Math.abs(finalX - obj.x) < approxWidth/2 && Math.abs(finalY - obj.y) < fontSize/2) {
                    setEditingTextId(obj.id);
                    setIsTextModalOpen(true);
                    return;
                }
            }
        }
    };

    const handleSaveText = (data: { text: string; color: string; fontSize: number; isBold: boolean; isItalic: boolean }) => {
        if (editingTextId !== null) {
            setDrawings(prev => prev.map(obj => obj.id === editingTextId ? { ...obj, text: data.text, color: data.color, fontSize: data.fontSize, fontWeight: data.isBold ? 'bold' : 'normal', fontStyle: data.isItalic ? 'italic' : 'normal' } : obj));
            setEditingTextId(null);
        } else if (containerRef.current && imgRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const { x, y, scale } = transformRef.current;
            const mapX = clamp((containerRect.width/2 - x) / scale, 20, imgRef.current.clientWidth - 20);
            const mapY = clamp((containerRect.height/2 - y) / scale, 20, imgRef.current.clientHeight - 20);

            const newText: DrawingObject = {
                id: Date.now(), tool: 'text', text: data.text, points: [], x: mapX, y: mapY,
                color: data.color, fontSize: data.fontSize, fontWeight: data.isBold ? 'bold' : 'normal',
                fontStyle: data.isItalic ? 'italic' : 'normal', thickness: 0, opacity: 1
            };
            setDrawings(prev => [...prev, newText]);
        }
        setIsTextModalOpen(false);
        setCurrentTool('cursor');
    };

    // --- EVENT HANDLERS (MOUSE & DROP) ---
    const handleMouseDown = (e: React.MouseEvent) => {
        // --- 5. SIGNALER QU'ON INTERAGIT ---
        isInteractingRef.current = true;

        if (e.button === 1) {
            setIsPanning(true); panStartRef.current = { x: e.clientX, y: e.clientY };
            if(containerRef.current) containerRef.current.style.cursor = 'grabbing';
            e.preventDefault(); return;
        }
        const mapScale = getCurrentScale();
        const pos = getMousePos(e);

        if (currentTool === 'cursor'|| currentTool === 'settings' || currentTool === 'tools') {
            for (let i = drawings.length - 1; i >= 0; i--) {
                const obj = drawings[i];
                if (obj.tool === 'text' && obj.x !== undefined && obj.y !== undefined) {
                    const fontSize = obj.fontSize || 20;
                    const approxWidth = (obj.text?.length || 0) * (fontSize * 0.6);
                    if (Math.abs(pos.x - obj.x) < approxWidth/2 && Math.abs(pos.y - obj.y) < fontSize/2) {
                        setDraggingObjectId(obj.id); setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y }); return;
                    }
                }
                if (obj.tool === 'image' && obj.x != null && obj.y != null) {
                    const w = (obj.width || iconSize) * mapScale; const h = (obj.height || iconSize) * mapScale;
                    if (pos.x >= obj.x - w/2 && pos.x <= obj.x + w/2 && pos.y >= obj.y - h/2 && pos.y <= obj.y + h/2) {
                        setDraggingObjectId(obj.id); setSpecialDragMode(null); setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y }); return;
                    }
                }
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
            setDrawings(prev => [...prev, { id: Date.now(), tool: 'image', subtype: 'agent', points: [], color: '#fff', thickness: 0, opacity: 1, imageSrc: selectedAgent, x: pos.x, y: pos.y, width: iconSize, height: iconSize }]);
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
            setDrawings(prev => prev.map(obj => {
                if (obj.id !== draggingObjectId) return obj;
                if ((obj.tool === 'image' || obj.tool === 'text') && obj.x !== undefined) {
                    let newX = pos.x - dragOffset.x; let newY = pos.y - dragOffset.y;
                    if (canvas) { newX = clamp(newX, 0, canvas.width); newY = clamp(newY, 0, canvas.height); }
                    return { ...obj, x: newX, y: newY };
                }
                const mapScale = getCurrentScale();
                // @ts-ignore
                return updateAbilityPosition(obj, pos, specialDragMode, dragOffset, wallCenterStart, mapScale);
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
        if (isPanning) {
            setIsPanning(false);
            if(containerRef.current) containerRef.current.style.cursor = currentTool === 'cursor' ? 'default' : (currentTool ? 'crosshair' : 'grab');
            // Pas de return ici, on veut exécuter le code de fin d'interaction
        }
        setDraggingObjectId(null); setSpecialDragMode(null); setDragOffset({ x: 0, y: 0 });
        if (isDrawing) {
            setIsDrawing(false);
            if (currentTool === 'pen') {
                setDrawings(prev => [...prev, {
                    id: Date.now(), tool: strokeType,
                    points: strokeType === 'rect' ? [startPosRef.current, pointsRef.current[pointsRef.current.length - 1]] : [...pointsRef.current],
                    color: color, thickness: thickness, opacity: opacity
                }]);
                const tempCtx = getContext(tempCanvasRef);
                if (tempCtx) tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
            }
            pointsRef.current = [];
        }

        // --- 6. FIN D'INTERACTION : ON TRAITE LES UPDATES EN ATTENTE ---
        isInteractingRef.current = false;
        processPendingUpdates();
    };

    const handleMouseLeave = () => {
        handleMouseUp();
        // Sécurité supplémentaire
        isInteractingRef.current = false;
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return;
        const { x, y, scale } = transformRef.current;
        const finalX = (e.clientX - rect.left - x) / scale; const finalY = (e.clientY - rect.top - y) / scale;
        const pos = { x: finalX, y: finalY };
        const newDrawings = [...drawings]; let hasDeleted = false;

        for (let i = newDrawings.length - 1; i >= 0; i--) {
            const obj = newDrawings[i];
            let hit = false;
            const mapScale = getCurrentScale();
            if (obj.tool === 'image' && obj.x != null && obj.y != null) {
                const w = (obj.width || iconSize) * mapScale; const h = (obj.height || iconSize) * mapScale;
                if (finalX >= obj.x - w/2 && finalX <= obj.x + w/2 && finalY >= obj.y - h/2 && finalY <= obj.y + h/2) hit = true;
            } else if (obj.tool === 'text' && obj.x != null) {
                const fontSize = obj.fontSize || 20;
                if (Math.abs(finalX - obj.x) < 50 && Math.abs(finalY - obj.y!) < fontSize) hit = true;
            } else if (['pen', 'dashed', 'arrow', 'dashed-arrow'].includes(obj.tool)) {
                if (obj.points.some(p => Math.hypot(p.x - finalX, p.y - finalY) < (obj.thickness || 4) + 10)) hit = true;
            } else if (obj.tool === 'rect') { hit = true; } // (Hitbox simplifiée ici)
            else {
                // @ts-ignore
                if (checkAbilityHit(pos, obj, mapScale)) hit = true;
            }

            if (hit) { newDrawings.splice(i, 1); hasDeleted = true; break; }
        }
        if (hasDeleted) setDrawings(newDrawings);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const jsonData = e.dataTransfer.getData("application/json"); if (!jsonData) return;
        try {
            const { type, name } = JSON.parse(jsonData);
            const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return;
            const { x, y, scale } = transformRef.current;
            const finalX = (e.clientX - rect.left - x) / scale; const finalY = (e.clientY - rect.top - y) / scale;
            const img = imgRef.current; if (!img) return;
            const newObj = createDrawingFromDrop(type, name, clamp(finalX, 0, img.clientWidth), clamp(finalY, 0, img.clientHeight));
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

    const handleLoadStrategy = (strat: any) => { if (strat && strat.data) setDrawings(strat.data); setShowLoadModal(false); };
    const getCursorStyle = () => {
        if (isPanning) return 'grabbing';
        if (currentTool === 'cursor' || currentTool === 'tools' || currentTool === 'settings') return 'default';
        if (currentTool === 'eraser') return 'crosshair';
        return 'crosshair';
    };

    const editingObj = editingTextId ? drawings.find(d => d.id === editingTextId) : null;

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#121212]">
            <div className="absolute top-4 left-4 z-30 lg:static lg:h-full lg:w-auto lg:p-4 lg:bg-[#181b1e] lg:border-r lg:border-gray-800">
                <ToolsSidebar
                    currentTool={currentTool} setTool={setCurrentTool}
                    strokeType={strokeType} setStrokeType={setStrokeType}
                    color={color} setColor={setColor}
                    opacity={opacity} setOpacity={setOpacity}
                    thickness={thickness} setThickness={setThickness}
                    selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent}
                    onSave={() => {}}
                    onLoad={fetchStrategies}
                    showZones={showZones} setShowZones={setShowZones}
                    iconSize={iconSize} setIconSize={setIconSize}
                    folders={folders}
                    currentFolderId={currentFolderId}
                    onFolderChange={handleFolderChange}
                    onDeleteStrategy={handleDeleteRequest}
                />
            </div>

            <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden select-none" style={{ cursor: getCursorStyle() }}
                 onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}
                 onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }} onDrop={handleDrop} onContextMenu={handleContextMenu} onDoubleClick={handleDoubleClick}>

                <div ref={contentRef} className="origin-top-left absolute top-0 left-0">
                    {currentMapSrc && (
                        <img ref={imgRef} src={currentMapSrc} alt="Map" draggable={false} className="block pointer-events-none h-auto shadow-lg p-10" style={{ width: '100%', minWidth: '1024px' }} onLoad={syncCanvasSize} />
                    )}
                    <canvas ref={mainCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                    <canvas ref={tempCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                </div>

                {/* MODALES */}
                <LoadModal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} isLoading={isLoading} strategies={savedStrategies} onLoadStrategy={handleLoadStrategy} />

                <TextEditorModal
                    isOpen={isTextModalOpen} onClose={() => { setIsTextModalOpen(false); setEditingTextId(null); setCurrentTool('cursor'); }} onSave={handleSaveText}
                    initialText={editingObj?.text || ''} initialColor={editingObj?.color || color} initialFontSize={editingObj?.fontSize || 24}
                    initialBold={editingObj?.fontWeight === 'bold'} initialItalic={editingObj?.fontStyle === 'italic'}
                />

                <ConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={confirmDelete}
                    title="Supprimer la stratégie"
                    message="Êtes-vous sûr de vouloir supprimer cette stratégie ? Cette action est irréversible."
                    isDangerous={true}
                    confirmText="Supprimer"
                />
            </div>
        </div>
    );
};