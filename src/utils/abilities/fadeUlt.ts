import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * Dessine l'Ultime de Fade (Nightfall)
 */
export const drawFadeUlt = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine
    const p2 = obj.points[1]; // Direction (Handle)

    // Récupération des tailles depuis la config
    const width = ABILITY_SIZES['fade_x_width'] || 250;
    const fixedLength = ABILITY_SIZES['fade_x_length'] || 500;
    const gap = 0; // Espace constant avant le début de la zone

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const rectLength = Math.max(0, fixedLength - gap);

    ctx.save();

    // --- ZONE (Rectangle Fixe Indigo) ---
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    if (rectLength > 0) {
        // Fond indigo sombre
        ctx.fillStyle = 'rgba(49, 46, 129, 0.6)';
        ctx.fillRect(gap, -width / 2, rectLength, width);

        // Bordure Indigo brillante
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.strokeRect(gap, -width / 2, rectLength, width);
    }
    ctx.restore();

    // --- CONTROLES ---
    // A. Origine (Rond Blanc)
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.arc(p1.x, p1.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // B. Handle (Losange Indigo)
    ctx.save();
    ctx.translate(p2.x, p2.y);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = '#6366f1';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    const diamondSize = 14;
    ctx.beginPath();
    ctx.rect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

/**
 * Vérifie le clic
 */
export const checkFadeUltHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'handle' };
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 15) {
        return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    }
    return null;
};

/**
 * Mise à jour de la position (Distance fixe)
 */
export const updateFadeUltPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'handle',
    dragOffset: { x: number, y: number }
): DrawingObject => {
    const p1 = obj.points[0];
    const fixedLength = ABILITY_SIZES['fade_x_length'] || 500;

    if (mode === 'handle') {
        const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        const newP2 = {
            x: p1.x + Math.cos(angle) * fixedLength,
            y: p1.y + Math.sin(angle) * fixedLength
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