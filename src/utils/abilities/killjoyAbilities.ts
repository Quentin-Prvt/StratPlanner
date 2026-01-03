import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * A. DESSIN DES ZONES CIRCULAIRES (Q et X)
 */
export const drawKilljoyZone = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];
    const isUlt = obj.tool === 'killjoy_x_zone';

    const radius = ABILITY_SIZES[isUlt ? 'killjoy_x_radius' : 'killjoy_q_radius'] * mapScale;
    const iconSize = ABILITY_SIZES[isUlt ? 'killjoy_x_icon_size' : 'killjoy_q_icon_size'] * mapScale;

    // Couleurs : Jaune pour le bot, Cyan Tech pour l'ult
    const color = isUlt ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.2)';
    const stroke = isUlt ? '#eab308' : '#eab308';

    ctx.save();

    // Zone
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
    }
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
 * B. DESSIN DE LA TOURELLE ORIENTABLE (E)
 */
export const drawKilljoyTurret = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const size = ABILITY_SIZES['killjoy_e_size'] * mapScale;

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();

    // 1. Image Rotatée
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle + Math.PI / 2); // Ajustement si l'image regarde vers le haut

    if (imageCache && obj.imageSrc) {
        let img = imageCache.get(obj.imageSrc);
        if (!img) {
            img = new Image();
            img.src = `/abilities/${obj.imageSrc}.png`; // Doit être killjoy_e_game.png
            img.onload = triggerRedraw;
            imageCache.set(obj.imageSrc, img);
        }
        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -size/2, -size/2, size, size);
        }
    }
    ctx.restore();

    // 2. Handle de rotation (Losange Jaune)
    ctx.save();
    ctx.translate(p2.x, p2.y);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = '#facc15'; // Yellow-400
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-6, -6, 12, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

/**
 * HIT TEST (Combiné)
 */
export const checkKilljoyHit = (pos: { x: number, y: number }, obj: DrawingObject, mapScale: number = 1.0) => {
    // Cas Tourelle (Orientable)
    if (obj.tool === 'killjoy_e_turret') {
        const p1 = obj.points[0];
        const p2 = obj.points[1];
        const size = ABILITY_SIZES['killjoy_e_size'] * mapScale;

        if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 15) return { mode: 'rotate' };
        if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < size/2) return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
        return null;
    }

    // Cas Q et X (Circulaire avec Hitbox réduite)
    const center = obj.points[0];
    const HITBOX = 30; // On clique uniquement sur l'icône
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < HITBOX) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

/**
 * UPDATE POSITION
 */
export const updateKilljoyPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number },
) => {
    // Tourelle Rotation
    if (obj.tool === 'killjoy_e_turret' && mode === 'rotate') {
        const p1 = obj.points[0];
        const dist = ABILITY_SIZES['killjoy_e_handle_dist'] || 60;
        const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        const newP2 = { x: p1.x + Math.cos(angle) * dist, y: p1.y + Math.sin(angle) * dist };
        return { ...obj, points: [p1, newP2] };
    }

    // Déplacement standard (Tourelle, Bot, Ult)
    const p1 = obj.points[0];
    const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };

    if (obj.points.length > 1) {
        // Si c'est la tourelle, P2 suit P1
        const p2 = obj.points[1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return { ...obj, points: [newP1, { x: newP1.x + dx, y: newP1.y + dy }] };
    }

    return { ...obj, points: [newP1] };
};