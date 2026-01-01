import type { DrawingObject } from '../../types/canvas';

// Constantes de taille (Tes valeurs modifiées)
const GAP = 105;
const WIDTH = 90;
const MAX_LEN = 670;

/**
 * Dessine le Stun de Breach sur le canvas
 */
export const drawBreachStun = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine
    const p2 = obj.points[1]; // Direction

    // Calculs Vecteurs
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Clamping
    const renderDistance = Math.min(distance, MAX_LEN);
    const rectLength = Math.max(0, renderDistance - GAP);

    ctx.save();

    // --- ZONE (Rectangle) ---
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    if (rectLength > 0) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
        ctx.fillRect(GAP, -WIDTH / 2, rectLength, WIDTH);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.strokeRect(GAP, -WIDTH / 2, rectLength, WIDTH);
    }
    ctx.restore();

    // --- CONTROLES ---
    // A. Origine
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // B. Handle (Losange)
    const endX = p1.x + Math.cos(angle) * renderDistance;
    const endY = p1.y + Math.sin(angle) * renderDistance;

    ctx.save();
    ctx.translate(endX, endY);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1;
    const diamondSize = 10;
    ctx.beginPath();
    ctx.rect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

/**
 * Vérifie si on clique sur les contrôles du Stun
 */
export const checkBreachStunHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center' | 'handle', offset?: { x: number, y: number } } | null => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    // Calcul position visuelle du handle
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const renderDist = Math.min(dist, MAX_LEN);
    const visualHandleX = p1.x + Math.cos(angle) * renderDist;
    const visualHandleY = p1.y + Math.sin(angle) * renderDist;

    // 1. Clic Handle (Losange)
    if (Math.hypot(pos.x - visualHandleX, pos.y - visualHandleY) < 20) {
        return { mode: 'handle' };
    }

    // 2. Clic Origine (Rond)
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 15) {
        return {
            mode: 'center',
            offset: { x: pos.x - p1.x, y: pos.y - p1.y }
        };
    }

    return null;
};

/**
 * Calcule les nouveaux points lors du déplacement
 */
export const updateBreachStunPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'handle',
    dragOffset: { x: number, y: number }
): DrawingObject => {
    if (mode === 'handle') {
        // On déplace juste P2
        return { ...obj, points: [obj.points[0], { x: pos.x, y: pos.y }] };
    }
    if (mode === 'center') {
        // On déplace tout depuis P1
        const p1 = obj.points[0];
        const p2 = obj.points[1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        return { ...obj, points: [newP1, { x: newP1.x + dx, y: newP1.y + dy }] };
    }
    return obj;
};