import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ToolsSidebar } from './ToolsSidebar';
import { LoadModal } from './LoadModal';
import { useSupabaseStrategies } from '../hooks/useSupabase';
import { drawSmoothLine, drawArrowHead } from '../utils/canvasDrawing';
import type { DrawingObject, ToolType, StrokeType } from '../types/canvas';

// --- IMPORTS DES UTILITAIRES ABILITIES ---
import { drawBreachStun, checkBreachStunHit, updateBreachStunPosition } from '../utils/abilities/breachStun';
import { drawAstraWall, checkAstraWallHit, updateAstraWallPosition } from '../utils/abilities/astraWall';
import { drawBreachUlt, checkBreachUltHit, updateBreachUltPosition } from '../utils/abilities/breachUlt';
import { drawBreachAftershock, checkBreachAftershockHit, updateBreachAftershockPosition } from '../utils/abilities/breachAftershock';
import { drawBrimstoneStim, checkBrimstoneStimHit, updateBrimstoneStimPosition } from '../utils/abilities/brimstoneStim';
// NOUVEAU : Import pour l'Ultime de Brimstone
import { drawBrimstoneUlt, checkBrimstoneUltHit, updateBrimstoneUltPosition } from '../utils/abilities/brimstoneUlt';

import { ABILITY_SIZES } from '../utils/abilitySizes';

interface EditorCanvasProps {
    mapSrc: string;
}

