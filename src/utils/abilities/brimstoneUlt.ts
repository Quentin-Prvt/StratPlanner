import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors';

/**
 * Dessine l'Ultime de Brimstone (Orbital Strike - X)
 */
export const drawBrimstoneUlt = (ctx: CanvasRenderingContext2D, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    // Récupération du rayon configuré
    const radius = ABILITY_SIZES['brimstone_x_radius'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('brimstone'); // Orange
    // Pour l'ultime, on veut un effet "laser" intense
    // On garde le dégradé mais en utilisant la couleur dynamique

    ctx.save();

    // 1. Zone d'effet principale
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

    // Remplissage dégradé radial
    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
    gradient.addColorStop(0, hexToRgba(agentHex, 0.6)); // Centre vif
    gradient.addColorStop(1, hexToRgba(agentHex, 0.3));  // Bords plus transparents

    ctx.fillStyle = gradient;
    ctx.fill();

    // Bordure marquée
    ctx.strokeStyle = agentHex;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Effet d'anneaux intérieurs pour simuler le laser
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
};

// ... check et update inchangés
export const checkBrimstoneUltHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
    mapScale: number = 1.0
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const radius = ABILITY_SIZES['brimstone_x_radius'] * mapScale;
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < radius) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

export const updateBrimstoneUltPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number },
): DrawingObject => {
    const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
    return { ...obj, points: [newCenter] };
};