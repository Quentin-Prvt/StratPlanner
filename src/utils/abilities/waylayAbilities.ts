import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * DESSIN : Waylay X (Rectangle Directionnel)
 */
export const drawWaylayUlt = (ctx: CanvasRenderingContext2D, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine
    const p2 = obj.points[1]; // Direction

    const width = ABILITY_SIZES['waylay_x_width'] * mapScale;
    const length = ABILITY_SIZES['waylay_x_length'] * mapScale;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    // --- STYLE WAYLAY (Ambre / Gris Tactique) ---
    const mainColor = 'rgba(58,246,30,0.4)'; // Amber-500 transparent
    const strokeColor = '#42d906'; // Amber-600

    ctx.shadowBlur = 10;
    ctx.shadowColor = strokeColor;

    // Fond
    ctx.fillStyle = mainColor;
    ctx.fillRect(0, -width / 2, length, width);

    // Bordure
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, -width / 2, length, width);


    ctx.restore();

    // --- CONTRÔLES ---
    // P1 (Centre)
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();

    // P2 (Handle Direction)
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
};

/**
 * HIT TEST
 */
export const checkWaylayHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    // Clic Rotation (P2)
    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'rotate' };

    // Clic Centre (P1)
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 20) {
        return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    }
    return null;
};

/**
 * UPDATE POSITION
 */
export const updateWaylayPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
) => {
    const p1 = obj.points[0];
    const length = ABILITY_SIZES['waylay_x_length'] * mapScale;

    if (mode === 'rotate') {
        const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        const newP2 = {
            x: p1.x + Math.cos(angle) * length,
            y: p1.y + Math.sin(angle) * length
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