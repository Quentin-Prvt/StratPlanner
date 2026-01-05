import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors';

/**
 * DESSIN : C - Fast Lane (Double Mur)
 */
export const drawNeonWall = (ctx: CanvasRenderingContext2D, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    const width = ABILITY_SIZES['neon_c_width'] * mapScale;
    const length = ABILITY_SIZES['neon_c_length'] * mapScale;
    const wallThickness = 10;

    // --- COULEURS ---
    const agentHex = getAgentColor('neon'); // Jaune Électrique (#fde047)
    // Neon a des murs bleus ingame, mais si tu veux uniformiser par agent :
    const wallColor = agentHex;
    // Ou garder le bleu électrique Neon :
    //const wallColor = '#22d3ee';
    const wallFill = hexToRgba(wallColor, 0.6);

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    ctx.shadowBlur = 10;
    ctx.shadowColor = wallColor;
    ctx.fillStyle = wallFill;
    ctx.strokeStyle = wallColor;

    // 1. Mur Gauche
    ctx.fillRect(0, -width / 2 - wallThickness, length, wallThickness);

    // 2. Mur Droit
    ctx.fillRect(0, width / 2, length, wallThickness);

    // 3. Zone "Safe"
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, -width / 2, length, width);

    ctx.restore();

    // --- CONTRÔLES ---
    // P1
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = wallColor; // Utilise la couleur du mur pour les contrôles
    ctx.fill();

    // P2
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
};

/**
 * DESSIN : Q - Relay Bolt (Stun)
 */
export const drawNeonStun = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];
    const radius = ABILITY_SIZES['neon_q_radius'] * mapScale;
    const iconSize = ABILITY_SIZES['neon_q_icon_size'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('neon');
    const zoneColor = hexToRgba(agentHex, 0.2); // Jaune transparent
    const strokeColor = agentHex;

    ctx.save();

    // Zone
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = zoneColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Icône
    if (imageCache && obj.imageSrc) {
        let img = imageCache.get(obj.imageSrc);
        if (!img) {
            img = new Image();
            img.src = `/abilities/${obj.imageSrc}.png`;
            img.onload = triggerRedraw;
            imageCache.set(obj.imageSrc, img);
        }
        if (img.complete && img.naturalWidth > 0) {
            // Fond coloré
            ctx.beginPath();
            ctx.arc(center.x, center.y, iconSize/2, 0, Math.PI*2);
            ctx.fillStyle = agentHex;
            ctx.fill();

            ctx.drawImage(img, center.x - iconSize/2, center.y - iconSize/2, iconSize, iconSize);
        }
    }
    ctx.restore();
};

// ... check et update inchangés
export const checkNeonHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const p1 = obj.points[0];
    if (obj.tool === 'neon_q_zone') {
        if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 30) {
            return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
        }
        return null;
    }
    if (obj.tool === 'neon_c_wall') {
        const p2 = obj.points[1];
        if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'rotate' };
        if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 20) {
            return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
        }
    }
    return null;
};

export const updateNeonPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
) => {
    const p1 = obj.points[0];
    if (obj.tool === 'neon_q_zone') {
        return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
    }
    const length = ABILITY_SIZES['neon_c_length'] * mapScale;
    if (mode === 'rotate') {
        const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        const newP2 = {
            x: p1.x + Math.cos(angle) * length,
            y: p1.y + Math.sin(angle) * length
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