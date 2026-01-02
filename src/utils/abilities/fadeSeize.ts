import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

export const drawFadeSeize = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    // --- UTILISATION DES TAILLES DYNAMIQUES ---
    const radius = ABILITY_SIZES['fade_q_radius'] || 160;
    const iconSize = ABILITY_SIZES['fade_q_icon_size'] || 45;

    ctx.save();

    // 1. Zone d'effet
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(79, 70, 229, 0.25)';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
    }
    // Bordure stylisée intérieure
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.92, 0, Math.PI * 2);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Icône Centrale
    if (imageCache) {
        const imageSrc = 'fade_q_icon';
        let img = imageCache.get(imageSrc);

        if (!img) {
            img = new Image();
            img.src = `/abilities/${imageSrc}.png`;
            img.onload = triggerRedraw;
            imageCache.set(imageSrc, img);
        }

        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(
                img,
                center.x - iconSize / 2,
                center.y - iconSize / 2,
                iconSize,
                iconSize
            );
        } else {
            // Fallback
            ctx.beginPath();
            ctx.fillStyle = '#6366f1';
            ctx.arc(center.x, center.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
};

export const checkFadeSeizeHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const HITBOX_RADIUS = 30;
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < HITBOX_RADIUS) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

export const updateFadeSeizePosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number }
): DrawingObject => {
    return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
};