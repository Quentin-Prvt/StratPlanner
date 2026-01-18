import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors';

/**
 * Dessine le C de Chamber (Trademark - Piège)
 */
export const drawChamberTrademark = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    const radius = ABILITY_SIZES['chamber_c_radius'] * mapScale;
    const iconSize = ABILITY_SIZES['chamber_c_icon_size'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('chamber');
    const zoneColor = hexToRgba(agentHex, 0.2);
    const strokeColor = agentHex;

    ctx.save();

    // 1. Zone de détection
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = zoneColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Bordure pointillés
        ctx.fill();
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. Icône Centrale
    ctx.translate(center.x, center.y);

    if (imageCache) {
        const imageSrc = 'chamber_c_icon';
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
                // Petit fond coloré
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

// ... check et update inchangés
export const checkChamberTrademarkHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const HITBOX_RADIUS = 30;
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < HITBOX_RADIUS) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

export const updateChamberTrademarkPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number },
): DrawingObject => {
    const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
    return { ...obj, points: [newCenter] };
};