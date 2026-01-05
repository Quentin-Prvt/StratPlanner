import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors';

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

    // --- COULEURS ---
    const agentHex = getAgentColor('cypher'); // Gris/Blanc/Cyan (selon ta config, ici peut-être un Cyan custom ?)
    // Pour Cypher, on veut souvent du Cyan "Tech" plutôt que juste Gris
    // Mais si tu as mis '#9ca3af' dans agentColors, ça fera gris.
    // Tu peux surcharger ici si tu veux garder le look "Cyan" spécifique à Cypher ingame.
    // const techColor = '#22d3ee'; // Cyan
    const techColor = agentHex; // Ou utiliser la couleur config

    ctx.save();

    // --- Cercle principal ---
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

    ctx.fillStyle = hexToRgba(techColor, 0.2);
    ctx.strokeStyle = techColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = techColor; // Glow

    ctx.fill();
    ctx.stroke();

    // --- Centre ---
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = techColor; // Centre plein
    ctx.fill();
    ctx.stroke();

    ctx.restore();
};

// ... check et update inchangés
export const checkCypherCageHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
    mapScale: number = 1.0
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const radius = ABILITY_SIZES['cypher_q_radius'] * mapScale;
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < radius) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

export const updateCypherCagePosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number },
): DrawingObject => {
    const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
    return { ...obj, points: [newCenter] };
};