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
    // Ajout du gap (défaut à 0 si non défini dans abilitySizes)
    const gap = (ABILITY_SIZES['harbor_x_gap'] || 0) * mapScale;

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

    // Dessin du rectangle de la zone
    // On commence à x=gap et on dessine le reste
    ctx.fillStyle = zoneColor;
    ctx.beginPath();
    ctx.rect(gap, -width / 2, rectLength, width);
    ctx.fill();

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    // --- HANDLES (Points de contrôle) ---

    // A. Origine (p1)
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = agentHex;
    ctx.lineWidth = 2;
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // B. Handle de rotation (p2)
    const totalVisualLength = gap + rectLength;

    const handleX = p1.x + Math.cos(angle) * totalVisualLength;
    const handleY = p1.y + Math.sin(angle) * totalVisualLength;

    ctx.save();
    ctx.translate(handleX, handleY);
    ctx.rotate(angle + Math.PI / 4); // Rotation pour faire un losange

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

export const checkHarborUltHit = (pos: { x: number, y: number }, obj: DrawingObject, mapScale: number = 1.0) => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    // On recalcule la position réelle du handle p2 en fonction de la longueur fixe
    const fixedLength = (ABILITY_SIZES['harbor_x_length'] || 470) * mapScale;

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const realP2 = {
        x: p1.x + Math.cos(angle) * fixedLength,
        y: p1.y + Math.sin(angle) * fixedLength
    };

    // Hit sur le handle de rotation
    if (Math.hypot(pos.x - realP2.x, pos.y - realP2.y) < 20) return { mode: 'handle' };

    // Hit sur le centre (déplacement)
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
        // On déplace tout le rectangle en gardant l'angle
        const p2 = obj.points[1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        const newP2 = { x: newP1.x + dx, y: newP1.y + dy };

        return { ...obj, points: [newP1, newP2] };
    }

    return obj;
};