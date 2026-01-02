import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * DESSIN : Q - Paranoïa
 */
export const drawOmenParanoia = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine
    const p2 = obj.points[1]; // Direction

    const width = ABILITY_SIZES['omen_q_width'] || 105;
    const length = ABILITY_SIZES['omen_q_length'] || 325;

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    // Style Omen : Violet sombre et mystérieux
    // Ombre portée pour l'effet "ombre"
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(76, 29, 149, 0.8)';

    // Fond
    ctx.fillStyle = 'rgba(46, 16, 101, 0.6)'; // Violet très foncé
    ctx.fillRect(0, -width / 2, length, width);

    // Bordure
    ctx.strokeStyle = '#8b5cf6'; // Violet plus clair
    ctx.lineWidth = 2;
    ctx.strokeRect(0, -width / 2, length, width);


    ctx.restore();

    // --- CONTRÔLES ---
    // P1 (Centre)
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#4c1d95';
    ctx.fill();

    // P2 (Handle Direction)
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
};

/**
 * HIT TEST
 */
export const checkOmenHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
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
export const updateOmenPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number }
) => {
    const p1 = obj.points[0];
    const length = ABILITY_SIZES['omen_q_length'] || 600;

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