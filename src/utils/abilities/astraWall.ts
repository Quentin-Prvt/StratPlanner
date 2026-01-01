import type { DrawingObject } from '../../types/canvas';

/**
 * Dessine le Mur d'Astra
 */
export const drawAstraWall = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    // Calcul ligne infinie
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / length;
    const uy = dy / length;
    const farDist = 3000;
    const startX = midX - ux * farDist;
    const startY = midY - uy * farDist;
    const endX = midX + ux * farDist;
    const endY = midY + uy * farDist;

    ctx.save();
    // Ligne
    ctx.strokeStyle = '#bd00ff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'butt';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Fissure
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Contrôles
    ctx.lineWidth = 2;
    // Rond Central
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.arc(midX, midY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(midX, midY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Carré Rotation
    const squareSize = 16;
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.rect(p2.x - squareSize / 2, p2.y - squareSize / 2, squareSize, squareSize);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

/**
 * Vérifie le clic sur le mur Astra
 */
export const checkAstraWallHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center' | 'handle', centerStart?: { x: number, y: number }, offset?: { x: number, y: number } } | null => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    // 1. Clic Carré (Handle)
    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 15) {
        return {
            mode: 'handle',
            centerStart: { x: midX, y: midY }
        };
    }

    // 2. Clic Rond (Centre)
    if (Math.hypot(pos.x - midX, pos.y - midY) < 15) {
        return {
            mode: 'center',
            offset: { x: pos.x - midX, y: pos.y - midY }
        };
    }

    return null;
};

/**
 * Déplacement du mur Astra
 */
export const updateAstraWallPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'handle',
    dragOffset: { x: number, y: number },
    wallCenterStart: { x: number, y: number }
): DrawingObject => {
    if (mode === 'handle') {
        // Rotation autour du centre initial
        const cx = wallCenterStart.x;
        const cy = wallCenterStart.y;
        const vectorX = pos.x - cx;
        const vectorY = pos.y - cy;
        // p1 est le miroir de p2(souris) par rapport au centre
        return { ...obj, points: [{ x: cx - vectorX, y: cy - vectorY }, { x: pos.x, y: pos.y }] };
    }

    if (mode === 'center') {
        // Translation pure
        const p1 = obj.points[0];
        const p2 = obj.points[1];
        const currentMidX = (p1.x + p2.x) / 2;
        const currentMidY = (p1.y + p2.y) / 2;
        const targetX = pos.x - dragOffset.x;
        const targetY = pos.y - dragOffset.y;
        const dx = targetX - currentMidX;
        const dy = targetY - currentMidY;
        return { ...obj, points: [{ x: p1.x + dx, y: p1.y + dy }, { x: p2.x + dx, y: p2.y + dy }] };
    }
    return obj;
};