import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * 1. DESSIN : La Cyber Cage
 */
export const drawCypherCage = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];
    const radius = ABILITY_SIZES['cypher_q_radius'] * mapScale;

    ctx.save();

    // --- Cercle principal ---
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

    // Style : Cyan transparent avec une bordure brillante
    ctx.fillStyle = 'rgba(34, 211, 238, 0.2)'; // Cyan-400 très transparent
    ctx.strokeStyle = '#22d3ee'; // Cyan-400
    ctx.lineWidth = 2;

    // Effet de "glow" technologique
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;

    ctx.fill();
    ctx.stroke();

    // --- Anneau intérieur (style "tech") ---
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Pointillés
    ctx.stroke();

    // --- Centre (le dispositif au sol) ---
    ctx.shadowBlur = 0; // Reset du glow pour le centre
    ctx.setLineDash([]); // Reset des pointillés

    ctx.beginPath();
    ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0e7490'; // Cyan foncé
    ctx.fill();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
};

/**
 * 2. HIT TEST : Clic dans le cercle
 */
export const checkCypherCageHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
    mapScale: number = 1.0
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const radius = ABILITY_SIZES['cypher_q_radius'] * mapScale;

    if (Math.hypot(pos.x - center.x, pos.y - center.y) < radius) {
        return {
            mode: 'center',
            offset: { x: pos.x - center.x, y: pos.y - center.y }
        };
    }
    return null;
};

/**
 * 3. UPDATE : Déplacement simple
 */
export const updateCypherCagePosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number },
): DrawingObject => {
    const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
    return { ...obj, points: [newCenter] };
};
