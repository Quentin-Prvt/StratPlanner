import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * 1. DESSIN : Capteur + Zone rectangulaire orientée
 */
export const drawDeadlockSensor = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 2) return;
    const center = obj.points[0];
    const handle = obj.points[1];

    // Récupération des config
    const length = ABILITY_SIZES['deadlock_q_length'] || 200;
    const width = ABILITY_SIZES['deadlock_q_width'] || 120;
    const iconSize = ABILITY_SIZES['deadlock_q_icon_size'] || 20;

    // Calcul de l'angle de rotation
    const dx = handle.x - center.x;
    const dy = handle.y - center.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();

    // On se place au centre et on tourne
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);

    // A. Zone de détection (Rectangle devant le capteur)
    ctx.beginPath();
    // On dessine un rectangle qui part de 0 (le capteur) vers la longueur
    ctx.rect(0, -width / 2, length, width);

    // Style "Sound wave" (Cyan/Gris transparent)
    ctx.fillStyle = 'rgba(200, 230, 255, 0.15)';
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)'; // Cyan
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]); // Pointillés pour effet "sonore"
    ctx.fill();
    ctx.stroke();

    // Reset du style pour les éléments solides
    ctx.setLineDash([]);
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;

    // B. Le Capteur (Icone/Carré au centre)
    // Note: on est toujours dans le repère rotaté
    ctx.beginPath();
    ctx.rect(-iconSize / 2, -iconSize / 2, iconSize, iconSize);
    ctx.fillStyle = '#0e7490'; // Cyan foncé
    ctx.fill();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.stroke();

    // C. La Poignée de rotation (au bout, pour visualiser la direction)
    // On la dessine à la distance "length" sur l'axe X (car on a rotaté)
    ctx.beginPath();
    ctx.arc(length, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#22d3ee';
    ctx.stroke();

    ctx.restore();
};

/**
 * 2. HIT TEST : Centre ou Poignée
 */
export const checkDeadlockSensorHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center' | 'rotate', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const handle = obj.points[1];
    const hitRadius = 20;

    // 1. Clic Centre
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < hitRadius) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }

    // 2. Clic Poignée (On recalcule sa position réelle si besoin, mais ici obj.points[1] est la position réelle)
    if (Math.hypot(pos.x - handle.x, pos.y - handle.y) < hitRadius) {
        return { mode: 'rotate' };
    }

    return null;
};

/**
 * 3. UPDATE : Mouvement et Rotation
 */
export const updateDeadlockSensorPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number }
): DrawingObject => {
    const center = obj.points[0];
    const handle = obj.points[1];
    const length = ABILITY_SIZES['deadlock_q_length'] || 200;

    if (mode === 'center') {
        // Déplacement global
        const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        const dx = handle.x - center.x;
        const dy = handle.y - center.y;

        return { ...obj, points: [newCenter, { x: newCenter.x + dx, y: newCenter.y + dy }] };
    } else {
        // Rotation (on met à jour la poignée)
        // Pour garder la taille fixe définie dans la config, on normalise le vecteur
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