import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor } from '../agentColors';

/**
 * Calcul distance point-segment
 */
const distToSegment = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
};

/**
 * 1. DESSIN : Ancre (P1) + Fil + Poignée (P2)
 */
export const drawCypherTrapwire = (ctx: CanvasRenderingContext2D, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const boxSize = ABILITY_SIZES['cypher_c_box_size'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('cypher');
    const techColor = agentHex;

    ctx.save();

    // --- A. Le Fil ---
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = techColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = techColor;

    ctx.stroke();

    ctx.shadowBlur = 0;

    // --- B. L'Ancre (Point 1) ---
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = techColor; // Plein
    ctx.fill();
    ctx.stroke();

    // --- C. La Poignée (Point 2) ---
    ctx.beginPath();
    ctx.rect(p2.x - boxSize / 2, p2.y - boxSize / 2, boxSize, boxSize);
    ctx.fillStyle = techColor; // Plein
    ctx.fill();
    ctx.strokeStyle = '#ffffff'; // Contour blanc pour le contraste
    ctx.lineWidth = 4;
    ctx.stroke();

    // Petit point central
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
};

// ... check et update inchangés
export const checkCypherTrapwireHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'handle' | 'body', offset?: { x: number, y: number } } | null => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const handleRadius = 15;
    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < handleRadius) {
        return { mode: 'handle' };
    }
    const dist = distToSegment(pos, p1, p2);
    if (dist < 10) {
        return { mode: 'body', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    }
    return null;
};

export const updateCypherTrapwirePosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'handle' | 'body',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
): DrawingObject => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const maxLength = ABILITY_SIZES['cypher_c_max_length'] * mapScale;

    if (mode === 'handle') {
        let dx = pos.x - p1.x;
        let dy = pos.y - p1.y;
        const currentLength = Math.hypot(dx, dy);
        if (currentLength > maxLength) {
            const ratio = maxLength / currentLength;
            dx *= ratio;
            dy *= ratio;
        }
        return { ...obj, points: [p1, { x: p1.x + dx, y: p1.y + dy }] };
    } else {
        const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return { ...obj, points: [newP1, { x: newP1.x + dx, y: newP1.y + dy }] };
    }
};