import type { DrawingObject } from '../../types/canvas';
import { ABILITY_SIZES } from '../abilitySizes';

const BEACON_IMAGE_SIZE = 50;

export const drawBrimstoneStim = (
    ctx: CanvasRenderingContext2D,
    obj: DrawingObject,
    // On met un type explicite et une valeur par défaut pour éviter le crash si oublié
    imageCache: Map<string, HTMLImageElement> | undefined,
    triggerRedraw: () => void
) => {
    if (obj.points.length < 1) return;
    const center = obj.points[0];
    const radius = ABILITY_SIZES['brimstone_c_radius'] || 250;

    ctx.save();

    // 1. Zone d'effet
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 146, 60, 0.3)';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.95, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Logo Central
    ctx.translate(center.x, center.y);

    // Sécurité : si imageCache n'est pas passé, on ne fait rien pour l'image
    if (imageCache) {
        const imageSrc = 'brimstone_c_icon';
        let img = imageCache.get(imageSrc);

        if (!img) {
            img = new Image();
            img.src = `/abilities/${imageSrc}.png`; // Assure-toi que ce fichier existe !
            img.onload = triggerRedraw;
            // Gestion d'erreur silencieuse pour éviter le crash "broken state"
            img.onerror = () => { console.warn(`Image introuvable: `); };
            imageCache.set(imageSrc, img);
        }

        // CORRECTION CRITIQUE : On vérifie naturalWidth > 0
        // Cela garantit que l'image est bien chargée et valide avant le drawImage
        if (img.complete && img.naturalWidth > 0) {
            try {
                ctx.drawImage(
                    img,
                    -BEACON_IMAGE_SIZE / 2,
                    -BEACON_IMAGE_SIZE / 2,
                    BEACON_IMAGE_SIZE,
                    BEACON_IMAGE_SIZE
                );
            } catch (e) {
                // Ignore l'erreur de dessin si l'image est capricieuse
            }
        } else {
            // Fallback : Si l'image n'est pas là, on dessine un petit cercle témoin
            ctx.beginPath();
            ctx.fillStyle = '#f97316';
            ctx.arc(0, 0, 10, 0, Math.PI*2);
            ctx.fill();
        }
    }

    ctx.restore();
};

export const checkBrimstoneStimHit = (
    pos: { x: number, y: number },
    obj: DrawingObject
): { mode: 'center', offset?: { x: number, y: number } } | null => {
    const center = obj.points[0];
    const radius = ABILITY_SIZES['brimstone_c_radius'] || 250;
    if (Math.hypot(pos.x - center.x, pos.y - center.y) < radius) {
        return { mode: 'center', offset: { x: pos.x - center.x, y: pos.y - center.y } };
    }
    return null;
};

export const updateBrimstoneStimPosition = (
    obj: DrawingObject,
    pos: { x: number, y: number },
    dragOffset: { x: number, y: number }
): DrawingObject => {
    const newCenter = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
    return { ...obj, points: [newCenter] };
};