import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors'; // <-- Import

const BEACON_IMAGE_SIZE = 20;

export const drawBrimstoneStim = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];
    const radius = ABILITY_SIZES['brimstone_c_radius'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('brimstone'); // Orange
    const zoneColor = hexToRgba(agentHex, 0.3);
    const strokeColor = agentHex;

    ctx.save();

    // 1. Zone d'effet
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = zoneColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius * 0.95, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    // 2. Logo Central
    ctx.translate(center.x, center.y);

    if (imageCache) {
        const imageSrc = 'brimstone_c_icon';
        let img = imageCache.get(imageSrc);

        if (!img) {
            img = new Image();
            img.src = `/abilities/${imageSrc}.png`;
            img.onload = triggerRedraw;
            img.onerror = () => { console.warn(`Image introuvable: `); };
            imageCache.set(imageSrc, img);
        }

        if (img.complete && img.naturalWidth > 0) {
            try {
                // Petit cercle de fond pour l'icone
                ctx.beginPath();
                ctx.arc(0, 0, BEACON_IMAGE_SIZE/1.5, 0, Math.PI*2);
                ctx.fillStyle = agentHex;
                ctx.fill();

                ctx.drawImage(
                    img,
                    -BEACON_IMAGE_SIZE / 2,
                    -BEACON_IMAGE_SIZE / 2,
                    BEACON_IMAGE_SIZE,
                    BEACON_IMAGE_SIZE
                );
            } catch (e) {}
        } else {
            ctx.beginPath();
            ctx.fillStyle = strokeColor;
            ctx.arc(0, 0, 10, 0, Math.PI*2);
            ctx.fill();
        }
    }

    ctx.restore();
};

// ... check et update inchangés
export const checkBrimstoneStimHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const HITBOX_RADIUS = 25;
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < HITBOX_RADIUS) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

export const updateBrimstoneStimPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number },
): DrawingObject => {
    const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
    return { ...obj, points: [newCenter] };
};