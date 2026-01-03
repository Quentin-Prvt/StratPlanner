import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * Dessine l'Ultime de Breach (Rolling Thunder)
 */
export const drawBreachUlt = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine (Breach)
    const p2 = obj.points[1]; // Direction (Handle)

    // Récupération des tailles depuis ABILITY_SIZES avec application du scale
    const GAP = ABILITY_SIZES['breach_x_gap'] * mapScale;
    const WIDTH = ABILITY_SIZES['breach_x_width'] * mapScale;
    const FIXED_LENGTH = ABILITY_SIZES['breach_x_fixed_length'] * mapScale;

    // Calculs Vecteurs
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);

    // Longueur du rectangle dessinable
    const rectLength = Math.max(0, FIXED_LENGTH - GAP);

    ctx.save();

    // --- ZONE (Rectangle Fixe) ---
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    if (rectLength > 0) {
        // Fond Orange/Rouge plus intense pour l'ultime
        ctx.fillStyle = 'rgba(249, 115, 22, 0.5)'; // Orange-500 plus opaque
        ctx.fillRect(GAP, -WIDTH / 2, rectLength, WIDTH);

        // Bordure Rouge vif
        ctx.strokeStyle = '#ef4444'; // Red-500
        ctx.lineWidth = 3;
        ctx.strokeRect(GAP, -WIDTH / 2, rectLength, WIDTH);
    }
    ctx.restore();

    // --- CONTROLES ---
    // A. Origine (Rond Central)
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.arc(p1.x, p1.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // B. Handle (Gros Losange de direction)
    // P2 est TOUJOURS à la distance FIXED_LENGTH
    ctx.save();
    ctx.translate(p2.x, p2.y);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = '#ef4444'; // Rouge plein
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    const diamondSize = 14; // Plus gros que le stun
    ctx.beginPath();
    ctx.rect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

/**
 * Vérifie le clic sur les contrôles de l'Ultime
 */
export const checkBreachUltHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center' | 'handle', offset?: { x: number, y: number } } | null => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    // 1. Clic Handle (P2 est la position exacte du handle)
    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) {
        return { mode: 'handle' };
    }

    // 2. Clic Origine (P1)
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 15) {
        return {
            mode: 'center',
            offset: { x: pos.x - p1.x, y: pos.y - p1.y }
        };
    }

    return null;
};

/**
 * Déplacement de l'Ultime (Rotation contrainte ou Translation)
 */
export const updateBreachUltPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'handle',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
): DrawingObject => {
    const p1 = obj.points[0];
    const FIXED_LENGTH = ABILITY_SIZES['breach_x_fixed_length'] * mapScale;

    if (mode === 'handle') {
        // --- ROTATION AVEC DISTANCE FIXE ---
        // On calcule l'angle entre P1 et la souris
        const dx = pos.x - p1.x;
        const dy = pos.y - p1.y;
        const angle = Math.atan2(dy, dx);

        // On recrée P2 exactement à la distance FIXED_LENGTH selon cet angle
        const newP2x = p1.x + Math.cos(angle) * FIXED_LENGTH;
        const newP2y = p1.y + Math.sin(angle) * FIXED_LENGTH;

        return { ...obj, points: [p1, { x: newP2x, y: newP2y }] };
    }

    if (mode === 'center') {
        // --- TRANSLATION STANDARD ---
        const p2 = obj.points[1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        return { ...obj, points: [newP1, { x: newP1.x + dx, y: newP1.y + dy }] };
    }
    return obj;
};
