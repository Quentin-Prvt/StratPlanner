import type { DrawingObject } from '../types/canvas';
import { drawSmoothLine, drawArrowHead } from './canvasDrawing';

// Imports des Abilités Vectorielles
import { drawBreachStun } from './abilities/breachStun';
import { drawAstraWall } from './abilities/astraWall';
import { drawBreachUlt } from './abilities/breachUlt';
import { drawBreachAftershock } from './abilities/breachAftershock';
import { drawBrimstoneStim } from './abilities/brimstoneStim';
import { drawBrimstoneUlt } from './abilities/brimstoneUlt';
import { drawChamberTrademark } from './abilities/chamberTrademark';
import { drawChamberRendezvous } from './abilities/chamberRendezvous';
import { drawCypherTrapwire } from './abilities/cypherTrapwire';
import { drawCypherCage } from './abilities/cypherCage';
import { drawDeadlockWall } from './abilities/deadlockWall';
import { drawDeadlockSensor } from './abilities/deadlockSensor';
import { drawFadeUlt } from './abilities/fadeUlt';
import { drawFadeSeize } from './abilities/fadeSeize';
import { drawFadeHaunt } from "./abilities/fadeHaunt";
import { drawGekkoQ } from './abilities/gekkoQ';
import { drawIsoRect } from './abilities/isoAbilities';
import { drawKayoZone } from './abilities/kayoAbilities';
import { drawKilljoyZone, drawKilljoyTurret } from './abilities/killjoyAbilities';
import { drawNeonWall, drawNeonStun } from './abilities/neonAbilities';
import { drawOmenParanoia } from './abilities/omenAbilities';
import { drawRazeBoomBot } from './abilities/razeAbilities';
import { drawSageWall } from './abilities/sageAbilities';
import { drawSovaBolt, drawSovaUlt } from './abilities/sovaAbilities';
import { drawTejoUlt } from './abilities/tejoUlt';
import { drawVetoZone } from './abilities/vetoAbilities';
import { drawViperWall } from './abilities/viperAbilities';
import { drawVyseWall, drawVyseUltZone } from './abilities/vyseAbilities';
import { drawWaylayUlt } from './abilities/waylayAbilities';

/**
 * Fonction principale qui dessine tout sur le canvas
 */
