import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * Dessine l'Ultime de Brimstone (Orbital Strike - X)
 */
export const drawBrimstoneUlt = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    // Récupération du rayon configuré
    const radius = ABILITY_SIZES['brimstone_x_radius'] || 320;

    ctx.save();

    // 1. Zone d'effet principale
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

    // Style : Orange/Rouge intense, type "laser orbital"
    // Remplissage dégradé radial pour un effet plus "chaud" au centre
    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
    gradient.addColorStop(0, 'rgba(255, 100, 0, 0.6)'); // Centre orange vif
    gradient.addColorStop(1, 'rgba(255, 69, 0, 0.3)');  // Bords rouge-orange plus transparent

    ctx.fillStyle = gradient;
    ctx.fill();

    // Bordure marquée
    ctx.strokeStyle = '#ff4500'; // OrangeRed
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

/**
 * Vérifie le clic : on peut cliquer n'importe où dans le cercle
 */
export const checkBrimstoneUltHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const radius = ABILITY_SIZES['brimstone_x_radius'] || 320;

    if (Math.hypot(pos.x - center.x, pos.y - center.y) < radius) {
        return {
            mode: 'center',
            offset: { x: pos.x - center.x, y: pos.y - center.y }
        };
    }

    return null;
};

/**
 * Mise à jour position : translation simple
 */
export const updateBrimstoneUltPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number }
): DrawingObject => {
    const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
    return { ...obj, points: [newCenter] };
};