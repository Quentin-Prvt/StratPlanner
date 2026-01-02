import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * DESSIN : C - Fast Lane (Double Mur)
 */
export const drawNeonWall = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine
    const p2 = obj.points[1]; // Direction

    const width = ABILITY_SIZES['neon_c_width'] || 40;   // Espace entre les murs
    const length = ABILITY_SIZES['neon_c_length'] || 290; // Longueur
    const wallThickness = 10; // Épaisseur visuelle des murs bleus

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    // Couleur : Bleu électrique Neon
    ctx.shadowBlur = 1
    ctx.shadowColor = '#22d3ee'; // Cyan glow
    ctx.fillStyle = 'rgba(34, 211, 238, 0.6)'; // Cyan remplissage
    ctx.strokeStyle = '#22d3ee'; // Cyan bordure

    // 1. Mur Gauche
    ctx.fillRect(0, -width / 2 - wallThickness, length, wallThickness);

    // 2. Mur Droit
    ctx.fillRect(0, width / 2, length, wallThickness);

    // 3. Zone "Safe" au milieu (très transparente)
    ctx.fillStyle = 'rgba(34, 211, 238, 0)';
    ctx.fillRect(0, -width / 2, length, width);

    ctx.restore();

    // --- CONTRÔLES ---
    // P1 (Centre)
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#22d3ee';
    ctx.fill();

    // P2 (Handle Direction)
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#22d3ee';
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
    triggerRedraw: () => void
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];
    const radius = ABILITY_SIZES['neon_q_radius'] || 140;
    const iconSize = ABILITY_SIZES['neon_q_icon_size'] || 45;

    ctx.save();

    // Zone
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)'; // Cyan transparent
    ctx.strokeStyle = '#22d3ee';
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
            ctx.drawImage(img, center.x - iconSize/2, center.y - iconSize/2, iconSize, iconSize);
        }
    }
    ctx.restore();
};

/**
 * HIT TEST (Mur & Stun)
 */
export const checkNeonHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const p1 = obj.points[0];

    // Q (Stun) : Hitbox Icône uniquement
    if (obj.tool === 'neon_q_zone') {
        if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 30) {
            return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
        }
        return null;
    }

    // C (Wall) : Handle ou Centre
    if (obj.tool === 'neon_c_wall') {
        const p2 = obj.points[1];
        // Clic Rotation (P2)
        if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'rotate' };
        // Clic Centre (P1)
        if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 20) {
            return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
        }
    }
    return null;
};

/**
 * UPDATE POSITION
 */
export const updateNeonPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number }
) => {
    const p1 = obj.points[0];

    // Q (Stun) : Simple déplacement
    if (obj.tool === 'neon_q_zone') {
        return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
    }

    // C (Wall)
    const length = ABILITY_SIZES['neon_c_length'] || 600;

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