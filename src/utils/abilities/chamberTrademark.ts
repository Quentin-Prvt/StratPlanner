import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

/**
 * Dessine le C de Chamber (Trademark - Piège)
 */
export const drawChamberTrademark = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void,
    showZones: boolean,
    mapScale: number = 1.0
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];

    // Récupération des tailles configurées
    const radius = ABILITY_SIZES['chamber_c_radius'] * mapScale;
    const iconSize = ABILITY_SIZES['chamber_c_icon_size'] * mapScale;

    ctx.save();

    // 1. Zone de détection (Cercle Jaune/Doré)
    if (showZones) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

        // Couleurs Chamber (Or/Jaune)
        ctx.fillStyle = 'rgba(234, 179, 8, 0.2)'; // Yellow-500 très transparent
        ctx.strokeStyle = '#eab308'; // Yellow-500
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Bordure en pointillés pour le style "zone de détection"
        ctx.fill();
        ctx.stroke();
    }
    // Remettre le trait plein pour la suite
    ctx.setLineDash([]);

    // 2. Icône Centrale
    ctx.translate(center.x, center.y);

    if (imageCache) {
        const imageSrc = 'chamber_c_icon'; // Nom du fichier image
        let img = imageCache.get(imageSrc);

        if (!img) {
            img = new Image();
            img.src = `/abilities/${imageSrc}.png`;
            img.onload = triggerRedraw;
            img.onerror = () => {}; // Gestion silencieuse
            imageCache.set(imageSrc, img);
        }

        if (img.complete && img.naturalWidth > 0) {
            try {
                // Dessin de l'icône centrée
                ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
            } catch (e) { /* ignore */ }
        } else {
            // Fallback : petit carré jaune
            ctx.fillStyle = '#eab308';
            ctx.fillRect(-10, -10, 20, 20);
        }
    }

    ctx.restore();
};

/**
 * Vérifie le clic (dans le cercle)
 */
export const checkChamberTrademarkHit = (
    pos: { x: number, y: number },
    obj: DrawingObject,
    mapScale: number = 1.0
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const radius = ABILITY_SIZES['chamber_c_radius'] * mapScale;

    if (Math.hypot(pos.x - center.x, pos.y - center.y) < radius) {
        return {
            mode: 'center',
            offset: { x: pos.x - center.x, y: pos.y - center.y }
        };
    }
    return null;
};

/**
 * Mise à jour position
 */
export const updateChamberTrademarkPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number },
): DrawingObject => {
    const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
    return { ...obj, points: [newCenter] };
};