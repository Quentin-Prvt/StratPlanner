import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * DESSIN : E - Recon Bolt (Cercle avec Icône)
 */
export const drawSovaBolt = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    const radius = ABILITY_SIZES['sova_e_radius'] || 250;
    const iconSize = ABILITY_SIZES['sova_e_icon_size'] || 50;

    ctx.save();

    // 1. Zone de détection (Bleu électrique transparent)
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // Blue-500 transparent
        ctx.strokeStyle = '#3b82f6'; // Blue-500
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
    }
    // 2. Icône Centrale
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
 * DESSIN : X - Hunter's Fury (Rectangle Directionnel)
 */
export const drawSovaUlt = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine
    const p2 = obj.points[1]; // Direction

    const width = ABILITY_SIZES['sova_x_width'] || 80;
    const length = ABILITY_SIZES['sova_x_length'] || 900;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    // Style Sova : Bleu intense et Tech
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#60a5fa'; // Blue glow

    // Fond
    ctx.fillStyle = 'rgba(37, 99, 235, 0.5)'; // Blue-600
    ctx.fillRect(0, -width / 2, length, width);

    // Bordures
    ctx.strokeStyle = '#93c5fd'; // Blue-300
    ctx.lineWidth = 2;
    ctx.strokeRect(0, -width / 2, length, width);


    ctx.restore();

    // --- CONTRÔLES ---
    // P1 (Centre)
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb';
    ctx.fill();

    // P2 (Handle Direction)
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
};

/**
 * HIT TEST
 */
export const checkSovaHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    // E (Recon) : Hitbox Icône uniquement (click through)
    if (obj.tool === 'sova_e_bolt') {
        const center = obj.points[0];
        if (Math.hypot(pos.x - center.x, pos.y - center.y) < 30) {
            return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
        }
        return null;
    }

    // X (Ult) : Handle ou Centre
    if (obj.tool === 'sova_x_blast') {
        const p1 = obj.points[0];
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
export const updateSovaPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number }
) => {
    const p1 = obj.points[0];

    // E (Recon)
    if (obj.tool === 'sova_e_bolt') {
        return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
    }

    // X (Ult)
    const length = ABILITY_SIZES['sova_x_length'] || 900;

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