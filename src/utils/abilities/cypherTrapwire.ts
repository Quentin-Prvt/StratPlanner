import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * Calcul distance point-segment (inchangé)
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
export const drawCypherTrapwire = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // L'Ancre (Fixe relative)
    const p2 = obj.points[1]; // La Poignée (Mobile)
    const boxSize = ABILITY_SIZES['cypher_c_box_size'] || 14;

    ctx.save();

    // --- A. Le Fil ---
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = '#22d3ee'; // Cyan
    ctx.lineWidth = 2;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 8;
    ctx.stroke();

    ctx.shadowBlur = 0; // Reset glow

    // --- B. L'Ancre (Point 1 - Petit disque) ---
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#0e7490';
    ctx.fill();
    ctx.strokeStyle = '#22d3ee';
    ctx.stroke();

    // --- C. La Poignée (Point 2 - Carré) ---
    // C'est le seul coté qu'on dessine en "carré interactif"
    ctx.beginPath();
    ctx.rect(p2.x - boxSize / 2, p2.y - boxSize / 2, boxSize, boxSize);
    ctx.fillStyle = '#0e7490';
    ctx.fill();
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Petit point central dans le carré
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
};

/**
 * 2. HIT TEST : On ne peut attraper que P2 (Handle) ou le Corps
 */
export const checkCypherTrapwireHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'handle' | 'body', offset?: { x: number, y: number } } | null => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const handleRadius = 15;

    // On vérifie SEULEMENT le point 2 (la poignée)
    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < handleRadius) {
        return { mode: 'handle' };
    }

    // Clic sur le corps ?
    const dist = distToSegment(pos, p1, p2);
    if (dist < 10) {
        // Offset par rapport à P1 pour le déplacement global
        return { mode: 'body', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    }

    return null;
};

/**
 * 3. UPDATE : Gestion de la contrainte de longueur max
 */
export const updateCypherTrapwirePosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'handle' | 'body', // On a simplifié les modes
    dragOffset: { x: number, y: number }
): DrawingObject => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const maxLength = ABILITY_SIZES['cypher_c_max_length'] || 100;

    if (mode === 'handle') {
        // On déplace P2, mais on le contraint à la longueur max par rapport à P1
        let dx = pos.x - p1.x;
        let dy = pos.y - p1.y;

        // Calcul de la distance actuelle
        const currentLength = Math.hypot(dx, dy);

        // Si on dépasse la longueur max, on bloque
        if (currentLength > maxLength) {
            const ratio = maxLength / currentLength;
            dx *= ratio;
            dy *= ratio;
        }

        return {
            ...obj,
            points: [p1, { x: p1.x + dx, y: p1.y + dy }]
        };
    } else {
        // 'body' : On déplace tout l'objet via P1 (l'ancre)
        const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };

        // On recalcule P2 pour qu'il suive P1 en gardant le même vecteur relatif
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        return {
            ...obj,
            points: [
                newP1,
                { x: newP1.x + dx, y: newP1.y + dy }
            ]
        };
    }
};