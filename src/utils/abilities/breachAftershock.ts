import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors'; // <-- Import

/**
 * Dessine le C de Breach (Aftershock)
 */
export const drawBreachAftershock = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    // --- 1. TAILLES SCALÉES ---
    const width = (ABILITY_SIZES['breach_c_width'] || 60) * mapScale;
    const length = (ABILITY_SIZES['breach_c_length'] || 180) * mapScale;
    const wallGap = (ABILITY_SIZES['breach_c_wall_gap'] || 30) * mapScale;
    const HANDLE_DISTANCE = (ABILITY_SIZES['breach_c_handle_dist'] || 100) * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('breach'); // Orange (#d97706)
    const zoneColor = hexToRgba(agentHex, 0.6);

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    // --- 2. DESSIN ZONE ---
    ctx.fillStyle = zoneColor;
    ctx.shadowColor = agentHex;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    // @ts-ignore
    if (ctx.roundRect) ctx.roundRect(wallGap, -width / 2, length, width, 8);
    else ctx.rect(wallGap, -width / 2, length, width);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // --- 3. CONTRÔLES ---

    const handleX = p1.x + Math.cos(angle) * HANDLE_DISTANCE;
    const handleY = p1.y + Math.sin(angle) * HANDLE_DISTANCE;

    // P1 (Origine)
    ctx.beginPath();
    ctx.fillStyle = agentHex;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.arc(p1.x, p1.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // P2 (Handle)
    ctx.save();
    ctx.translate(handleX, handleY);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = agentHex;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-6, -6, 12, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

export const checkBreachAftershockHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
    mapScale: number = 1.0
) => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);

    const HANDLE_DISTANCE = (ABILITY_SIZES['breach_c_handle_dist'] || 100) * mapScale;

    const handleX = p1.x + Math.cos(angle) * HANDLE_DISTANCE;
    const handleY = p1.y + Math.sin(angle) * HANDLE_DISTANCE;

    if (Math.hypot(pos.x - handleX, pos.y - handleY) < 20) {
        return { mode: 'handle' };
    }

    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 20) {
        return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    }

    return null;
};

export const updateBreachAftershockPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'handle',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
): DrawingObject => {
    const p1 = obj.points[0];
    const HANDLE_DISTANCE = (ABILITY_SIZES['breach_c_handle_dist'] || 100) * mapScale;

    if (mode === 'handle') {
        const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        const newP2 = {
            x: p1.x + Math.cos(angle) * HANDLE_DISTANCE,
            y: p1.y + Math.sin(angle) * HANDLE_DISTANCE
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