export const renderDrawings = (
    ctx: CanvasRenderingContext2D,
    drawings: DrawingObject[],
    imageCache: Map<string, HTMLImageElement>,
    triggerRedraw: () => void,
    draggingObjectId: number | null,
    showZones: boolean = true
) => {
    // 1. Nettoyage du canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    drawings.forEach(obj => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = obj.opacity;

        // --- A. TEXTE (NOUVEAU) ---
        if (obj.tool === 'text' && obj.text && obj.x !== undefined && obj.y !== undefined) {
            ctx.save();

            const fontSize = obj.fontSize || 20;
            const fontWeight = obj.fontWeight || 'normal'; // 'bold' ou 'normal'
            const fontStyle = obj.fontStyle || 'normal';   // 'italic' ou 'normal'

            // Construction de la police complète
            // ex: "italic bold 24px Arial"
            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial, sans-serif`;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Ombre noire
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'black';
            ctx.strokeText(obj.text, obj.x, obj.y);

            // Couleur
            ctx.shadowBlur = 0;
            ctx.fillStyle = obj.color;
            ctx.fillText(obj.text, obj.x, obj.y);

            // Cadre de sélection
            if (draggingObjectId === obj.id) {
                // On mesure la largeur approximative pour le cadre
                const metrics = ctx.measureText(obj.text);
                const width = metrics.width + 20;
                const height = fontSize + 20;

                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(obj.x - width/2, obj.y - height/2, width, height);
            }
            ctx.restore();
            return;
        }
        // --- B. ABILITIES VECTORIELLES SPÉCIALES ---
        if (obj.tool === 'stun_zone') { drawBreachStun(ctx, obj); return; }
        if (obj.tool === 'breach_x_zone') { drawBreachUlt(ctx, obj); return; }
        if (obj.tool === 'breach_c_zone') { drawBreachAftershock(ctx, obj); return; }
        if (obj.tool === 'wall') { drawAstraWall(ctx, obj); return; }
        if (obj.tool === 'brimstone_c_zone') { drawBrimstoneStim(ctx, obj, imageCache, triggerRedraw, showZones); return; }
        if (obj.tool === 'brimstone_x_zone') { drawBrimstoneUlt(ctx, obj); return; }
        if (obj.tool === 'chamber_c_zone') { drawChamberTrademark(ctx, obj, imageCache, triggerRedraw, showZones); return; }
        if (obj.tool === 'chamber_e_zone') { drawChamberRendezvous(ctx, obj, imageCache, triggerRedraw, showZones); return; }
        if (obj.tool === 'cypher_c_wire') { drawCypherTrapwire(ctx, obj); return; }
        if (obj.tool === 'cypher_q_zone') { drawCypherCage(ctx, obj); return; }
        if (obj.tool === 'deadlock_c_wall') { drawDeadlockWall(ctx, obj); return; }
        if (obj.tool === 'deadlock_q_sensor') { drawDeadlockSensor(ctx, obj); return; }
        if (obj.tool === 'fade_x_zone') { drawFadeUlt(ctx, obj); return; }
        if (obj.tool === 'fade_e_zone') { drawFadeHaunt(ctx, obj, imageCache, triggerRedraw, showZones); return; }
        if (obj.tool === 'fade_q_zone') { drawFadeSeize(ctx, obj, imageCache, triggerRedraw, showZones); return; }
        if (obj.tool === 'gekko_q_wingman') { drawGekkoQ(ctx, obj, imageCache, triggerRedraw); return; }
        if (['iso_c_wall', 'iso_q_zone', 'iso_x_zone'].includes(obj.tool as string)) { drawIsoRect(ctx, obj); return; }
        if (obj.tool === 'kayo_e_zone' || obj.tool === 'kayo_x_zone') { drawKayoZone(ctx, obj, imageCache, triggerRedraw, showZones); return; }
        if (obj.tool === 'killjoy_q_zone' || obj.tool === 'killjoy_x_zone') { drawKilljoyZone(ctx, obj, imageCache, triggerRedraw, showZones); return; }
        if (obj.tool === 'killjoy_e_turret') { drawKilljoyTurret(ctx, obj, imageCache, triggerRedraw); return; }
        if (obj.tool === 'neon_c_wall') { drawNeonWall(ctx, obj); return; }
        if (obj.tool === 'neon_q_zone') { drawNeonStun(ctx, obj, imageCache, triggerRedraw); return; }
        if (obj.tool === 'omen_q_zone') { drawOmenParanoia(ctx, obj); return; }
        if (obj.tool === 'raze_c_boombot') { drawRazeBoomBot(ctx, obj, imageCache, triggerRedraw); return; }
        if (obj.tool === 'sage_c_wall') { drawSageWall(ctx, obj, imageCache, triggerRedraw); return; }
        if (obj.tool === 'sova_e_bolt') { drawSovaBolt(ctx, obj, imageCache, triggerRedraw, showZones); return; }
        if (obj.tool === 'sova_x_blast') { drawSovaUlt(ctx, obj); return; }
        if (obj.tool === 'tejo_x_zone') { drawTejoUlt(ctx, obj); return; }
        if (['veto_c_zone', 'veto_q_zone', 'veto_e_zone'].includes(obj.tool as string)) { drawVetoZone(ctx, obj, imageCache, triggerRedraw, showZones); return; }
        if (obj.tool === 'viper_e_wall') { drawViperWall(ctx, obj); return; }
        if (obj.tool === 'vyse_q_wall') { drawVyseWall(ctx, obj); return; }
        if (obj.tool === 'vyse_x_zone') { drawVyseUltZone(ctx, obj, imageCache, triggerRedraw, showZones); return; }
        if (obj.tool === 'waylay_x_zone') { drawWaylayUlt(ctx, obj); return; }

        // --- C. IMAGES CLASSIQUES (Agents, Spells) & ICONES ---
        if (obj.tool === 'image' && obj.imageSrc && obj.x != null && obj.y != null) {

            // Gestion du chargement d'image
            let img = imageCache.get(obj.imageSrc);
            if (!img) {
                img = new Image();

                // LOGIQUE DE CHEMINS
                if (obj.subtype === 'icon') {
                    // Si c'est une icône, le dropFactory a déjà mis le chemin complet (ex: /icons/danger.png)
                    img.src = obj.imageSrc;
                } else if (obj.subtype === 'agent') {
                    // Agents
                    img.src = `/agents/${obj.imageSrc}.png`;
                } else {
                    // Compétences
                    img.src = `/abilities/${obj.imageSrc}.png`;
                }

                img.onload = triggerRedraw;
                img.onerror = () => { /* Silence erreur chargement */ };
                imageCache.set(obj.imageSrc, img);
            }

            // Dessin sécurisé
            if (img && img.complete && img.naturalWidth > 0) {
                const targetSize = obj.width || 50;
                const centerX = obj.x;
                const centerY = obj.y;

                // Calcul ratio pour ne pas déformer l'image
                const ratio = img.naturalWidth / img.naturalHeight;
                let drawW = targetSize;
                let drawH = targetSize;
                if (ratio > 1) drawH = targetSize / ratio; else drawW = targetSize * ratio;

                const drawX = centerX - drawW / 2;
                const drawY = centerY - drawH / 2;

                ctx.save();

                // STYLE : Cadre seulement pour les Agents et certains Spells, PAS pour les icônes
                const isIcon = obj.subtype === 'icon';
                // Liste des sorts style "Icône avec cadre"
                const isAbilityIcon = obj.subtype === 'ability' && (obj.imageSrc.includes('_icon') || [
                    'breach_q', 'chamber_q', 'chamber_x', 'clove_c', 'clove_x', 'cypher_e', 'cypher_x', 'deadlock_x',
                    'fade_c', 'gekko_e','gekko_x', 'iso_e','jett_q','jett_e','jett_x','kayo_q', 'neon_e', 'neon_x',
                    'omen_c', 'omen_x', 'phoenix_c', 'phoenix_e', 'phoenix_x', 'raze_q', 'raze_e', 'raze_x',
                    'reyna_q','reyna_e','reyna_x', 'sage_e','sage_x', 'skye_c', 'skye_q', 'skye_e', 'skye_x',
                    'sova_c', 'tejo_c', 'veto_x', 'vyse_e', 'yoru_c', 'yoru_q', 'yoru_e', 'yoru_x', 'waylay_q', 'waylay_e'
                ].some(key => obj.imageSrc?.includes(key)));

                if (!isIcon && (obj.subtype === 'agent' || isAbilityIcon)) {
                    // Dessin avec cadre carré arrondi
                    const boxSize = targetSize;
                    const frameX = centerX - boxSize/2;
                    const frameY = centerY - boxSize/2;
                    const borderRadius = 6;

                    ctx.beginPath();
                    if (typeof ctx.roundRect === 'function') ctx.roundRect(frameX, frameY, boxSize, boxSize, borderRadius);
                    else ctx.rect(frameX, frameY, boxSize, boxSize);

                    ctx.fillStyle = '#1e293b';
                    ctx.fill();

                    ctx.save();
                    ctx.clip();
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                    ctx.restore();

                    ctx.strokeStyle = '#cbd5e1';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#cbd5e1';
                    ctx.shadowBlur = 10;
                    ctx.stroke();
                } else {
                    // Dessin brut (transparent) pour Smokes, Mollys, et ICONES (Danger, Spike...)
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                }
                ctx.restore();

                // Cadre de sélection vert (Drag)
                if (draggingObjectId === obj.id) {
                    ctx.save();
                    ctx.strokeStyle = '#22c55e';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.shadowBlur = 0;
                    ctx.strokeRect(centerX - targetSize/2 - 2, centerY - targetSize/2 - 2, targetSize + 4, targetSize + 4);
                    ctx.restore();
                }
            }
            return;
        }

        // --- D. DESSIN VECTORIEL STANDARD (Traits, Flèches) ---
        ctx.strokeStyle = obj.color;
        ctx.lineWidth = obj.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (obj.tool === 'dashed' || obj.tool === 'dashed-arrow') ctx.setLineDash([obj.thickness * 2, obj.thickness * 2]);
        else ctx.setLineDash([]);

        if (obj.tool === 'rect') {
            const start = obj.points[0]; const end = obj.points[1];
            ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else {
            drawSmoothLine(ctx, obj.points);
            if ((obj.tool === 'arrow' || obj.tool === 'dashed-arrow') && obj.points.length > 2) {
                const last = obj.points[obj.points.length - 1];
                const prev = obj.points[Math.max(0, obj.points.length - 5)];
                if(prev && last) drawArrowHead(ctx, prev.x, prev.y, last.x, last.y, obj.thickness);
            }
        }
    });
};