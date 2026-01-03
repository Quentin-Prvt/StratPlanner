import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * CONFIGURATION DES COULEURS
 */
const getVetoConfig = (tool: string) => {
    switch (tool) {
        case 'veto_c_zone':
            return { color: 'rgba(236, 72, 153, 0.2)', stroke: '#ec4899', radiusKey: 'veto_c_radius', iconKey: 'veto_c_icon_size' }; // Rose
        case 'veto_q_zone':
            return { color: 'rgba(236, 72, 153, 0.2)', stroke: '#ec4899', radiusKey: 'veto_q_radius', iconKey: 'veto_q_icon_size' }; // Rose
        case 'veto_e_zone':
            return { color: 'rgba(236, 72, 153, 0.2)', stroke: '#ec4899', radiusKey: 'veto_e_radius', iconKey: 'veto_e_icon_size' }; // Rose
        default:
            return { color: 'rgba(100, 100, 100, 0.2)', stroke: 'gray', radiusKey: 'veto_c_radius', iconKey: 'veto_c_icon_size' };
    }
};

/**
 * DESSIN : Zones Circulaires (C, Q, E)
 */
export const drawVetoZone = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];
    const conf = getVetoConfig(obj.tool);

    const radius = ABILITY_SIZES[conf.radiusKey] * mapScale;
    const iconSize = ABILITY_SIZES[conf.iconKey] * mapScale;

    ctx.save();

    // 1. Zone
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = conf.color;
        ctx.strokeStyle = conf.stroke;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
    }

    // 2. Icône
    if (imageCache && obj.imageSrc) {
        let img = imageCache.get(obj.imageSrc);
        if (!img) {
            img = new Image();
            img.src = `/abilities/${obj.imageSrc}.png`;
            img.onload = triggerRedraw;
            imageCache.set(obj.imageSrc, img);
        }
        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, center.x - iconSize/2, center.y - iconSize/2, iconSize, iconSize);
        }
    }
    ctx.restore();
};

/**
 * HIT TEST : Uniquement sur l'icône (Clic au travers)
 */
export const checkVetoHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const center = obj.points[0];
    // On clique uniquement sur l'icône centrale, pas toute la zone
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < 30) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

/**
 * UPDATE POSITION
 */
export const updateVetoPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number },
) => {
    // Simple déplacement du point central
    return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
};