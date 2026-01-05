import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors';

/**
 * DESSIN : E - Recon Bolt (Cercle avec Icône)
 */
export const drawSovaBolt = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    const radius = ABILITY_SIZES['sova_e_radius'] * mapScale;
    const iconSize = ABILITY_SIZES['sova_e_icon_size'] * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('sova'); // Bleu Chasseur (#3b82f6)
    const zoneColor = hexToRgba(agentHex, 0.2);
    const strokeColor = agentHex;

    ctx.save();

    // 1. Zone de détection
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = zoneColor;
        ctx.strokeStyle = strokeColor;
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

/**
 * DESSIN : X - Hunter's Fury (Rectangle Directionnel)
 */
export const drawSovaUlt = (ctx: CanvasRenderingContext2D, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine
    const p2 = obj.points[1]; // Direction

    const width = ABILITY_SIZES['sova_x_width'] * mapScale;
    const length = ABILITY_SIZES['sova_x_length'] * mapScale;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    // --- COULEURS ---
    const agentHex = getAgentColor('sova');
    const zoneColor = hexToRgba(agentHex, 0.5);
    const strokeColor = '#93c5fd'; // Bleu clair

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    ctx.shadowBlur = 10;
    ctx.shadowColor = agentHex;

    // Fond
    ctx.fillStyle = zoneColor;
    ctx.fillRect(0, -width / 2, length, width);

    // Bordures
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, -width / 2, length, width);

    ctx.restore();

    // --- CONTRÔLES ---
    // P1 (Centre)
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = agentHex;
    ctx.fill();

    // P2 (Handle)
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.strokeStyle = agentHex;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
};

// ... check et update inchangés
export const checkSovaHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    if (obj.tool === 'sova_e_bolt') {
        const center = obj.points[0];
        if (Math.hypot(pos.x - center.x, pos.y - center.y) < 30) {
            return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
        }
        return null;
    }
    if (obj.tool === 'sova_x_blast') {
        const p1 = obj.points[0];
        const p2 = obj.points[1];
        if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'rotate' };
        if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 20) {
            return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
        }
    }
    return null;
};

export const updateSovaPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
) => {
    const p1 = obj.points[0];
    if (obj.tool === 'sova_e_bolt') {
        return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
    }
    const length = ABILITY_SIZES['sova_x_length'] * mapScale;
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