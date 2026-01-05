import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors';

/**
 * Helper: Ray-casting pour savoir si un point est dans le polygone
 */
const isPointInPolygon = (p: {x: number, y: number}, points: {x: number, y: number}[]) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;
        const intersect = ((yi > p.y) !== (yj > p.y)) &&
            (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

/**
 * DESSIN : Viper's Pit
 */
export const drawViperUlt = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 4) return;

    const polyPoints = obj.points.slice(0, -1);
    const iconPos = obj.points[obj.points.length - 1];

    const agentHex = getAgentColor('viper');
    const fillColor = hexToRgba(agentHex, 0.4);
    const strokeColor = agentHex;

    const vertexRadius = (ABILITY_SIZES['viper_x_vertex_radius'] || 5) * mapScale;
    const iconSize = (ABILITY_SIZES['viper_x_icon_size'] || 40) * mapScale;

    ctx.save();

    // 1. Tracer le Polygone
    ctx.beginPath();
    ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
    for (let i = 1; i < polyPoints.length; i++) {
        ctx.lineTo(polyPoints[i].x, polyPoints[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.shadowBlur = 15;
    ctx.shadowColor = agentHex;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // 2. Tracer les Sommets
    polyPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, vertexRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = agentHex;
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    // 3. Tracer l'Icône
    if (imageCache && obj.imageSrc) {
        let img = imageCache.get(obj.imageSrc);
        if (!img) {
            img = new Image();
            img.src = `/abilities/${obj.imageSrc}.png`;
            img.onload = triggerRedraw;
            imageCache.set(obj.imageSrc, img);
        }

        if (img.complete && img.naturalWidth > 0) {
            ctx.beginPath();
            ctx.arc(iconPos.x, iconPos.y, iconSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(agentHex, 0.8);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.drawImage(
                img,
                iconPos.x - iconSize / 2,
                iconPos.y - iconSize / 2,
                iconSize,
                iconSize
            );
        }
    }

    ctx.restore();
};

/**
 * HIT TEST
 */
export const checkViperUltHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
    mapScale: number = 1.0
): { mode: string, offset?: { x: number, y: number }, vertexIndex?: number } | null => {

    if (obj.points.length < 4) return null;

    const polyPoints = obj.points.slice(0, -1);
    const iconPos = obj.points[obj.points.length - 1];

    const vertexHitRadius = (ABILITY_SIZES['viper_x_vertex_hit_radius'] || 15) * mapScale;
    const iconHitRadius = (ABILITY_SIZES['viper_x_icon_size'] || 40) / 2 * mapScale;

    // 1. Icône
    if (Math.hypot(pos.x - iconPos.x, pos.y - iconPos.y) < iconHitRadius) {
        return { mode: 'icon', offset: { x: pos.x - iconPos.x, y: pos.y - iconPos.y } };
    }

    // 2. Sommets
    for (let i = 0; i < polyPoints.length; i++) {
        const p = polyPoints[i];
        if (Math.hypot(pos.x - p.x, pos.y - p.y) < vertexHitRadius) {
            return { mode: `vertex-${i}`, vertexIndex: i };
        }
    }

    // 3. Corps
    if (isPointInPolygon(pos, polyPoints)) {
        const p0 = polyPoints[0];
        return { mode: 'body', offset: { x: pos.x - p0.x, y: pos.y - p0.y } };
    }

    return null;
};

/**
 * UPDATE POSITION (AVEC SÉCURITÉ LIMITES)
 */
export const updateViperUltPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: string,
    dragOffset: { x: number, y: number }
): DrawingObject => {
    const points = [...obj.points];
    const lastIdx = points.length - 1; // Index de l'icône

    // SÉPARATION DES POINTS POUR LES TESTS
    // Les points du polygone sont tous sauf le dernier
    const polyPoints = points.slice(0, -1);

    // CAS A : Déplacement de l'icône SEULE (AVEC SÉCURITÉ)
    if (mode === 'icon') {
        const nextX = pos.x - dragOffset.x;
        const nextY = pos.y - dragOffset.y;

        // VÉRIFICATION : Est-ce que le point futur est dans le polygone ?
        if (isPointInPolygon({ x: nextX, y: nextY }, polyPoints)) {
            // Si oui, on autorise le mouvement
            points[lastIdx] = { x: nextX, y: nextY };
        } else {
            // Si non, on ne fait rien (l'icône bute contre le mur invisible)
            // On pourrait implémenter un "glissement" sur les bords ici,
            // mais bloquer est la solution la plus simple et efficace.
        }
        return { ...obj, points };
    }

    // CAS B : Déplacement d'un sommet spécifique
    if (mode.startsWith('vertex-')) {
        const index = parseInt(mode.split('-')[1], 10);
        if (!isNaN(index) && index < lastIdx) {
            points[index] = { x: pos.x, y: pos.y };
            return { ...obj, points };
        }
    }

    // CAS C : Déplacement GLOBAL (Nuage + Icône)
    if (mode === 'body') {
        const currentP0 = points[0];
        const targetP0 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };

        const dx = targetP0.x - currentP0.x;
        const dy = targetP0.y - currentP0.y;

        const newPoints = points.map(p => ({
            x: p.x + dx,
            y: p.y + dy
        }));

        return { ...obj, points: newPoints };
    }

    return obj;
};