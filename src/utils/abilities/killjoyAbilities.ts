import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';
import { getAgentColor, hexToRgba } from '../agentColors'; // <-- NOUVEL IMPORT

/**
 * A. DESSIN DES ZONES CIRCULAIRES (C, Q et X)
 */
export const drawKilljoyZone = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];
    const tool = obj.tool;

    // --- COULEURS DYNAMIQUES ---
    const agentHex = getAgentColor(tool); // Récupère le jaune (#facc15)
    const stroke = agentHex;
    let primaryRadius = 0;
    let secondaryRadius = 0;
    let iconSize = 30 * mapScale;

    // Couleur de fond par défaut (20% opacité)
    let color = hexToRgba(agentHex, 0.2);

    if (tool === 'killjoy_c_zone') {
        primaryRadius = (ABILITY_SIZES['killjoy_c_radius'] || 70) * mapScale;
        iconSize = (ABILITY_SIZES['killjoy_c_icon_size'] || 30) * mapScale;
    }
    else if (tool === 'killjoy_q_zone') {
        primaryRadius = (ABILITY_SIZES['killjoy_q_radius'] || 70) * mapScale;
        secondaryRadius = (ABILITY_SIZES['killjoy_q_detection_radius'] || 120) * mapScale;
        iconSize = (ABILITY_SIZES['killjoy_q_icon_size'] || 30) * mapScale;
    }
    else if (tool === 'killjoy_x_zone') {
        primaryRadius = (ABILITY_SIZES['killjoy_x_radius'] || 245) * mapScale;
        iconSize = (ABILITY_SIZES['killjoy_x_icon_size'] || 30) * mapScale;
        // L'ult est souvent plus clair car très grand
        color = hexToRgba(agentHex, 0.15);
    }

    ctx.save();

    // 1. Zone Secondaire (Q)
    if (showZones && secondaryRadius > 0) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, secondaryRadius, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(agentHex, 0.05); // Très léger
        ctx.strokeStyle = hexToRgba(agentHex, 0.4);
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // 2. Zone Primaire
    const alwaysVisible = (tool === 'killjoy_c_zone' || tool === 'killjoy_q_zone');
    if (showZones || alwaysVisible) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, primaryRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
    }

    // 3. Icône avec fond de couleur
    if (imageCache && obj.imageSrc) {
        // Fond de l'icône (Cercle plein couleur agent)
        ctx.beginPath();
        ctx.arc(center.x, center.y, iconSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = agentHex; // Couleur pleine (Jaune)
        ctx.fill();
        ctx.strokeStyle = '#ffffff'; // Petit bord blanc pour faire ressortir
        ctx.lineWidth = 1;
        ctx.stroke();

        let img = imageCache.get(obj.imageSrc);
        if (!img) {
            img = new Image();
            img.src = `/abilities/${obj.imageSrc}.png`;
            img.onload = triggerRedraw;
            imageCache.set(obj.imageSrc, img);
        }
        if (img.complete && img.naturalWidth > 0) {
            // On dessine l'image un peu plus petite que le fond pour faire une marge
            const imgDrawSize = iconSize * 0.8;
            ctx.drawImage(img, center.x - imgDrawSize/2, center.y - imgDrawSize/2, imgDrawSize, imgDrawSize);
        }
    }
    ctx.restore();
};

/**
 * B. DESSIN DE LA TOURELLE (E)
 */
export const drawKilljoyTurret = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean = true,
    mapScale: number = 1.0

) => {
    if (obj.points.length < 2) return;
    const p1 = obj.points[0];
    const p2 = obj.points[1];
    const size = ABILITY_SIZES['killjoy_e_size'] * mapScale;
    const rangeRadius = (ABILITY_SIZES['killjoy_e_range'] || 200) * mapScale;

    // --- COULEURS ---
    const agentHex = getAgentColor(obj.tool);

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();

    // 1. Zone de portée
    if (showZones) {
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, rangeRadius, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(agentHex, 0.1);
        ctx.strokeStyle = hexToRgba(agentHex, 0.5);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.fill();
        ctx.stroke();
    }

    // 2. Image Rotatée
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle + Math.PI / 2);

    // Fond coloré sous la tourelle (optionnel, mais sympa)
    ctx.beginPath();
    ctx.arc(0, 0, size/2.5, 0, Math.PI*2);
    ctx.fillStyle = hexToRgba(agentHex, 0.3);
    ctx.fill();

    if (imageCache && obj.imageSrc) {
        let img = imageCache.get(obj.imageSrc);
        if (!img) {
            img = new Image();
            img.src = `/abilities/${obj.imageSrc}.png`;
            img.onload = triggerRedraw;
            imageCache.set(obj.imageSrc, img);
        }
        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -size/2, -size/2, size, size);
        }
    }
    ctx.restore();

    // 3. Handle de rotation
    ctx.save();
    ctx.translate(p2.x, p2.y);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = agentHex; // Couleur agent
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-6, -6, 12, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

// ... (Le reste : checkKilljoyHit et updateKilljoyPosition reste identique)
export const checkKilljoyHit = (pos: { x: number, y: number }, obj: DrawingObject, mapScale: number = 1.0) => {
    if (obj.tool === 'killjoy_e_turret') {
        const p1 = obj.points[0];
        const p2 = obj.points[1];
        const size = ABILITY_SIZES['killjoy_e_size'] * mapScale;
        if (Math.hypot(pos.x - p2.x, pos.y - p2.y) < 15) return { mode: 'rotate' };
        if (Math.hypot(pos.x - p1.x, pos.y - p1.y) < size/2 + 10) return { mode: 'center', offset: { x: pos.x - p1.x, y: pos.y - p1.y } };
        return null;
    }
    const center = obj.points[0];
    const HITBOX = 30;
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < HITBOX) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

export const updateKilljoyPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    mode: 'center' | 'rotate',
    dragOffset: { x: number, y: number },
    mapScale: number = 1.0
) => {
    if (obj.tool === 'killjoy_e_turret' && mode === 'rotate') {
        const p1 = obj.points[0];
        const dist = (ABILITY_SIZES['killjoy_e_handle_dist'] || 60) * mapScale;
        const angle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        const newP2 = { x: p1.x + Math.cos(angle) * dist, y: p1.y + Math.sin(angle) * dist };
        return { ...obj, points: [p1, newP2] };
    }
    const p1 = obj.points[0];
    const newP1 = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
    if (obj.points.length > 1) {
        const p2 = obj.points[1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return { ...obj, points: [newP1, { x: newP1.x + dx, y: newP1.y + dy }] };
    }
    return { ...obj, points: [newP1] };
};