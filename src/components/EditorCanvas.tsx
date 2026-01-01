import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ToolsSidebar, type ToolType, type StrokeType } from './ToolsSidebar';
import { LoadModal } from './LoadModal';
import { useSupabaseStrategies } from '../hooks/useSupabase';
import { drawSmoothLine, drawArrowHead } from '../utils/canvasDrawing';
import type { DrawingObject } from '../types/canvas';

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

    // Outils
    const [currentTool, setCurrentTool] = useState<ToolType>('pen');
    const [strokeType, setStrokeType] = useState<StrokeType>('solid');
    const [color, setColor] = useState('#ef4444');
    const [opacity, setOpacity] = useState(1);
    const [thickness, setThickness] = useState(4);
    const [selectedAgent, setSelectedAgent] = useState('jett');

    // Interaction
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [draggingObjectId, setDraggingObjectId] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // --- HOOK SUPABASE ---
    const {
        savedStrategies, isLoading, showLoadModal, setShowLoadModal,
        saveStrategy, fetchStrategies
    } = useSupabaseStrategies('Ascent');

    // --- LOGIQUE IMAGE ---
    const getOrLoadImage = (src: string): HTMLImageElement | null => {
        if (imageCache.current.has(src)) return imageCache.current.get(src) || null;
        const img = new Image();
        img.src = `/agents/${src}.png`;
        img.onload = () => redrawMainCanvas();
        imageCache.current.set(src, img);
        return img;
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

            if (obj.tool === 'image' && obj.imageSrc && obj.x != null && obj.y != null) {
                const img = getOrLoadImage(obj.imageSrc);
                if (img && img.complete) {
                    const w = obj.width || 50;
                    const h = obj.height || 50;
                    const drawX = obj.x - w/2;
                    const drawY = obj.y - h/2;
                    const borderRadius = 6; // Rayon des coins arrondis

                    // --- ÉTAPE 1 & 2 : FOND GRIS FONCÉ + IMAGE ---
                    ctx.save();
                    ctx.beginPath();
                    // Définition de la forme (carré arrondi)
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(drawX, drawY, w, h, borderRadius);
                    } else {
                        ctx.rect(drawX, drawY, w, h);
                    }

                    // 1. Remplissage du fond (Gris très foncé, couleur de la sidebar)
                    ctx.fillStyle = '#1e293b';
                    ctx.fill();

                    // 2. On "coupe" ce qui dépasse pour que l'image respecte les coins arrondis
                    ctx.clip();
                    ctx.drawImage(img, drawX, drawY, w, h);
                    ctx.restore(); // On restaure pour ne pas clipper la suite

                    // --- ÉTAPE 3 : BORDURE NÉON ---
                    ctx.save();
                    const neonColor = '#cbd5e1'; // Un gris clair lumineux (Slate-300) pour le néon

                    // Configuration du style Néon
                    ctx.strokeStyle = neonColor;
                    ctx.lineWidth = 2;
                    // C'est l'ombre portée qui crée l'effet de "lueur" (Glow)
                    ctx.shadowColor = neonColor;
                    ctx.shadowBlur = 15; // Intensité du flou du néon
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.setLineDash([]);

                    // On redéfinit le chemin pour dessiner la bordure
                    ctx.beginPath();
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(drawX, drawY, w, h, borderRadius);
                    } else {
                        ctx.rect(drawX, drawY, w, h);
                    }
                    ctx.stroke(); // Dessine le contour brillant
                    ctx.restore();

                    // --- ÉTAPE 4 : CADRE DE SÉLECTION (Vert si on bouge) ---
                    if (draggingObjectId === obj.id) {
                        ctx.save();
                        ctx.strokeStyle = '#22c55e'; // Vert plus vif (Green-500)
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);
                        // On désactive l'ombre pour le cadre de sélection pour qu'il reste net
                        ctx.shadowBlur = 0;
                        ctx.strokeRect(drawX - 3, drawY - 3, w + 6, h + 6);
                        ctx.restore();
                    }
                }
                return;
            }
            // CAS DESSIN
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = obj.thickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (obj.tool === 'dashed' || obj.tool === 'dashed-arrow') {
                ctx.setLineDash([obj.thickness * 2, obj.thickness * 2]);
            } else {
                ctx.setLineDash([]);
            }

            if (obj.tool === 'rect') {
                if (obj.points.length >= 2) {
                    const start = obj.points[0];
                    const end = obj.points[1];
                    ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
                }
            } else {
                drawSmoothLine(ctx, obj.points);
                if ((obj.tool === 'arrow' || obj.tool === 'dashed-arrow') && obj.points.length > 2) {
                    const last = obj.points[obj.points.length - 1];
                    const prevIndex = Math.max(0, obj.points.length - 5);
                    const prev = obj.points[prevIndex];
                    drawArrowHead(ctx, prev.x, prev.y, last.x, last.y, obj.thickness);
                }
            }
        });
    }, [drawings, draggingObjectId]);

    useEffect(() => { redrawMainCanvas(); }, [drawings, redrawMainCanvas, draggingObjectId]);

    // --- NAVIGATION & UTILS ---
    const updateTransformStyle = () => {
        if (contentRef.current) {
            const { x, y, scale } = transformRef.current;
            contentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        }
    };

    // Helper Typé correctement pour corriger TS2345
    const getContext = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.getContext('2d');
    };

    const getMousePos = (e: React.MouseEvent) => {
        const canvas = tempCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0) return { x: 0, y: 0 };
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    // Zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const { scale, x, y } = transformRef.current;
            const newScale = Math.min(Math.max(0.1, scale + (e.deltaY > 0 ? -1 : 1) * 0.1 * scale), 5);
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const scaleRatio = newScale / scale;
            const newX = mouseX - (mouseX - x) * scaleRatio;
            const newY = mouseY - (mouseY - y) * scaleRatio;
            transformRef.current = { scale: newScale, x: newX, y: newY };
            updateTransformStyle();
        };
        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, []);

    // Resize
    const syncCanvasSize = useCallback(() => {
        const main = mainCanvasRef.current;
        const temp = tempCanvasRef.current;
        const img = imgRef.current;
        if (main && temp && img && img.clientWidth > 0) {
            main.width = img.clientWidth;
            main.height = img.clientHeight;
            temp.width = img.clientWidth;
            temp.height = img.clientHeight;
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

    // --- EVENT HANDLERS ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const agentName = e.dataTransfer.getData("agent");
        if (!agentName) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const { x, y, scale } = transformRef.current;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const finalX = (mouseX - x) / scale;
        const finalY = (mouseY - y) / scale;

        const newAgent: DrawingObject = {
            id: Date.now(),
            tool: 'image',
            points: [],
            color: '#fff',
            thickness: 0,
            opacity: 1,
            imageSrc: agentName,
            x: finalX,
            y: finalY,
            width: 50,
            height: 50
        };
        setDrawings(prev => [...prev, newAgent]);
        setCurrentTool('cursor');
    };

    const eraseObjectAt = (x: number, y: number) => {
        const hitThreshold = 10;
        const newDrawings = drawings.filter(obj => {
            // Check IMAGE (Correction TS18048)
            if (obj.tool === 'image' && obj.x != null && obj.y != null) {
                const w = obj.width || 50; const h = obj.height || 50;
                return !(x >= obj.x - w/2 && x <= obj.x + w/2 && y >= obj.y - h/2 && y <= obj.y + h/2);
            }
            // Check RECT
            if (obj.tool === 'rect' && obj.points.length >= 2) {
                const s = obj.points[0]; const e = obj.points[1];
                const minX = Math.min(s.x, e.x) - hitThreshold; const maxX = Math.max(s.x, e.x) + hitThreshold;
                const minY = Math.min(s.y, e.y) - hitThreshold; const maxY = Math.max(s.y, e.y) + hitThreshold;
                return !(x >= minX && x <= maxX && y >= minY && y <= maxY);
            }
            const isHit = obj.points.some(p => Math.hypot(p.x - x, p.y - y) < (obj.thickness / 2 + hitThreshold));
            return !isHit;
        });
        if (newDrawings.length !== drawings.length) setDrawings(newDrawings);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // MOLETTE POUR PAN
        if (e.button === 1) {
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
                // Correction TS18048
                if (obj.tool === 'image' && obj.x != null && obj.y != null) {
                    const w = obj.width || 50; const h = obj.height || 50;
                    if (pos.x >= obj.x - w/2 && pos.x <= obj.x + w/2 && pos.y >= obj.y - h/2 && pos.y <= obj.y + h/2) {
                        setDraggingObjectId(obj.id);
                        setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y });
                        return;
                    }
                }
            }
            return;
        }

        if (currentTool === 'agent') {
            const newAgent: DrawingObject = {
                id: Date.now(), tool: 'image', points: [], color: '#fff', thickness: 0, opacity: 1,
                imageSrc: selectedAgent, x: pos.x, y: pos.y, width: 50, height: 50
            };
            setDrawings(prev => [...prev, newAgent]);
            return;
        }

        if (currentTool === 'eraser') { setIsDrawing(true); eraseObjectAt(pos.x, pos.y); return; }

        if (currentTool === 'pen') {
            setIsDrawing(true); startPosRef.current = pos; pointsRef.current = [pos];
            const tempCtx = getContext(tempCanvasRef);
            if (tempCtx) { tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height); tempCtx.beginPath(); tempCtx.moveTo(pos.x, pos.y); }
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

        const pos = getMousePos(e);

        if (draggingObjectId !== null) {
            setDrawings(prev => prev.map(obj => {
                if (obj.id === draggingObjectId) { return { ...obj, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }; }
                return obj;
            }));
            return;
        }

        if (!isDrawing) return;

        if (currentTool === 'eraser') { eraseObjectAt(pos.x, pos.y); return; }

        if (currentTool === 'pen') {
            pointsRef.current.push(pos);
            const tempCtx = getContext(tempCanvasRef);
            if (!tempCtx || !tempCanvasRef.current) return;

            tempCtx.clearRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);
            tempCtx.strokeStyle = color; tempCtx.lineWidth = thickness; tempCtx.lineCap = 'round'; tempCtx.lineJoin = 'round'; tempCtx.globalAlpha = opacity;
            if (strokeType === 'dashed' || strokeType === 'dashed-arrow') { tempCtx.setLineDash([thickness * 2, thickness * 2]); } else { tempCtx.setLineDash([]); }

            if (strokeType === 'rect') {
                tempCtx.strokeRect(startPosRef.current.x, startPosRef.current.y, pos.x - startPosRef.current.x, pos.y - startPosRef.current.y);
            } else {
                drawSmoothLine(tempCtx, pointsRef.current);
                if ((strokeType === 'arrow' || strokeType === 'dashed-arrow') && pointsRef.current.length > 2) {
                    const last = pointsRef.current[pointsRef.current.length - 1];
                    const prevIndex = Math.max(0, pointsRef.current.length - 5);
                    const prev = pointsRef.current[prevIndex];
                    if (Math.hypot(last.x - prev.x, last.y - prev.y) > 5) { drawArrowHead(tempCtx, prev.x, prev.y, last.x, last.y, thickness); }
                }
            }
        }
    };

    const handleMouseUp = () => {
        if (isPanning) { setIsPanning(false); if(containerRef.current) containerRef.current.style.cursor = currentTool === 'cursor' ? 'default' : (currentTool ? 'crosshair' : 'grab'); return; }
        if (draggingObjectId !== null) { setDraggingObjectId(null); return; }

        if (isDrawing) {
            setIsDrawing(false);
            if (currentTool === 'pen') {
                const newDrawing: DrawingObject = {
                    id: Date.now(), tool: strokeType, points: strokeType === 'rect' ? [startPosRef.current, pointsRef.current[pointsRef.current.length - 1]] : [...pointsRef.current],
                    color: color, thickness: thickness, opacity: opacity
                };
                setDrawings(prev => [...prev, newDrawing]);
                const tempCtx = getContext(tempCanvasRef);
                tempCtx?.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
            }
            pointsRef.current = [];
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full">
            <div className="absolute top-4 left-4 z-30 lg:static lg:h-full lg:w-auto lg:p-4 lg:bg-[#181b1e] lg:border-r lg:border-gray-800">
                <ToolsSidebar
                    currentTool={currentTool} setTool={setCurrentTool}
                    strokeType={strokeType} setStrokeType={setStrokeType}
                    color={color} setColor={setColor}
                    opacity={opacity} setOpacity={setOpacity}
                    thickness={thickness} setThickness={setThickness}
                    selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent}
                    onSave={() => saveStrategy(drawings)}
                    onLoad={fetchStrategies}
                />
            </div>

            <div
                ref={containerRef}
                className="relative flex-1 w-full h-full bg-[#1f2326] overflow-hidden select-none"
                style={{ cursor: currentTool === 'cursor' ? 'default' : (currentTool ? 'crosshair' : 'default') }}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                onDragOver={handleDragOver} onDrop={handleDrop}
            >
                <div ref={contentRef} className="origin-top-left absolute top-0 left-0" draggable={false}>
                    <img
                        ref={imgRef}
                        src={mapSrc}
                        alt="Map"
                        draggable={false}
                        className="block select-none pointer-events-none min-w-[1500px] h-auto border-2 border-slate-600 shadow-lg"
                        onLoad={syncCanvasSize}
                    />
                    <canvas ref={mainCanvasRef} draggable={false} className="absolute inset-0 w-full h-full pointer-events-none" />
                    <canvas ref={tempCanvasRef} draggable={false} className="absolute inset-0 w-full h-full pointer-events-none" />
                </div>

                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none select-none backdrop-blur-sm">
                    Molette: Zoom • Clic Molette: Pan • Glisser Agents depuis le menu
                </div>

                <LoadModal
                    isOpen={showLoadModal}
                    onClose={() => setShowLoadModal(false)}
                    isLoading={isLoading}
                    strategies={savedStrategies}
                    onLoadStrategy={(strat) => {
                        if (confirm(`Charger "${strat.name}" ?`)) {
                            setDrawings(strat.data);
                            setShowLoadModal(false);
                        }
                    }}
                />
            </div>
        </div>
    );
};