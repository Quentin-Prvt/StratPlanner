import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

export const drawFadeHaunt = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    const radius = ABILITY_SIZES['fade_e_radius'] || 280;
    const iconSize = ABILITY_SIZES['fade_e_icon_size'] || 50;

    ctx.save();

    // 1. Zone de Reveal
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    // Indigo plus clair et plus transparent pour le Reveal
    ctx.fillStyle = 'rgba(129, 140, 248, 0.1)';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // 2. Icône Centrale
    if (imageCache) {
        const imageSrc = 'fade_e_icon';
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
        }
    }

    ctx.restore();
};

export const checkFadeHauntHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const radius = ABILITY_SIZES['fade_e_radius'] || 280;

    if (Math.hypot(pos.x - center.x, pos.y - center.y) < radius) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

export const updateFadeHauntPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number }
): DrawingObject => {
    return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
};