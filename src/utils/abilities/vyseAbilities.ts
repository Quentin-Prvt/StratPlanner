import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * DESSIN : Q - Mur Orientable (Style Métallique/Violet)
 */
export const drawVyseWall = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Centre
    const p2 = obj.points[1]; // Direction (Poignée)

    const width = ABILITY_SIZES['vyse_q_width'] || 20;
    const length = ABILITY_SIZES['vyse_q_length'] || 450;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    // Couleurs Thème Vyse (Métal sombre / Violet)
    const mainColor = '#a855f7'; // Gris métal (Slate-500)
    const accentColor = '#a855f7'; // Violet (Purple-500)

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);


    // Le Mur (Rectangle centré sur P1)
    ctx.beginPath();
    ctx.rect(-length / 2, -width / 2, length, width);
    ctx.fillStyle = 'rgb(168,85,247)'; // Gris métal semi-transparent
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();


    ctx.restore();

    // --- CONTRÔLES ---
    // P1 (Centre)
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = mainColor;
    ctx.fill();

    // P2 (Handle de rotation - Losange Violet)
    ctx.save();
    ctx.translate(p2.x, p2.y);
    ctx.rotate(angle + Math.PI / 4); // Rotation pour faire un losange
    ctx.beginPath();
    ctx.rect(-6, -6, 12, 12);
    ctx.fillStyle = accentColor;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

/**
 * DESSIN : X - Zone Ultime (Circulaire avec icône)
 */
export const drawVyseUltZone = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    const radius = ABILITY_SIZES['vyse_x_radius'] || 400;
    const iconSize = ABILITY_SIZES['vyse_x_icon_size'] || 60;

    const mainColor = 'rgba(168, 85, 247, 0.2)'; // Violet transparent
    const strokeColor = '#a855f7'; // Violet Purple-500

    ctx.save();

    // 1. Zone d'effet
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = mainColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
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
 * HIT TEST (Combiné Q et X)
 */
export const checkVyseHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const p1 = obj.points[0];

    // Cas Q (Mur) : Handle rotation ou Centre
    if (obj.tool === 'vyse_q_wall') {
        const p2 = obj.points[1];
        // Clic Rotation (P2 - Losange)
        if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'rotate' };
        // Clic Centre (P1)
        if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 20) {
            return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
        }
        return null;
    }

    // Cas X (Ult) : Hitbox Icône uniquement
    if (obj.tool === 'vyse_x_zone') {
        // On ne clique que sur l'icône centrale (hitbox de 30px)
        if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 30) {
            return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
        }
        return null;
    }

    return null;
};

/**
 * UPDATE POSITION (Combiné Q et X)
 */
export const updateVysePosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number }
) => {
    const p1 = obj.points[0];

    // Cas X (Ult) : Simple déplacement du centre
    if (obj.tool === 'vyse_x_zone') {
        return { ...obj, points: [{ x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }] };
    }

    // Cas Q (Mur) : Gestion rotation et déplacement central
    if (obj.tool === 'vyse_q_wall') {
        // Pour la rotation, on garde la distance P1-P2 constante
        // On utilise la moitié de la longueur comme distance de référence pour le handle
        const length = ABILITY_SIZES['vyse_q_length'] || 450;
        const handleDist = length / 2;

        if (mode === 'rotate') {
            const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
            const newP2 = {
                x: p1.x + Math.cos(angle) * handleDist,
                y: p1.y + Math.sin(angle) * handleDist
            };
            return { ...obj, points: [p1, newP2] };
        }

        if (mode === 'center') {
            const p2 = obj.points[1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
            // P2 suit P1
            return { ...obj, points: [newP1, { x: newP1.x + dx, y: newP1.y + dy }] };
        }
    }

    return obj;
};