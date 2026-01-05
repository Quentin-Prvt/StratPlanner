import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors';

/**
 * Récupère la config
 */
const getIsoConfig = (tool: string, mapScale: number = 1.0) => {
    const agentHex = getAgentColor('iso'); // Violet Énergie (#c084fc)
    const zoneColor = hexToRgba(agentHex, 0.4);
    const strokeColor = agentHex;

    switch (tool) {
        case 'iso_q_zone':
            return {
                width: ABILITY_SIZES['iso_q_width'] * mapScale,
                length: ABILITY_SIZES['iso_q_length'] * mapScale,
                color: zoneColor,
                stroke: strokeColor
            };
        case 'iso_x_zone':
            return {
                width: ABILITY_SIZES['iso_x_width'] * mapScale,
                length: ABILITY_SIZES['iso_x_length'] * mapScale,
                color: zoneColor,
                stroke: strokeColor
            };
        default:
            return { width: 100, length: 100, color: 'gray', stroke: 'white' };
    }
};

/**
 * DESSIN : Rectangle Rotatif
 */
export const drawIsoRect = (ctx: CanvasRenderingContext2D, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    const conf = getIsoConfig(obj.tool, mapScale);

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    ctx.fillStyle = conf.color;
    ctx.strokeStyle = conf.stroke;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.rect(0, -conf.width / 2, conf.length, conf.width);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // --- CONTROLES ---
    // P1 (Centre)
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = conf.stroke;
    ctx.fill();

    // P2 (Handle)
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = conf.stroke;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
};

// ... check et update inchangés
export const checkIsoHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'rotate' };
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 20) {
        return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    }
    return null;
};

export const updateIsoPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0 // Ajout mapScale
): DrawingObject => {
    const p1 = obj.points[0];
    const conf = getIsoConfig(obj.tool, mapScale);

    if (mode === 'rotate') {
        const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        const newP2 = {
            x: p1.x + Math.cos(angle) * conf.length,
            y: p1.y + Math.sin(angle) * conf.length
        };
        return { ...obj, points: [p1, newP2] };
    }
    if (mode === 'center') {
        const p2 = obj.points[1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        return { ...obj, points: [newP1, { x: newP1.x + dx, y: newP1.y + dy }] };
    }
    return obj;
};