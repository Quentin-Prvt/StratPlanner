import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * Dessine l'Ultime de Harbor (Reckoning)
 * Logique identique à Fade (Rectangle directionnel) mais style "Eau"
 */
export const drawHarborUlt = (ctx: CanvasRenderingContext2D, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine
    const p2 = obj.points[1]; // Direction (Handle)

    // Récupération des tailles (Assure-toi d'avoir ajouté ces clés dans abilitySizes)
    // Fallback sur des valeurs par défaut si les clés n'existent pas encore
    const width = (ABILITY_SIZES['harbor_x_width'] || 250) * mapScale;
    const fixedLength = (ABILITY_SIZES['harbor_x_length'] || 470) * mapScale;
    const gap = 0;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const rectLength = Math.max(0, fixedLength - gap);

    ctx.save();

    // --- ZONE (Rectangle Fixe Cyan/Eau) ---
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    if (rectLength > 0) {
        // Fond Cyan "Océan" avec transparence
        ctx.fillStyle = 'rgba(69,217,246,0.5)'; // Cyan-500
        ctx.beginPath();
        // @ts-ignore
        ctx.rect(gap, -width / 2, rectLength, width);
        ctx.fill();

        // Bordure Cyan brillante
        ctx.strokeStyle = '#22d3ee'; // Cyan-400
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(34, 211, 238, 0.8)'; // Glow
        ctx.shadowBlur = 10;
        ctx.stroke();
    }
    ctx.restore();

    // --- CONTROLES ---
    // A. Origine (Rond Blanc/Cyan)
    ctx.save();
    ctx.shadowBlur = 0; // Pas de glow sur les contrôles
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#0891b2'; // Cyan foncé
    ctx.lineWidth = 2;
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // B. Handle (Losange Cyan)
    ctx.save();
    ctx.translate(p2.x, p2.y);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = '#0891b2'; // Cyan foncé
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    const diamondSize = 10;
    ctx.beginPath();
    ctx.rect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

/**
 * Vérifie le clic (Identique Fade)
 */
export const checkHarborUltHit = (pos: { x: number, y: number }, obj: DrawingObject) => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];

    if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 20) return { mode: 'handle' };
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 20) {
        return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    }
    return null;
};

/**
 * Mise à jour de la position (Distance fixe, Identique Fade)
 */
export const updateHarborUltPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'handle',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
): DrawingObject => {
    const p1 = obj.points[0];
    // Utilisation de la config Harbor
    const fixedLength = (ABILITY_SIZES['harbor_x_length'] || 470) * mapScale;

    if (mode === 'handle') {
        const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        // On force P2 à rester à la distance fixe
        const newP2 = {
            x: p1.x + Math.cos(angle) * fixedLength,
            y: p1.y + Math.sin(angle) * fixedLength
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