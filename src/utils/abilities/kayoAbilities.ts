import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors';

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

    const isUlt = obj.tool === 'kayo_x_zone';
    const radius = ABILITY_SIZES[isUlt ? 'kayo_x_radius' : 'kayo_e_radius'] * mapScale;
    const iconSize = ABILITY_SIZES[isUlt ? 'kayo_x_icon_size' : 'kayo_e_icon_size'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('kayo'); // Bleu Robot (#60a5fa)
    const fillColor = hexToRgba(agentHex, isUlt ? 0.15 : 0.2);
    const strokeColor = agentHex;

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
            // Fond coloré
            ctx.beginPath();
            ctx.arc(center.x, center.y, iconSize/2, 0, Math.PI*2);
            ctx.fillStyle = agentHex;
            ctx.fill();

            ctx.drawImage(
                img,
                center.x - iconSize / 2,
                center.y - iconSize / 2,
                iconSize,
                iconSize
            );
        } else {
            ctx.beginPath();
            ctx.fillStyle = strokeColor;
            ctx.arc(center.x, center.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
};

// ... check et update inchangés
export const checkKayoHit = (
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

export const updateKayoPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number },
): DrawingObject => {
    return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
};