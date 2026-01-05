import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors';

/**
 * Dessine l'Ultime de Harbor (Reckoning)
 */
export const drawHarborUlt = (ctx: CanvasRenderingContext2D, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    const width = (ABILITY_SIZES['harbor_x_width'] || 250) * mapScale;
    const fixedLength = (ABILITY_SIZES['harbor_x_length'] || 470) * mapScale;
    const gap = 0;

    // --- COULEURS ---
    const agentHex = getAgentColor('harbor'); // Cyan Eau (#06b6d4)
    const zoneColor = hexToRgba(agentHex, 0.5);
    const strokeColor = '#22d3ee'; // Un peu plus clair pour le bord

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const rectLength = Math.max(0, fixedLength - gap);

    ctx.save();

    // --- ZONE ---
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    if (rectLength > 0) {
        ctx.fillStyle = zoneColor;
        ctx.beginPath();
        // @ts-ignore
        ctx.rect(gap, -width / 2, rectLength, width);
        ctx.fill();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;

        ctx.stroke();
    }
    ctx.restore();


    // A. Origine
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = agentHex;
    ctx.lineWidth = 2;
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // B. Handle
    ctx.translate(p2.x, p2.y);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = agentHex;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    const diamondSize = 10;
    ctx.beginPath();
    ctx.rect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
};

// ... check et update inchangés
export const checkHarborUltHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'handle' };
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 20) {
        return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    }
    return null;
};

export const updateHarborUltPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'handle',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
): DrawingObject => {
    const p1 = obj.points[0];
    const fixedLength = (ABILITY_SIZES['harbor_x_length'] || 470) * mapScale;
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