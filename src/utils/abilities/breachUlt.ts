import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors'; // <-- Import

export const drawBreachUlt = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    const GAP = ABILITY_SIZES['breach_x_gap'] * mapScale;
    const WIDTH = ABILITY_SIZES['breach_x_width'] * mapScale;
    const FIXED_LENGTH = ABILITY_SIZES['breach_x_fixed_length'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('breach');
    // Pour l'ult, on veut plus foncé/opaque
    const zoneColor = hexToRgba(agentHex, 0.5);
    const strokeColor = agentHex;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const rectLength = Math.max(0, FIXED_LENGTH - GAP);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    if (rectLength > 0) {
        ctx.fillStyle = zoneColor;
        ctx.fillRect(GAP, -WIDTH / 2, rectLength, WIDTH);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(GAP, -WIDTH / 2, rectLength, WIDTH);
    }
    ctx.restore();

    // A. Origine
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.arc(p1.x, p1.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // B. Handle
    ctx.save();
    ctx.translate(p2.x, p2.y);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = strokeColor; // Plein
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    const diamondSize = 14;
    ctx.beginPath();
    ctx.rect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

// ... checkBreachUltHit et updateBreachUltPosition restent inchangés
export const checkBreachUltHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center' | 'handle', offset?: { x: number, y: number } } | null => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'handle' };
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 15) return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    return null;
};

export const updateBreachUltPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'handle',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
): DrawingObject => {
    const p1 = obj.points[0];
    const FIXED_LENGTH = ABILITY_SIZES['breach_x_fixed_length'] * mapScale;
    if (mode === 'handle') {
        const dx = pos.x - p1.x;
        const dy = pos.y - p1.y;
        const angle = Math.atan2(dy, dx);
        const newP2x = p1.x + Math.cos(angle) * FIXED_LENGTH;
        const newP2y = p1.y + Math.sin(angle) * FIXED_LENGTH;
        return { ...obj, points: [p1, { x: newP2x, y: newP2y }] };
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