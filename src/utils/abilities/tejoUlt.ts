import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * DESSIN : Tejo X (Rectangle Directionnel)
 */
export const drawTejoUlt = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine
    const p2 = obj.points[1]; // Direction

    const width = ABILITY_SIZES['tejo_x_width'] * mapScale;
    const length = ABILITY_SIZES['tejo_x_length'] * mapScale;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    const mainColor = '#ca9625';
    const accentColor = '#f6e4b9';

    ctx.shadowBlur = 10;
    ctx.shadowColor = mainColor;

    // Fond
    ctx.fillStyle = 'rgba(253,187,46,0.2)'; // Fond semi-transparent
    ctx.fillRect(0, -width / 2, length, width);

    // Bordure
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, -width / 2, length, width);

    ctx.restore();

    // --- CONTRÔLES ---
    // P1 (Centre)
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = mainColor;
    ctx.fill();

    // P2 (Handle Direction)
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
};

/**
 * HIT TEST
 */
export const checkTejoUltHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
) => {
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
export const updateTejoUltPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
) => {
    const p1 = obj.points[0];
    const length = ABILITY_SIZES['tejo_x_length'] * mapScale;

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
