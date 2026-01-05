import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors'; // <-- Import

/**
 * DESSIN : Image de Wingman centrée sur P1, orientée vers P2, avec un losange en P2.
 */
export const drawGekkoQ = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Centre de l'image
    const p2 = obj.points[1]; // Poignée de rotation

    const size = ABILITY_SIZES['gekko_q_size'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('gekko'); // Vert Lime (#a3e635)
    // Wingman a aussi du rose ? Si tu veux garder le rose spécifique Gekko :
    // const customColor = '#fda4af';
    // Ici j'utilise la couleur agent par défaut pour être cohérent, mais tu peux forcer.
    const handleColor = agentHex;

    // Calcul de l'angle
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();

    // --- 1. DESSIN DE L'IMAGE ROTATÉE ---
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle + Math.PI / 2);

    // Fond sous l'image
    ctx.beginPath();
    ctx.arc(0, 0, size/2.5, 0, Math.PI*2);
    ctx.fillStyle = hexToRgba(agentHex, 0.3);
    ctx.fill();

    if (imageCache && obj.imageSrc) {
        let img = imageCache.get(obj.imageSrc);
        if (!img) {
            img = new Image();
            img.src = `/abilities/${obj.imageSrc}.png`;
            img.onload = triggerRedraw;
            imageCache.set(obj.imageSrc, img);
        }

        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
        }
    }

    ctx.restore();

    // --- 2. DESSIN DU LOSANGE DE ROTATION (P2) ---
    ctx.save();
    ctx.translate(p2.x, p2.y);
    ctx.rotate(angle + Math.PI / 4);

    ctx.fillStyle = handleColor;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    const diamondSize = 8;
    ctx.beginPath();
    ctx.rect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Petit point central
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 3, 0, Math.PI*2);
    ctx.fillStyle = handleColor;
    ctx.fill();
};

// ... check et update inchangés
export const checkGekkoQHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
    mapScale: number = 1.0
): { mode: 'center' | 'rotate', offset?: { x: number, y: number } } | null => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const size = ABILITY_SIZES['gekko_q_size'] * mapScale;
    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 15) {
        return { mode: 'rotate' };
    }
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < size / 2) {
        return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    }
    return null;
};

export const updateGekkoQPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
): DrawingObject => {
    const p1 = obj.points[0];
    const handleDist = ABILITY_SIZES['gekko_q_handle_dist'] * mapScale;
    if (mode === 'rotate') {
        const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        const newP2 = {
            x: p1.x + Math.cos(angle) * handleDist,
            y: p1.y + Math.sin(angle) * handleDist
        };
        return { ...obj, points: [p1, newP2] };
    }
    if (mode === 'center') {
        const p2 = obj.points[1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        return { ...obj, points: [newP1, { x: newP1.x + dx, y: newP1.y + dy }] };
    }
    return obj;
};