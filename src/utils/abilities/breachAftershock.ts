import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

// Distance visuelle entre le joueur et le début de l'explosion
const WALL_GAP = 30;
const HANDLE_DISTANCE = 100;

/**
 * Dessine le C de Breach (Aftershock)
 */
export const drawBreachAftershock = (ctx: CanvasRenderingContext2D, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0]; // Origine
    const p2 = obj.points[1]; // Direction

    // 1. Calculs
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);

    // --- MODIFICATION ICI : Récupération des deux tailles ---
    const blastWidth = ABILITY_SIZES['breach_c'] * mapScale;
    // On utilise la longueur configurée, sinon on garde un ratio par défaut
    const blastLength = ABILITY_SIZES['breach_c_length'] * mapScale;

    ctx.save();

    // 2. Dessin de la zone d'explosion
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    // On dessine l'explosion après le "WALL_GAP"
    ctx.fillStyle = 'rgba(234, 179, 8, 0.6)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;

    ctx.beginPath();
    // Forme rectangulaire arrondie avec la nouvelle longueur
    ctx.roundRect(WALL_GAP, -blastWidth / 2, blastLength, blastWidth, 10);
    ctx.fill();
    ctx.stroke();

    // Petit effet de coeur central (ajusté à la nouvelle taille)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(WALL_GAP + blastLength/2, 0, blastLength/4, blastWidth/4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 3. Contrôles (Inchangés)

    // A. Origine
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // B. Handle
    const handleX = p1.x + Math.cos(angle) * HANDLE_DISTANCE;
    const handleY = p1.y + Math.sin(angle) * HANDLE_DISTANCE;

    ctx.save();
    ctx.translate(handleX, handleY);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    const diamondSize = 10;
    ctx.beginPath();
    ctx.rect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(handleX, handleY);
    ctx.stroke();
    ctx.restore();
};

// ... (Les fonctions checkBreachAftershockHit et updateBreachAftershockPosition restent identiques)
export const checkBreachAftershockHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center' | 'handle', offset?: { x: number, y: number } } | null => {
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const handleX = p1.x + Math.cos(angle) * HANDLE_DISTANCE;
    const handleY = p1.y + Math.sin(angle) * HANDLE_DISTANCE;

    if (Math.hypot(pos.x - handleX, pos.y - handleY) < 20) return { mode: 'handle' };
    if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < 15) return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
    return null;
};

export const updateBreachAftershockPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'handle',
    dragOffset: { x: number, y: number }
): DrawingObject => {
    const p1 = obj.points[0];
    if (mode === 'handle') return { ...obj, points: [p1, { x: pos.x, y: pos.y }] };
    if (mode === 'center') {
        const p2 = obj.points[1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        return { ...obj, points: [newP1, { x: newP1.x + dx, y: newP1.y + dy }] };
    }
    return obj;
};