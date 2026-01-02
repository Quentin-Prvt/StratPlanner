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
import { drawFadeUlt } from './abilities/fadeUlt.ts';
import { drawFadeSeize } from './abilities/fadeSeize';
import { drawFadeHaunt } from "./abilities/fadeHaunt.ts";
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
    draggingObjectId: number | null
) => {
    // 1. Nettoyage du canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    drawings.forEach(obj => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = obj.opacity;

        // --- A. ABILITIES VECTORIELLES SPÉCIALES ---
        if (obj.tool === 'stun_zone') { drawBreachStun(ctx, obj); return; }
        if (obj.tool === 'breach_x_zone') { drawBreachUlt(ctx, obj); return; }
        if (obj.tool === 'breach_c_zone') { drawBreachAftershock(ctx, obj); return; }
        if (obj.tool === 'wall') { drawAstraWall(ctx, obj); return; }

        // Brimstone
        if (obj.tool === 'brimstone_c_zone') { drawBrimstoneStim(ctx, obj, imageCache, triggerRedraw); return; }
        if (obj.tool === 'brimstone_x_zone') { drawBrimstoneUlt(ctx, obj); return; }

        // Chamber
        if (obj.tool === 'chamber_c_zone') { drawChamberTrademark(ctx, obj, imageCache, triggerRedraw); return; }
        if (obj.tool === 'chamber_e_zone') { drawChamberRendezvous(ctx, obj, imageCache, triggerRedraw); return; }

        // Cypher
        if (obj.tool === 'cypher_c_wire') { drawCypherTrapwire(ctx, obj); return; }
        if (obj.tool === 'cypher_q_zone') { drawCypherCage(ctx, obj); return; }

        // Deadlock
        if (obj.tool === 'deadlock_c_wall') { drawDeadlockWall(ctx, obj); return; }
        if (obj.tool === 'deadlock_q_sensor') { drawDeadlockSensor(ctx, obj); return; }

        // Fade
        if (obj.tool === 'fade_x_zone') { drawFadeUlt(ctx, obj);return; }
        if (obj.tool === 'fade_e_zone') {drawFadeHaunt(ctx, obj, imageCache, triggerRedraw);return;}
        if (obj.tool === 'fade_q_zone') { drawFadeSeize(ctx, obj, imageCache, triggerRedraw);return; }
        // Gekko
        if (obj.tool === 'gekko_q_wingman') {drawGekkoQ(ctx, obj, imageCache, triggerRedraw);return;}
        // Iso
        if (['iso_c_wall', 'iso_q_zone', 'iso_x_zone'].includes(obj.tool as string)) {drawIsoRect(ctx, obj);return;}
        // Kayo
        if (obj.tool === 'kayo_e_zone' || obj.tool === 'kayo_x_zone') {drawKayoZone(ctx, obj, imageCache, triggerRedraw);return;}
        // Killjoy
        if (obj.tool === 'killjoy_q_zone' || obj.tool === 'killjoy_x_zone') {drawKilljoyZone(ctx, obj, imageCache, triggerRedraw);return;}
        if (obj.tool === 'killjoy_e_turret') {drawKilljoyTurret(ctx, obj, imageCache, triggerRedraw);return;}
        if (obj.tool === 'neon_c_wall') {drawNeonWall(ctx, obj);return;}
        if (obj.tool === 'neon_q_zone') {drawNeonStun(ctx, obj, imageCache, triggerRedraw);return;}
        if (obj.tool === 'omen_q_zone') {drawOmenParanoia(ctx, obj);return;}
        if (obj.tool === 'raze_c_boombot') {drawRazeBoomBot(ctx, obj, imageCache, triggerRedraw);return;}
        if (obj.tool === 'sage_c_wall') {drawSageWall(ctx, obj, imageCache, triggerRedraw);return;}
        if (obj.tool === 'sova_e_bolt') {drawSovaBolt(ctx, obj, imageCache, triggerRedraw);return;}
        if (obj.tool === 'sova_x_blast') {drawSovaUlt(ctx, obj);return;}
        if (obj.tool === 'tejo_x_zone') {drawTejoUlt(ctx, obj);return;}
        if (['veto_c_zone', 'veto_q_zone', 'veto_e_zone'].includes(obj.tool as string)) {drawVetoZone(ctx, obj, imageCache, triggerRedraw);return;}
        if (obj.tool === 'viper_e_wall') {drawViperWall(ctx, obj);return;}
        if (obj.tool === 'vyse_q_wall') {drawVyseWall(ctx, obj);return;}
        if (obj.tool === 'vyse_x_zone') {drawVyseUltZone(ctx, obj, imageCache, triggerRedraw);return;}
        if (obj.tool === 'waylay_x_zone') {drawWaylayUlt(ctx, obj);return;}
        // --- B. IMAGES CLASSIQUES & ICONES ---
        if (obj.tool === 'image' && obj.imageSrc && obj.x != null && obj.y != null) {
            // Détection du type pour le dossier
            const isAbility = obj.subtype === 'ability' || obj.imageSrc.includes('_game') || obj.imageSrc.includes('_icon');

            // Liste des sorts style "Icône avec cadre"
            const isIconStyle = [
                'breach_q',
                'chamber_q', 'chamber_x',
                'clove_c', 'clove_x', 'cypher_e', 'cypher_x', 'deadlock_x', 'fade_c', 'gekko_e','gekko_x',
                'iso_e','jett_q','jett_e','jett_x','kayo_q',
                'neon_e', 'neon_x',
                'omen_c', 'omen_x', 'phoenix_c', 'phoenix_e', 'phoenix_x', 'raze_q', 'raze_e', 'raze_x', 'reyna_q','reyna_e','reyna_x', 'sage_e','sage_x', 'skye_c', 'skye_q', 'skye_e', 'skye_x',
                'sova_c', 'tejo_c', 'veto_x', 'vyse_e', 'yoru_c', 'yoru_q', 'yoru_e', 'yoru_x', 'waylay_q', 'waylay_e'
            ].some(key => obj.imageSrc?.includes(key));

            // Gestion du chargement d'image
            let img = imageCache.get(obj.imageSrc);
            if (!img) {
                img = new Image();
                // SÉCURITÉ : Choix du bon dossier
                const folder = isAbility ? '/abilities/' : '/agents/';
                img.src = `${folder}${obj.imageSrc}.png`;

                img.onload = triggerRedraw;
                img.onerror = () => { /* Silence erreur chargement */ };
                imageCache.set(obj.imageSrc, img);
            }

            // Dessin sécurisé (Anti-Crash)
            if (img && img.complete && img.naturalWidth > 0) {
                const targetSize = obj.width || 50;
                const boxW = targetSize; const boxH = targetSize;

                // Calcul ratio
                const naturalRatio = img.naturalWidth / img.naturalHeight;
                let drawW = boxW; let drawH = boxH;
                if (naturalRatio > 1) drawH = boxW / naturalRatio; else drawW = boxH * naturalRatio;

                const centerX = obj.x; const centerY = obj.y;
                const drawX = centerX - drawW / 2; const drawY = centerY - drawH / 2;

                ctx.save();
                if (isAbility && !isIconStyle) {
                    // Dessin brut (transparent) pour Smokes, Mollys, etc.
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                } else {
                    // Dessin avec cadre pour Agents et sorts "équipables"
                    const frameX = centerX - boxW/2; const frameY = centerY - boxH/2; const borderRadius = 6;
                    ctx.beginPath();
                    if (typeof ctx.roundRect === 'function') ctx.roundRect(frameX, frameY, boxW, boxH, borderRadius); else ctx.rect(frameX, frameY, boxW, boxH);
                    ctx.fillStyle = '#1e293b'; ctx.fill();

                    ctx.save(); ctx.clip(); ctx.drawImage(img, drawX, drawY, drawW, drawH); ctx.restore();

                    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.shadowColor = '#cbd5e1'; ctx.shadowBlur = 15; ctx.stroke();
                }
                ctx.restore();

                // Cadre de sélection vert
                if (draggingObjectId === obj.id) {
                    ctx.save(); ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.shadowBlur = 0;
                    ctx.strokeRect(centerX - boxW/2 - 2, centerY - boxH/2 - 2, boxW + 4, boxH + 4);
                    ctx.restore();
                }
            }
            return;
        }

        // --- C. DESSIN VECTORIEL STANDARD (Traits, Flèches) ---
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