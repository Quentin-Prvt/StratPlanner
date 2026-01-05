import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor } from '../agentColors';

/**
 * DESSIN : Mur de Sage
 */
export const drawSageWall = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Centre (Pivot)
    const p2 = obj.points[1]; // Handle (Direction)

    const size = ABILITY_SIZES['sage_c_size'] * mapScale;

    // Calcul de l'angle entre le centre et le handle
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    // --- COULEURS ---
    const agentHex = getAgentColor('sage');
    const handleColor = agentHex;

    ctx.save();

    // 1. DESSIN DE L'IMAGE (Rotatée autour de P1)
    ctx.translate(p1.x, p1.y);

    ctx.rotate(angle + Math.PI / 2);

    if (imageCache && obj.imageSrc) {
        let img = imageCache.get(obj.imageSrc);
        if (!img) {
            img = new Image();
            img.src = `/abilities/${obj.imageSrc}.png`;
            img.onload = triggerRedraw;
            imageCache.set(obj.imageSrc, img);
        }

        if (img.complete && img.naturalWidth > 0) {

            ctx.drawImage(img, -size/2, -size/12, size, size/6);
        }
    }
    ctx.restore();



    // 3. Handle de rotation (Losange)
    ctx.save();
    ctx.translate(p2.x, p2.y);
    ctx.rotate(angle + Math.PI / 4); // Rotation du losange pour le style

    ctx.fillStyle = handleColor;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    const diamondSize = 10;
    ctx.beginPath();
    ctx.rect(-diamondSize/2, -diamondSize/2, diamondSize, diamondSize);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // 4. Point central (Pivot)
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 4, 0, Math.PI*2);
    ctx.fillStyle = handleColor;
    ctx.fill();
};

// ... Le reste (checkSageHit et updateSagePosition) est correct et ne change pas.
// Il garantit déjà que P1 reste fixe quand on bouge P2.
export const checkSageHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];


    // Priorité au Handle
    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'rotate' };

    // Ensuite le centre
    // On peut augmenter un peu la zone de grab centrale
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 40) {
        return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    }
    return null;
};

export const updateSagePosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
) => {
    const p1 = obj.points[0];
    const dist = ABILITY_SIZES['sage_c_handle_dist'] * mapScale;

    if (mode === 'rotate') {
        const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        const newP2 = {
            x: p1.x + Math.cos(angle) * dist,
            y: p1.y + Math.sin(angle) * dist
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