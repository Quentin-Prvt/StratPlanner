import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * 1. DESSIN : Trace les 4 bras indépendants
 */
export const drawDeadlockWall = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    mapScale: number = 1.0
) => {
    // On a besoin de 5 points : Centre + 4 bras
    if (obj.points.length < 5) return;

    const center = obj.points[0];
    const arms = [obj.points[1], obj.points[2], obj.points[3], obj.points[4]];

    const nodeSize = (ABILITY_SIZES['deadlock_c_node_size'] || 16) * mapScale;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = '#22d3ee';

    // Dessiner chaque bras
    arms.forEach(arm => {
        // Le fil
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(arm.x, arm.y);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Le noeud bleu
        ctx.beginPath();
        ctx.arc(arm.x, arm.y, nodeSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Le Centre (Blanc)
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(center.x, center.y, nodeSize / 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
};

/**
 * 2. HIT TEST : Quel point attrape-t-on ? (0 = Centre, 1-4 = Bras)
 */
export const checkDeadlockWallHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
): { mode: number, offset?: { x: number, y: number } } | null => {

    const hitRadius = 20;

    // On vérifie tous les points (Centre [0] + Bras [1..4])
    for (let i = 0; i < obj.points.length; i++) {
        const p = obj.points[i];
        if (Math.hypot(pos.x - p.x, pos.y - p.y) < hitRadius) {
            // Si c'est le centre (0), on a besoin d'un offset pour le drag fluide
            const offset = i === 0 ? { x: pos.x - p.x, y: pos.y - p.y } : undefined;
            return { mode: i, offset };
        }
    }

    return null;
};

/**
 * 3. UPDATE : Rotation liée, Longueur indépendante MAIS Clampée
 */
export const updateDeadlockWallPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    pointIndex: number, // 0 = centre, 1,2,3,4 = bras
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0 // Ajout du mapScale pour calculer la taille max
): DrawingObject => {
    const points = [...obj.points];
    const center = points[0];

    // Définition de la taille max (tu peux ajuster 280 ou le mettre dans abilitySizes)
    const MAX_LEN = (ABILITY_SIZES['deadlock_c_max_length'] || 300) * mapScale;

    // CAS 1 : Déplacement du centre (tout bouge ensemble)
    if (pointIndex === 0) {
        const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        const dx = newCenter.x - center.x;
        const dy = newCenter.y - center.y;

        // On applique le delta à tous les points
        const newPoints = points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        return { ...obj, points: newPoints };
    }

    // CAS 2 : Déplacement d'un bras
    const draggedArmIndex = pointIndex;

    // 1. Calculs vectoriels souris <-> centre
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    const baseAngle = Math.atan2(dy, dx);
    const rawDist = Math.sqrt(dx * dx + dy * dy);

    // 2. Clamping de la distance (taille max)
    const clampedDist = Math.min(rawDist, MAX_LEN);

    // 3. Mise à jour du bras tiré (Angle souris + Distance clampée)
    points[draggedArmIndex] = {
        x: center.x + Math.cos(baseAngle) * clampedDist,
        y: center.y + Math.sin(baseAngle) * clampedDist
    };

    // 4. Mise à jour des autres bras (Rotation solidaire)
    const logicIndex = draggedArmIndex - 1; // 0..3

    for (let i = 1; i <= 4; i++) {
        if (i === draggedArmIndex) continue; // Celui qu'on tire est déjà fait

        // On récupère la longueur actuelle de ce bras
        const armDx = points[i].x - center.x;
        const armDy = points[i].y - center.y;
        let currentLen = Math.sqrt(armDx * armDx + armDy * armDy);

        // Sécurité : Si l'autre bras dépassait déjà la taille max (ex: changement de zoom), on le réduit aussi
        currentLen = Math.min(currentLen, MAX_LEN);

        // Calcul de l'angle relatif (croix parfaite à 90 degrés)
        const angleDiff = (i - 1 - logicIndex) * (Math.PI / 2);
        const targetAngle = baseAngle + angleDiff;

        // Nouvelle position
        points[i] = {
            x: center.x + Math.cos(targetAngle) * currentLen,
            y: center.y + Math.sin(targetAngle) * currentLen
        };
    }

    return { ...obj, points };
};