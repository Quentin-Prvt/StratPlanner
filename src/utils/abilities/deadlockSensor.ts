import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors';

/**
 * 1. DESSIN : Capteur + Zone rectangulaire orientée
 */
export const drawDeadlockSensor = (ctx: CanvasRenderingContext2D, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.points.length < 2) return;
    const center = obj.points[0];
    const handle = obj.points[1];

    const length = ABILITY_SIZES['deadlock_q_length'] * mapScale;
    const width = ABILITY_SIZES['deadlock_q_width'] * mapScale;
    const iconSize = (ABILITY_SIZES['deadlock_q_icon_size'] * 0.5) * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor('deadlock'); // Bleu Tech (#38bdf8)
    const zoneColor = hexToRgba(agentHex, 0.15);
    const strokeColor = agentHex;

    // Calcul de l'angle de rotation
    const dx = handle.x - center.x;
    const dy = handle.y - center.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();

    // On se place au centre et on tourne
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);

    // A. Zone de détection
    ctx.beginPath();
    ctx.rect(0, -width / 2, length, width);

    // Style "Sound wave"
    ctx.fillStyle = zoneColor;
    ctx.strokeStyle = hexToRgba(agentHex, 0.5);
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]); // Pointillés
    ctx.fill();
    ctx.stroke();

    // Reset du style pour les éléments solides
    ctx.setLineDash([]);
    ctx.shadowColor = agentHex;
    ctx.shadowBlur = 5;

    // B. Le Capteur (Icone/Carré au centre)
    ctx.beginPath();
    ctx.rect(- iconSize / 2, -iconSize / 2, iconSize, iconSize);
    ctx.fillStyle = agentHex; // Bleu plein
    ctx.fill();
    ctx.strokeStyle = '#ffffff'; // Blanc
    ctx.lineWidth = 2;
    ctx.stroke();

    // C. La Poignée de rotation
    ctx.beginPath();
    ctx.arc(length, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.stroke();

    ctx.restore();
};

// ... check et update inchangés
export const checkDeadlockSensorHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center' | 'rotate', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const handle = obj.points[1];
    const hitRadius = 20;
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < hitRadius) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    if (Math.hypot(pos.x - handle.x, pos.y - handle.y) < hitRadius) {
        return { mode: 'rotate' };
    }
    return null;
};

export const updateDeadlockSensorPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
): DrawingObject => {
    const center = obj.points[0];
    const handle = obj.points[1];
    const length = ABILITY_SIZES['deadlock_q_length'] * mapScale;
    if (mode === 'center') {
        const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        const dx = handle.x - center.x;
        const dy = handle.y - center.y;
        return { ...obj, points: [newCenter, { x: newCenter.x + dx, y: newCenter.y + dy }] };
    } else {
        const dx = pos.x - center.x;
        const dy = pos.y - center.y;
        const angle = Math.atan2(dy, dx);
        const newHandle = {
            x: center.x + Math.cos(angle) * length,
            y: center.y + Math.sin(angle) * length
        };
        return { ...obj, points: [center, newHandle] };
    }
};