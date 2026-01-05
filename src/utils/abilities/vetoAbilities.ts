import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors'; // <-- NOUVEL IMPORT

/**
 * CONFIGURATION SPÉCIFIQUE VETO
 */
const getVetoConfig = (tool: string) => {
    const agentHex = getAgentColor(tool); // Récupère le Rose (#ec4899)

    switch (tool) {
        case 'veto_c_zone':
            return {
                fill: 'transparent', // Toujours transparent
                stroke: agentHex,
                radiusKey: 'veto_c_radius',
                iconKey: 'veto_c_icon_size'
            };
        case 'veto_q_zone':
            return {
                fill: hexToRgba(agentHex, 0.2), // Rempli
                stroke: agentHex,
                radiusKey: 'veto_q_radius',
                iconKey: 'veto_q_icon_size'
            };
        case 'veto_e_zone':
            return {
                fill: 'transparent', // Toujours transparent
                stroke: agentHex,
                radiusKey: 'veto_e_radius',
                iconKey: 'veto_e_icon_size'
            };
        default:
            return { fill: 'transparent', stroke: 'gray', radiusKey: 'veto_c_radius', iconKey: 'veto_c_icon_size' };
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
    const agentHex = getAgentColor(obj.tool); // Couleur pour le fond de l'icône

    const radius = ABILITY_SIZES[conf.radiusKey] * mapScale;
    const iconSize = ABILITY_SIZES[conf.iconKey] * mapScale;

    ctx.save();

    // 1. Zone (Cercle)
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

        if (conf.fill !== 'transparent') {
            ctx.fillStyle = conf.fill;
            ctx.fill();
        }

        ctx.strokeStyle = conf.stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // 2. Icône avec fond de couleur
    if (imageCache && obj.imageSrc) {
        // Fond de l'icône (Cercle plein couleur agent)
        ctx.beginPath();
        ctx.arc(center.x, center.y, iconSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = agentHex; // Rose plein
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        let img = imageCache.get(obj.imageSrc);
        if (!img) {
            img = new Image();
            img.src = `/abilities/${obj.imageSrc}.png`;
            img.onload = triggerRedraw;
            imageCache.set(obj.imageSrc, img);
        }
        if (img.complete && img.naturalWidth > 0) {
            // Image légèrement plus petite pour voir le fond coloré
            const imgDrawSize = iconSize * 0.8;
            ctx.drawImage(img, center.x - imgDrawSize/2, center.y - imgDrawSize/2, imgDrawSize, imgDrawSize);
        }
    }
    ctx.restore();
};

// ... (checkVetoHit et updateVetoPosition inchangés)
export const checkVetoHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const center = obj.points[0];
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < 30) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

export const updateVetoPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number },
) => {
    return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
};