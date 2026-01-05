import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors'; // <-- Import

export const drawFadeSeize = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    const radius = ABILITY_SIZES['fade_q_radius'] * mapScale;
    const iconSize = ABILITY_SIZES['fade_q_icon_size'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('fade');
    const zoneColor = hexToRgba(agentHex, 0.25);
    const strokeColor = '#6366f1'; // Indigo électrique

    ctx.save();

    // 1. Zone d'effet
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = zoneColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
    }

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
            // Fond coloré sous l'icône
            ctx.beginPath();
            ctx.arc(center.x, center.y, iconSize/2, 0, Math.PI*2);
            ctx.fillStyle = agentHex; // Fond sombre Fade
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
            ctx.arc(center.x, center.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
};

// ... check et update inchangés
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
    dragOffset: { x: number, y: number },
): DrawingObject => {
    return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
};