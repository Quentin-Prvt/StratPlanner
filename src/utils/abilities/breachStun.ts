import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors'; // <-- Import

export const drawBreachStun = (ctx: CanvasRenderingContext2D, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    const GAP = ABILITY_SIZES['breach_e_gap'] * mapScale;
    const WIDTH = ABILITY_SIZES['breach_e_width'] * mapScale;
    const MAX_LEN = ABILITY_SIZES['breach_e_max_length'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('breach'); // Orange
    const zoneColor = hexToRgba(agentHex, 0.4);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx*dx + dy*dy);

    const renderDist = Math.min(dist, MAX_LEN);
    const rectLength = Math.max(0, renderDist - GAP);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    if (rectLength > 0) {
        ctx.fillStyle = zoneColor;
        ctx.fillRect(GAP, -WIDTH / 2, rectLength, WIDTH);
        ctx.strokeStyle = agentHex; // Si tu veux tout orange
        ctx.lineWidth = 2;
        ctx.strokeRect(GAP, -WIDTH / 2, rectLength, WIDTH);
    }
    ctx.restore();

    // P1
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // P2 (Handle Visuel)
    const handleX = p1.x + Math.cos(angle) * renderDist;
    const handleY = p1.y + Math.sin(angle) * renderDist;

    ctx.save();
    ctx.translate(handleX, handleY);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = hexToRgba(agentHex, 0.6); // Handle coloré
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(-5, -5, 10, 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

// ... checkBreachStunHit et updateBreachStunPosition restent inchangés
export const checkBreachStunHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
    mapScale: number = 1.0
) => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const MAX_LEN = ABILITY_SIZES['breach_e_max_length'] * mapScale;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.sqrt(dx*dx + dy*dy);
    const renderDist = Math.min(dist, MAX_LEN);
    const handleX = p1.x + Math.cos(angle) * renderDist;
    const handleY = p1.y + Math.sin(angle) * renderDist;

    if (Math.hypot(pos.x - handleX, pos.y - handleY) < 20) return { mode: 'handle' };
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 20) return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    return null;
};

export const updateBreachStunPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'handle',
    dragOffset: { x: number, y: number },
) => {
    if (mode === 'handle') {
        return { ...obj, points: [obj.points[0], { x: pos.x, y: pos.y }] };
    }
    if (mode === 'center') {
        const p1 = obj.points[0];
        const p2 = obj.points[1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        return { ...obj, points: [newP1, { x: newP1.x + dx, y: newP1.y + dy }] };
    }
    return obj;
};