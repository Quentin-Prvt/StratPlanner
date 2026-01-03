import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * Dessine les zones circulaires de KAY/O (E et X)
 */
export const drawKayoZone = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    // Config selon l'outil (E ou X)
    const isUlt = obj.tool === 'kayo_x_zone';
    const radius = ABILITY_SIZES[isUlt ? 'kayo_x_radius' : 'kayo_e_radius'] * mapScale;
    const iconSize = ABILITY_SIZES[isUlt ? 'kayo_x_icon_size' : 'kayo_e_icon_size'] * mapScale;

    // Couleurs : Cyan électrique pour le E, Bleu plus dense pour l'Ult
    const fillColor = isUlt ? 'rgba(6, 182, 212, 0.15)' : 'rgba(34, 211, 238, 0.2)';
    const strokeColor = isUlt ? '#06b6d4' : '#22d3ee';

    ctx.save();

    // 1. Zone d'effet
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
    }

    // 2. Icône Centrale
    if (imageCache && obj.imageSrc) {
        let img = imageCache.get(obj.imageSrc);
        if (!img) {
            img = new Image();
            img.src = `/abilities/${obj.imageSrc}.png`;
            img.onload = triggerRedraw;
            imageCache.set(obj.imageSrc, img);
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
            ctx.fillStyle = strokeColor;
            ctx.arc(center.x, center.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
};

/**
 * Hit Test (Logique circulaire standard)
 */
export const checkKayoHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];


    const HITBOX_RADIUS = 30; // Environ la taille de l'icône

    if (Math.hypot(pos.x - center.x, pos.y - center.y) < HITBOX_RADIUS) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

/**
 * Update Position
 */
export const updateKayoPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number },
): DrawingObject => {
    return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
};