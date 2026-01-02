import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * Récupère la config (taille/couleur) selon le sort
 */
const getIsoConfig = (tool: string) => {
    switch (tool) {
        case 'iso_c_wall':
            return {
                width: ABILITY_SIZES['iso_c_width'] || 120,
                length: ABILITY_SIZES['iso_c_length'] || 400,
                color: 'rgba(139, 92, 246, 0.4)',
                stroke: '#8b5cf6'
            };
        case 'iso_q_zone':
            return {
                width: ABILITY_SIZES['iso_q_width'] || 80,
                length: ABILITY_SIZES['iso_q_length'] || 500,
                color: 'rgba(139, 92, 246, 0.4)',
                stroke: '#8b5cf6'
            };
        case 'iso_x_zone':
            return {
                width: ABILITY_SIZES['iso_x_width'] || 300,
                length: ABILITY_SIZES['iso_x_length'] || 800,
                color: 'rgba(139, 92, 246, 0.4)',
                stroke: '#8b5cf6'
            };
        default:
            return { width: 100, length: 100, color: 'gray', stroke: 'white' };
    }
};

/**
 * DESSIN : Rectangle Rotatif
 */
export const drawIsoRect = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine
    const p2 = obj.points[1]; // Direction

    const conf = getIsoConfig(obj.tool);

    // Calcul Angle
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    // Dessin Zone
    ctx.fillStyle = conf.color;
    ctx.strokeStyle = conf.stroke;
    ctx.lineWidth = 2;

    // Le rectangle part de 0 (p1) et va jusqu'à length
    ctx.beginPath();
    ctx.rect(0, -conf.width / 2, conf.length, conf.width);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // --- CONTROLES ---
    // P1 (Centre)
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = conf.stroke;
    ctx.fill();

    // P2 (Handle de rotation) - On le dessine à la position réelle de P2
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = conf.stroke;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
};

/**
 * HIT TEST
 */
export const checkIsoHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    // Clic Handle (Rotation)
    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'rotate' };

    // Clic Origine (Déplacement)
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 20) {
        return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    }
    return null;
};

/**
 * UPDATE POSITION
 */
export const updateIsoPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number }
): DrawingObject => {
    const p1 = obj.points[0];
    const conf = getIsoConfig(obj.tool);

    if (mode === 'rotate') {
        // Rotation : On garde la longueur fixe pour que le handle reste au bout
        // OU on laisse le handle libre (comme tu préfères).
        // Ici je le mets à distance fixe (= length) pour que ce soit propre visuellement.
        const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        const newP2 = {
            x: p1.x + Math.cos(angle) * conf.length,
            y: p1.y + Math.sin(angle) * conf.length
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