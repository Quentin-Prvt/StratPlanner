import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors';

/**
 * Dessine le E de Chamber (Rendezvous - TP)
 */
export const drawChamberRendezvous = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    const radius = ABILITY_SIZES['chamber_e_radius'] * mapScale;
    const iconSize = ABILITY_SIZES['chamber_e_icon_size'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('chamber'); // Or / Jaune
    const zoneColor = hexToRgba(agentHex, 0.15);
    const strokeColor = agentHex;

    ctx.save();

    // 1. Zone de TP
    if(showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = zoneColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
    }

    // 2. Icône Centrale
    ctx.translate(center.x, center.y);

    if (imageCache) {
        const imageSrc = 'chamber_e_icon';
        let img = imageCache.get(imageSrc);

        if (!img) {
            img = new Image();
            img.src = `/abilities/${imageSrc}.png`;
            img.onload = triggerRedraw;
            img.onerror = () => {};
            imageCache.set(imageSrc, img);
        }

        if (img.complete && img.naturalWidth > 0) {
            try {
                // Petit fond coloré sous l'icône
                ctx.beginPath();
                ctx.arc(0, 0, iconSize/2, 0, Math.PI*2);
                ctx.fillStyle = agentHex;
                ctx.fill();

                ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
            } catch (e) { }
        } else {
            ctx.fillStyle = agentHex;
            ctx.fillRect(-10, -10, 20, 20);
        }
    }

    ctx.restore();
};


export const checkChamberRendezvousHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
    mapScale: number = 1.0
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const radius = ABILITY_SIZES['chamber_e_radius'] * mapScale;
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < radius) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

export const updateChamberRendezvousPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number },
): DrawingObject => {
    const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
    return { ...obj, points: [newCenter] };
};