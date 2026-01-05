import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors'; // <-- Import

/**
 * 1. DESSIN : Trace les 4 bras indépendants
 */
export const drawDeadlockWall = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 5) return;

    const center = obj.points[0];
    const arms = [obj.points[1], obj.points[2], obj.points[3], obj.points[4]];

    const nodeSize = (ABILITY_SIZES['deadlock_c_node_size'] || 16) * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('deadlock'); // Bleu Tech (#38bdf8)
    const beamColor = hexToRgba(agentHex, 0.6); // Rayons semi-transparents
    const nodeColor = agentHex; // Noeuds pleins

    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = agentHex; // Glow

    // Dessiner chaque bras
    arms.forEach(arm => {
        // Le fil
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(arm.x, arm.y);
        ctx.strokeStyle = beamColor;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Le noeud bleu
        ctx.beginPath();
        ctx.arc(arm.x, arm.y, nodeSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
        ctx.strokeStyle = '#bae6fd'; // Bleu très clair pour le bord
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Le Centre (Blanc)
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(center.x, center.y, nodeSize / 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = nodeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
};

// ... check et update inchangés
export const checkDeadlockWallHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
): { mode: number, offset?: { x: number, y: number } } | null => {
    const hitRadius = 20;
    for (let i = 0; i < obj.points.length; i++) {
        const p = obj.points[i];
        if (Math.hypot(pos.x - p.x, pos.y - p.y) < hitRadius) {
            const offset = i === 0 ? { x: pos.x - p.x, y: pos.y - p.y } : undefined;
            return { mode: i, offset };
        }
    }
    return null;
};

export const updateDeadlockWallPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    pointIndex: number,
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
): DrawingObject => {
    const points = [...obj.points];
    const center = points[0];
    const MAX_LEN = (ABILITY_SIZES['deadlock_c_max_length'] || 300) * mapScale;

    if (pointIndex === 0) {
        const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        const dx = newCenter.x - center.x;
        const dy = newCenter.y - center.y;
        const newPoints = points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        return { ...obj, points: newPoints };
    }

    const draggedArmIndex = pointIndex;
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    const baseAngle = Math.atan2(dy, dx);
    const rawDist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(rawDist, MAX_LEN);

    points[draggedArmIndex] = {
        x: center.x + Math.cos(baseAngle) * clampedDist,
        y: center.y + Math.sin(baseAngle) * clampedDist
    };

    const logicIndex = draggedArmIndex - 1;

    for (let i = 1; i <= 4; i++) {
        if (i === draggedArmIndex) continue;
        const armDx = points[i].x - center.x;
        const armDy = points[i].y - center.y;
        let currentLen = Math.sqrt(armDx * armDx + armDy * armDy);
        currentLen = Math.min(currentLen, MAX_LEN);
        const angleDiff = (i - 1 - logicIndex) * (Math.PI / 2);
        const targetAngle = baseAngle + angleDiff;
        points[i] = {
            x: center.x + Math.cos(targetAngle) * currentLen,
            y: center.y + Math.sin(targetAngle) * currentLen
        };
    }
    return { ...obj, points };
};