export const EditorCanvas = ({ mapSrc }: EditorCanvasProps) => {
    // --- REFS ---
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const pointsRef = useRef<{x: number, y: number}[]>([]);
    const startPosRef = useRef<{x: number, y: number}>({x: 0, y: 0});
    const transformRef = useRef({ scale: 1, x: 0, y: 0 });
    const panStartRef = useRef({ x: 0, y: 0 });
    const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

    // --- STATES ---
    const [drawings, setDrawings] = useState<DrawingObject[]>([]);
    const [currentTool, setCurrentTool] = useState<ToolType>('pen');
    const [strokeType, setStrokeType] = useState<StrokeType>('solid');
    const [color, setColor] = useState('#ef4444');
    const [opacity, setOpacity] = useState(1);
    const [thickness, setThickness] = useState(4);
    const [selectedAgent, setSelectedAgent] = useState('jett');

    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);

    // Gestion du déplacement
    const [draggingObjectId, setDraggingObjectId] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Gestion Drag Spécial
    const [specialDragMode, setSpecialDragMode] = useState<'center' | 'handle' | null>(null);
    const [wallCenterStart, setWallCenterStart] = useState({ x: 0, y: 0 });

    const { savedStrategies, isLoading, showLoadModal, setShowLoadModal, saveStrategy, fetchStrategies } = useSupabaseStrategies('Ascent');

    // --- CHARGEMENT D'IMAGES ---
    const getOrLoadImage = (src: string, isAbility: boolean = false): HTMLImageElement | null => {
        if (imageCache.current.has(src)) return imageCache.current.get(src) || null;
        const img = new Image();
        const folder = isAbility ? '/abilities/' : '/agents/';
        img.src = `${folder}${src}.png`;
        img.onload = () => redrawMainCanvas();
        imageCache.current.set(src, img);
        return img;
    };

    const getContext = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.getContext('2d');
    };

    // --- RENDU ---
    const redrawMainCanvas = useCallback(() => {
        const canvas = mainCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawings.forEach(obj => {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = obj.opacity;

            // --- ABILITIES SPECIALES VECTORIELLES ---
            if (obj.tool === 'stun_zone') { drawBreachStun(ctx, obj); return; }
            if (obj.tool === 'breach_x_zone') { drawBreachUlt(ctx, obj); return; }
            if (obj.tool === 'breach_c_zone') { drawBreachAftershock(ctx, obj); return; }
            if (obj.tool === 'wall') { drawAstraWall(ctx, obj); return; }
            if (obj.tool === 'brimstone_c_zone') { drawBrimstoneStim(ctx, obj, imageCache.current, redrawMainCanvas); return; }

            // NOUVEAU : Brimstone Ult (X)
            if (obj.tool === 'brimstone_x_zone') {
                drawBrimstoneUlt(ctx, obj);
                return;
            }

            // --- IMAGES CLASSIQUES (Inclut Brimstone E/Q) ---
            if (obj.tool === 'image' && obj.imageSrc && obj.x != null && obj.y != null) {
                const isAbility = obj.subtype === 'ability' || obj.imageSrc.includes('_game');
                const isBreachFlash = obj.imageSrc.includes('breach_q');
                const img = getOrLoadImage(obj.imageSrc, isAbility);

                if (img && img.complete) {
                    const targetSize = obj.width || 50;
                    const boxW = targetSize; const boxH = targetSize;
                    const naturalRatio = img.naturalWidth / img.naturalHeight;
                    let drawW = boxW; let drawH = boxH;
                    if (naturalRatio > 1) drawH = boxW / naturalRatio; else drawW = boxH * naturalRatio;
                    const centerX = obj.x; const centerY = obj.y;
                    const drawX = centerX - drawW / 2; const drawY = centerY - drawH / 2;

                    ctx.save();
                    // On dessine "brut" si c'est une abilité standard
                    if (isAbility && !isBreachFlash) {
                        ctx.drawImage(img, drawX, drawY, drawW, drawH);
                    } else {
                        // Cadre pour Agent ou Flash Breach
                        const frameX = centerX - boxW/2; const frameY = centerY - boxH/2; const borderRadius = 6;
                        ctx.beginPath();
                        if (typeof ctx.roundRect === 'function') ctx.roundRect(frameX, frameY, boxW, boxH, borderRadius); else ctx.rect(frameX, frameY, boxW, boxH);
                        ctx.fillStyle = '#1e293b'; ctx.fill();
                        ctx.save(); ctx.clip(); ctx.drawImage(img, drawX, drawY, drawW, drawH); ctx.restore();
                        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.shadowColor = '#cbd5e1'; ctx.shadowBlur = 15; ctx.stroke();
                    }
                    ctx.restore();

                    if (draggingObjectId === obj.id) {
                        ctx.save(); ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.shadowBlur = 0;
                        ctx.strokeRect(centerX - boxW/2 - 2, centerY - boxH/2 - 2, boxW + 4, boxH + 4);
                        ctx.restore();
                    }
                }
                return;
            }

            // --- DESSIN VECTORIEL ---
            ctx.strokeStyle = obj.color; ctx.lineWidth = obj.thickness; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            if (obj.tool === 'dashed' || obj.tool === 'dashed-arrow') ctx.setLineDash([obj.thickness * 2, obj.thickness * 2]); else ctx.setLineDash([]);
            if (obj.tool === 'rect') {
                const start = obj.points[0]; const end = obj.points[1]; ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
            } else {
                drawSmoothLine(ctx, obj.points);
                if ((obj.tool === 'arrow' || obj.tool === 'dashed-arrow') && obj.points.length > 2) {
                    const last = obj.points[obj.points.length - 1]; const prevIndex = Math.max(0, pointsRef.current.length - 5); const prev = pointsRef.current[prevIndex];
                    if(prev && last) drawArrowHead(ctx, prev.x, prev.y, last.x, last.y, obj.thickness);
                }
            }
        });
    }, [drawings, draggingObjectId]);

    useEffect(() => { redrawMainCanvas(); }, [drawings, redrawMainCanvas, draggingObjectId]);

    // --- DROP HANDLER ---
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const jsonData = e.dataTransfer.getData("application/json");
        if (!jsonData) return;
        try {
            const { type, name } = JSON.parse(jsonData);
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const { x, y, scale } = transformRef.current;
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const finalX = (mouseX - x) / scale;
            const finalY = (mouseY - y) / scale;

            // ASTRA / BREACH VECTORIELS
            if (name === 'astra_x') { setDrawings(prev => [...prev, { id: Date.now(), tool: 'wall', subtype: 'ability', points: [{x: finalX - 100, y: finalY}, {x: finalX + 100, y: finalY}], color: '#bd00ff', thickness: 6, opacity: 0.8 }]); setCurrentTool('cursor'); return; }
            if (name === 'breach_e') { setDrawings(prev => [...prev, { id: Date.now(), tool: 'stun_zone', subtype: 'ability', points: [{x: finalX, y: finalY}, {x: finalX, y: finalY - 200}], color: '#eab308', thickness: 0, opacity: 0.8 }]); setCurrentTool('cursor'); return; }
            if (name === 'breach_x') { setDrawings(prev => [...prev, { id: Date.now(), tool: 'breach_x_zone', subtype: 'ability', points: [{x: finalX, y: finalY}, {x: finalX, y: finalY - 850}], color: '#ef4444', thickness: 0, opacity: 0.8 }]); setCurrentTool('cursor'); return; }
            if (name === 'breach_c') { setDrawings(prev => [...prev, { id: Date.now(), tool: 'breach_c_zone', subtype: 'ability', points: [{x: finalX, y: finalY}, {x: finalX, y: finalY - 150}], color: '#f59e0b', thickness: 0, opacity: 0.8 }]); setCurrentTool('cursor'); return; }

            // BRIMSTONE VECTORIELS
            if (name === 'brimstone_c') { setDrawings(prev => [...prev, { id: Date.now(), tool: 'brimstone_c_zone', subtype: 'ability', points: [{x: finalX, y: finalY}], color: '#f97316', thickness: 0, opacity: 0.8 }]); setCurrentTool('cursor'); return; }
            // NOUVEAU : Brimstone Ult (X)
            if (name === 'brimstone_x') {
                setDrawings(prev => [...prev, {
                    id: Date.now(), tool: 'brimstone_x_zone', subtype: 'ability',
                    points: [{x: finalX, y: finalY}], // Un seul point : le centre
                    color: '#ff4500', thickness: 0, opacity: 0.8
                }]);
                setCurrentTool('cursor'); return;
            }

            // --- GESTION GÉNÉRIQUE (IMAGES) ---
            const finalImageSrc = type === 'ability' ? `${name}_game` : name;
            let size = type === 'ability' ? 80 : 50;
            if (ABILITY_SIZES[name]) { size = ABILITY_SIZES[name]; }
            const defaultOpacity = type === 'ability' ? 0.8 : 1;

            setDrawings(prev => [...prev, {
                id: Date.now(), tool: 'image', subtype: type, points: [], color: '#fff', thickness: 0, opacity: defaultOpacity,
                imageSrc: finalImageSrc, x: finalX, y: finalY, width: size, height: size
            }]);
            setCurrentTool('cursor');
        } catch (err) { console.error("Drop error", err); }
    };

    // --- INTERACTION ---
    const getMousePos = (e: React.MouseEvent) => {
        const canvas = tempCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0) return { x: 0, y: 0 };
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1) { setIsPanning(true); panStartRef.current = { x: e.clientX, y: e.clientY }; if(containerRef.current) containerRef.current.style.cursor = 'grabbing'; e.preventDefault(); return; }
        const pos = getMousePos(e);

        if (currentTool === 'cursor') {
            for (let i = drawings.length - 1; i >= 0; i--) {
                const obj = drawings[i];

                // Zones spéciales vectorielles
                if (obj.tool === 'stun_zone') { const hit = checkBreachStunHit(pos, obj); if (hit) { setDraggingObjectId(obj.id); setSpecialDragMode(hit.mode); if (hit.offset) setDragOffset(hit.offset); return; } }
                if (obj.tool === 'breach_x_zone') { const hit = checkBreachUltHit(pos, obj); if (hit) { setDraggingObjectId(obj.id); setSpecialDragMode(hit.mode); if (hit.offset) setDragOffset(hit.offset); return; } }
                if (obj.tool === 'breach_c_zone') { const hit = checkBreachAftershockHit(pos, obj); if (hit) { setDraggingObjectId(obj.id); setSpecialDragMode(hit.mode); if (hit.offset) setDragOffset(hit.offset); return; } }
                if (obj.tool === 'wall') { const hit = checkAstraWallHit(pos, obj); if (hit) { setDraggingObjectId(obj.id); setSpecialDragMode(hit.mode); if (hit.centerStart) setWallCenterStart(hit.centerStart); if (hit.offset) setDragOffset(hit.offset); return; } }
                if (obj.tool === 'brimstone_c_zone') { const hit = checkBrimstoneStimHit(pos, obj); if (hit) { setDraggingObjectId(obj.id); setSpecialDragMode(hit.mode); if (hit.offset) setDragOffset(hit.offset); return; } }

                // NOUVEAU : Brimstone Ult (X)
                if (obj.tool === 'brimstone_x_zone') {
                    const hit = checkBrimstoneUltHit(pos, obj);
                    if (hit) {
                        setDraggingObjectId(obj.id); setSpecialDragMode(hit.mode);
                        if (hit.offset) setDragOffset(hit.offset); return;
                    }
                }

                // Images classiques
                if (obj.tool === 'image' && obj.x != null && obj.y != null) {
                    const w = obj.width || 50; const h = obj.height || 50;
                    if (pos.x >= obj.x - w/2 && pos.x <= obj.x + w/2 && pos.y >= obj.y - h/2 && pos.y <= obj.y + h/2) {
                        setDraggingObjectId(obj.id); setSpecialDragMode(null); setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y }); return;
                    }
                }
            }
            setDraggingObjectId(null);
            return;
        }

        // Pen/Eraser
        if (currentTool === 'agent') {
            const newAgent: DrawingObject = { id: Date.now(), tool: 'image', subtype: 'agent', points: [], color: '#fff', thickness: 0, opacity: 1, imageSrc: selectedAgent, x: pos.x, y: pos.y, width: 50, height: 50 };
            setDrawings(prev => [...prev, newAgent]); return;
        }
        if (currentTool === 'eraser') { setIsDrawing(true); eraseObjectAt(pos.x, pos.y); return; }
        if (currentTool === 'pen') { setIsDrawing(true); startPosRef.current = pos; pointsRef.current = [pos]; const tempCtx = getContext(tempCanvasRef); if (tempCtx) { tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height); tempCtx.beginPath(); tempCtx.moveTo(pos.x, pos.y); } }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) { e.preventDefault(); const dx = e.clientX - panStartRef.current.x; const dy = e.clientY - panStartRef.current.y; const { x, y, scale } = transformRef.current; transformRef.current = { scale, x: x + dx, y: y + dy }; updateTransformStyle(); panStartRef.current = { x: e.clientX, y: e.clientY }; return; }
        const pos = getMousePos(e);

        if (draggingObjectId !== null && specialDragMode) {
            setDrawings(prev => prev.map(obj => {
                if (obj.id !== draggingObjectId) return obj;
                if (obj.tool === 'stun_zone') return updateBreachStunPosition(obj, pos, specialDragMode, dragOffset);
                if (obj.tool === 'breach_x_zone') return updateBreachUltPosition(obj, pos, specialDragMode, dragOffset);
                if (obj.tool === 'breach_c_zone') return updateBreachAftershockPosition(obj, pos, specialDragMode, dragOffset);
                if (obj.tool === 'wall') return updateAstraWallPosition(obj, pos, specialDragMode, dragOffset, wallCenterStart);
                if (obj.tool === 'brimstone_c_zone') return updateBrimstoneStimPosition(obj, pos, dragOffset);
                // NOUVEAU : Brimstone Ult (X)
                if (obj.tool === 'brimstone_x_zone') return updateBrimstoneUltPosition(obj, pos, dragOffset);
                return obj;
            }));
            return;
        }

        if (draggingObjectId !== null && !specialDragMode) {
            setDrawings(prev => prev.map(obj => {
                if (obj.id === draggingObjectId && obj.tool === 'image') {
                    return { ...obj, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
                }
                return obj;
            }));
            return;
        }

        if (!isDrawing) return;
        if (currentTool === 'eraser') { eraseObjectAt(pos.x, pos.y); return; }
        if (currentTool === 'pen') { pointsRef.current.push(pos); const tempCtx = getContext(tempCanvasRef); if (!tempCtx || !tempCanvasRef.current) return; tempCtx.clearRect(0, 0, tempCanvasRef.current.width, tempCtx.canvas.height); tempCtx.strokeStyle = color; tempCtx.lineWidth = thickness; tempCtx.lineCap = 'round'; tempCtx.lineJoin = 'round'; tempCtx.globalAlpha = opacity; if (strokeType === 'dashed' || strokeType === 'dashed-arrow') { tempCtx.setLineDash([thickness * 2, thickness * 2]); } else { tempCtx.setLineDash([]); } if (strokeType === 'rect') { tempCtx.strokeRect(startPosRef.current.x, startPosRef.current.y, pos.x - startPosRef.current.x, pos.y - startPosRef.current.y); } else { drawSmoothLine(tempCtx, pointsRef.current); if ((strokeType === 'arrow' || strokeType === 'dashed-arrow') && pointsRef.current.length > 2) { const last = pointsRef.current[pointsRef.current.length - 1]; const prevIndex = Math.max(0, pointsRef.current.length - 5); const prev = pointsRef.current[prevIndex]; if(prev && last) drawArrowHead(tempCtx, prev.x, prev.y, last.x, last.y, thickness); } } }
    };

    const handleMouseUp = () => {
        if (isPanning) { setIsPanning(false); if(containerRef.current) containerRef.current.style.cursor = currentTool === 'cursor' ? 'default' : (currentTool ? 'crosshair' : 'grab'); return; }
        setDraggingObjectId(null); setSpecialDragMode(null); setDragOffset({ x: 0, y: 0 });
        if (isDrawing) { setIsDrawing(false); if (currentTool === 'pen') { const newDrawing: DrawingObject = { id: Date.now(), tool: strokeType, points: strokeType === 'rect' ? [startPosRef.current, pointsRef.current[pointsRef.current.length - 1]] : [...pointsRef.current], color: color, thickness: thickness, opacity: opacity }; setDrawings(prev => [...prev, newDrawing]); const tempCtx = getContext(tempCanvasRef); if (tempCtx && tempCtx.canvas.width > 0 && tempCtx.canvas.height > 0) tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height); } pointsRef.current = []; }
    };

    const eraseObjectAt = (x: number, y: number) => {
        const hitThreshold = 10;
        const newDrawings = drawings.filter(obj => {
            // Gomme pour images
            if (obj.tool === 'image' && obj.x != null && obj.y != null) { const w = obj.width || 50; const h = obj.height || 50; return !(x >= obj.x - w/2 && x <= obj.x + w/2 && y >= obj.y - h/2 && y <= obj.y + h/2); }

            // Gomme pour zones spéciales (multipoints)
            if (obj.tool === 'wall' || obj.tool === 'stun_zone' || obj.tool === 'breach_x_zone' || obj.tool === 'breach_c_zone') { const p1 = obj.points[0]; const p2 = obj.points[1]; const midX = (p1.x + p2.x)/2; const midY = (p1.y + p2.y)/2; return Math.hypot(x - p1.x, y - p1.y) > 20 && Math.hypot(x - p2.x, y - p2.y) > 20 && Math.hypot(x - midX, y - midY) > 20; }

            // Gomme pour zones spéciales (point unique : Brimstone C et X)
            if (obj.tool === 'brimstone_c_zone' || obj.tool === 'brimstone_x_zone') { const center = obj.points[0]; return Math.hypot(x - center.x, y - center.y) > 25; }

            if (obj.tool === 'rect' && obj.points.length >= 2) { const s = obj.points[0]; const e = obj.points[1]; const minX = Math.min(s.x, e.x) - hitThreshold; const maxX = Math.max(s.x, e.x) + hitThreshold; const minY = Math.min(s.y, e.y) - hitThreshold; const maxY = Math.max(s.y, e.y) + hitThreshold; return !(x >= minX && x <= maxX && y >= minY && y <= maxY); } const isHit = obj.points.some(p => Math.hypot(p.x - x, p.y - y) < (obj.thickness / 2 + hitThreshold)); return !isHit;
        });
        if (newDrawings.length !== drawings.length) setDrawings(newDrawings);
    };

    const updateTransformStyle = () => { if (contentRef.current) { const { x, y, scale } = transformRef.current; contentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`; } };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };
    useEffect(() => { const container = containerRef.current; if (!container) return; const onWheel = (e: WheelEvent) => { e.preventDefault(); const { scale, x, y } = transformRef.current; const newScale = Math.min(Math.max(0.1, scale + (e.deltaY > 0 ? -1 : 1) * 0.1 * scale), 5); const rect = container.getBoundingClientRect(); const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top; const scaleRatio = newScale / scale; const newX = mouseX - (mouseX - x) * scaleRatio; const newY = mouseY - (mouseY - y) * scaleRatio; transformRef.current = { scale: newScale, x: newX, y: newY }; updateTransformStyle(); }; container.addEventListener('wheel', onWheel, { passive: false }); return () => container.removeEventListener('wheel', onWheel); }, []);
    const syncCanvasSize = useCallback(() => { const main = mainCanvasRef.current; const temp = tempCanvasRef.current; const img = imgRef.current; if (main && temp && img && img.clientWidth > 0) { main.width = img.clientWidth; main.height = img.clientHeight; temp.width = img.clientWidth; temp.height = img.clientHeight; redrawMainCanvas(); } }, [redrawMainCanvas]);
    useEffect(() => { const img = imgRef.current; if (!img) return; if (img.complete && img.naturalWidth > 0) syncCanvasSize(); const onLoad = () => syncCanvasSize(); img.addEventListener('load', onLoad); const resizeObserver = new ResizeObserver(() => syncCanvasSize()); resizeObserver.observe(img); return () => { img.removeEventListener('load', onLoad); resizeObserver.disconnect(); }; }, [syncCanvasSize]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full">
            <div className="absolute top-4 left-4 z-30 lg:static lg:h-full lg:w-auto lg:p-4 lg:bg-[#181b1e] lg:border-r lg:border-gray-800">
                <ToolsSidebar currentTool={currentTool} setTool={setCurrentTool} strokeType={strokeType} setStrokeType={setStrokeType} color={color} setColor={setColor} opacity={opacity} setOpacity={setOpacity} thickness={thickness} setThickness={setThickness} selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} onSave={() => saveStrategy(drawings)} onLoad={fetchStrategies} />
            </div>
            <div ref={containerRef} className="relative flex-1 w-full h-full bg-[#1f2326] overflow-hidden select-none" style={{ cursor: currentTool === 'cursor' ? 'default' : (currentTool ? 'crosshair' : 'default') }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onDragOver={handleDragOver} onDrop={handleDrop}>
                <div ref={contentRef} className="origin-top-left absolute top-0 left-0" draggable={false}>
                    <img ref={imgRef} src={mapSrc} alt="Map" draggable={false} className="block select-none pointer-events-none min-w-[1500px] h-auto border-2 border-slate-600 shadow-lg" onLoad={syncCanvasSize} />
                    <canvas ref={mainCanvasRef} draggable={false} className="absolute inset-0 w-full h-full pointer-events-none" />
                    <canvas ref={tempCanvasRef} draggable={false} className="absolute inset-0 w-full h-full pointer-events-none" />
                </div>
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none select-none backdrop-blur-sm">
                    Molette: Zoom • Clic Molette: Pan • Glisser Agents depuis le menu
                </div>
                <LoadModal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} isLoading={isLoading} strategies={savedStrategies} onLoadStrategy={(strat) => { if (confirm(`Charger "${strat.name}" ?`)) { setDrawings(strat.data); setShowLoadModal(false); }}} />
            </div>
        </div>
    );
};