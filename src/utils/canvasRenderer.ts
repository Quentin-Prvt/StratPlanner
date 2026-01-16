import type { DrawingObject } from '../types/canvas';
import { drawSmoothLine, drawArrowHead } from './canvasDrawing';
import { getAgentColor, hexToRgba } from './agentColors';

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
import { drawHarborUlt} from "./abilities/harborUlt";
import { drawViperUlt} from "./abilities/viperUlt";

/**
 * Fonction principale qui dessine tout sur le canvas
 */
export const renderDrawings = (
    ctx: CanvasRenderingContext2D,
    drawings: DrawingObject[],
    imageCache: Map<string, HTMLImageElement>,
    triggerRedraw: () => void,
    draggingObjectId: number | null,
    showZones: boolean = true,
    mapScale: number = 1.0,
    globalIconSize: number = 20
) => {
    // Nettoyage du canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    drawings.forEach(obj => {
        // On sauvegarde l'état pur du contexte avant de dessiner cet objet
        ctx.save();

        // On force le reset des pointillés pour éviter la contamination
        ctx.setLineDash([]);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = obj.opacity;

        // --- TEXTE ---
        if (obj.tool === 'text' && obj.text && obj.x !== undefined && obj.y !== undefined) {
            // ctx.save(); // Redondant avec le save() global de la boucle
            const textX = obj.x;
            const textY = obj.y;

            const fontSize = (obj.fontSize || 20) * mapScale;
            const fontWeight = obj.fontWeight || 'normal';
            const fontStyle = obj.fontStyle || 'normal';

            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lines = obj.text.split('\n');
            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;
            const startY = textY - (totalHeight / 2) + (lineHeight / 2);

            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'black';

            lines.forEach((line, index) => {
                const lineY = startY + (index * lineHeight);
                ctx.strokeText(line, textX, lineY);
                ctx.shadowBlur = 0;
                ctx.fillStyle = obj.color;
                ctx.fillText(line, textX, lineY);
                ctx.shadowBlur = 4;
            });

            if (draggingObjectId === obj.id) {
                let maxWidth = 0;
                lines.forEach(line => {
                    const metrics = ctx.measureText(line);
                    if (metrics.width > maxWidth) maxWidth = metrics.width;
                });
                const width = maxWidth + 20;
                const height = totalHeight + 20;
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(textX - width/2, textY - height/2, width, height);
            }
            ctx.restore(); // Restaure pour passer au suivant
            return;
        }

        // --- ABILITIES VECTORIELLES ---
        if (obj.tool === 'stun_zone') { drawBreachStun(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'breach_x_zone') { drawBreachUlt(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'breach_c_zone') { drawBreachAftershock(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'wall') { drawAstraWall(ctx, obj); ctx.restore(); return; }
        if (obj.tool === 'brimstone_c_zone') { drawBrimstoneStim(ctx, obj, imageCache, triggerRedraw, showZones, mapScale); ctx.restore(); return; }
        if (obj.tool === 'brimstone_x_zone') { drawBrimstoneUlt(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'chamber_c_zone') { drawChamberTrademark(ctx, obj, imageCache, triggerRedraw, showZones, mapScale); ctx.restore(); return; }
        if (obj.tool === 'chamber_e_zone') { drawChamberRendezvous(ctx, obj, imageCache, triggerRedraw, showZones, mapScale); ctx.restore(); return; }
        if (obj.tool === 'cypher_c_wire') { drawCypherTrapwire(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'cypher_q_zone') { drawCypherCage(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'deadlock_c_wall') { drawDeadlockWall(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'deadlock_q_sensor') { drawDeadlockSensor(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'fade_x_zone') { drawFadeUlt(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'fade_e_zone') { drawFadeHaunt(ctx, obj, imageCache, triggerRedraw, showZones, mapScale); ctx.restore(); return; }
        if (obj.tool === 'fade_q_zone') { drawFadeSeize(ctx, obj, imageCache, triggerRedraw, showZones, mapScale); ctx.restore(); return; }
        if (obj.tool === 'gekko_q_wingman') { drawGekkoQ(ctx, obj, imageCache, triggerRedraw, mapScale); ctx.restore(); return; }
        if (obj.tool === 'harbor_x_zone') {drawHarborUlt(ctx, obj, mapScale); ctx.restore(); return; }
        if (['iso_q_zone', 'iso_x_zone'].includes(obj.tool as string)) { drawIsoRect(ctx, obj); ctx.restore(); return; }
        if (obj.tool === 'kayo_e_zone' || obj.tool === 'kayo_x_zone') { drawKayoZone(ctx, obj, imageCache, triggerRedraw, showZones, mapScale); ctx.restore(); return; }
        if (obj.tool === 'killjoy_c_zone' || obj.tool === 'killjoy_q_zone' || obj.tool === 'killjoy_x_zone') { drawKilljoyZone(ctx, obj, imageCache, triggerRedraw, showZones, mapScale); ctx.restore(); return; }
        if (obj.tool === 'killjoy_e_turret') { drawKilljoyTurret(ctx, obj, imageCache, triggerRedraw, showZones,  mapScale); ctx.restore(); return; }
        if (obj.tool === 'neon_c_wall') { drawNeonWall(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'neon_q_zone') { drawNeonStun(ctx, obj, imageCache, triggerRedraw, mapScale); ctx.restore(); return; }
        if (obj.tool === 'omen_q_zone') { drawOmenParanoia(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'raze_c_boombot') { drawRazeBoomBot(ctx, obj, imageCache, triggerRedraw, mapScale); ctx.restore(); return; }
        if (obj.tool === 'sage_c_wall') { drawSageWall(ctx, obj, imageCache, triggerRedraw, mapScale); ctx.restore(); return; }
        if (obj.tool === 'sova_e_bolt') { drawSovaBolt(ctx, obj, imageCache, triggerRedraw, showZones, mapScale); ctx.restore(); return; }
        if (obj.tool === 'sova_x_blast') { drawSovaUlt(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'tejo_x_zone') { drawTejoUlt(ctx, obj, mapScale); ctx.restore(); return; }
        if (['veto_c_zone', 'veto_q_zone', 'veto_e_zone'].includes(obj.tool as string)) { drawVetoZone(ctx, obj, imageCache, triggerRedraw, showZones, mapScale); ctx.restore(); return; }
        if (obj.tool === 'viper_e_wall') { drawViperWall(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'viper_x_zone') {drawViperUlt(ctx, obj, imageCache, triggerRedraw, mapScale); ctx.restore(); return;}
        if (obj.tool === 'vyse_q_wall') { drawVyseWall(ctx, obj, mapScale); ctx.restore(); return; }
        if (obj.tool === 'vyse_x_zone') { drawVyseUltZone(ctx, obj, imageCache, triggerRedraw, showZones, mapScale); ctx.restore(); return; }
        if (obj.tool === 'waylay_x_zone') { drawWaylayUlt(ctx, obj, mapScale); ctx.restore(); return; }

        // --- C. IMAGES CLASSIQUES ---
        if (obj.tool === 'image' && obj.imageSrc && obj.x != null && obj.y != null) {
            let img = imageCache.get(obj.imageSrc);
            if (!img) {
                img = new Image();
                if (obj.subtype === 'icon') img.src = obj.imageSrc;
                else if (obj.subtype === 'agent') img.src = `/agents/${obj.imageSrc}.png`;
                else img.src = `/abilities/${obj.imageSrc}.png`;
                img.onload = triggerRedraw;
                img.onerror = () => { };
                imageCache.set(obj.imageSrc, img);
            }

            if (img && img.complete && img.naturalWidth > 0) {
                let baseSize = obj.width || 50;
                const isAgent = obj.subtype === 'agent';
                const isAbilityIcon = obj.subtype === 'ability' && (obj.imageSrc.includes('_icon') || !obj.imageSrc.includes('_game'));

                if (isAgent || isAbilityIcon) baseSize = globalIconSize;

                const targetSize = baseSize * mapScale;
                const centerX = obj.x;
                const centerY = obj.y;
                const ratio = img.naturalWidth / img.naturalHeight;
                let drawW = targetSize;
                let drawH = targetSize;
                if (ratio > 1) drawH = targetSize / ratio; else drawW = targetSize * ratio;
                const drawX = centerX - drawW / 2;
                const drawY = centerY - drawH / 2;

                ctx.save(); // Save interne pour le clip

                const isIconType = obj.subtype === 'icon';
                const hasFrame = isAgent || (obj.imageSrc.includes('_icon') && !isIconType) || (obj.subtype === 'ability' && !obj.imageSrc.includes('_game'));

                if (hasFrame) {
                    let agentName = obj.imageSrc.split('_')[0];
                    if(isAgent) agentName = obj.imageSrc;

                    const agentColor = getAgentColor(agentName);
                    const boxSize = targetSize;
                    const frameX = centerX - boxSize/2;
                    const frameY = centerY - boxSize/2;
                    const borderRadius = 6 * mapScale;

                    ctx.beginPath();

                    if (ctx.roundRect) ctx.roundRect(frameX, frameY, boxSize, boxSize, borderRadius);
                    else ctx.rect(frameX, frameY, boxSize, boxSize);

                    ctx.fillStyle = hexToRgba(agentColor, 0.8);
                    ctx.fill();

                    ctx.save(); // Save pour le clip
                    ctx.clip();
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                    ctx.restore(); // Restore clip

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5 * mapScale;
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 4;
                    // On s'assure que le cadre est solide
                    ctx.setLineDash([]);
                    ctx.stroke();
                } else {
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                }

                ctx.restore(); // Restore save interne

                if (draggingObjectId === obj.id) {
                    ctx.save();
                    ctx.strokeStyle = '#22c55e';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(centerX - targetSize/2 - 4, centerY - targetSize/2 - 4, targetSize + 8, targetSize + 8);
                    ctx.restore();
                }
            }
            ctx.restore(); // Restore save global
            return;
        }

        // ---DESSIN VECTORIEL ---

        ctx.strokeStyle = obj.color;
        ctx.lineWidth = obj.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const style = obj.lineType || obj.tool;

        const isDashed = style.includes('dashed');
        const isArrow = style.includes('arrow');
        const isRect = style === 'rect';

        // Application des pointillés
        if (isDashed) {
            ctx.setLineDash([obj.thickness * 2, obj.thickness * 2]);
        } else {
            ctx.setLineDash([]);
        }

        //  Dessiner la forme
        if (isRect && obj.points.length > 1) {
            const start = obj.points[0];
            const end = obj.points[1];
            ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else {
            // Dessin du trait
            if (obj.points.length > 0) {
                drawSmoothLine(ctx, obj.points);

                // Dessin de la flèche à la fin
                if (isArrow && obj.points.length > 2) {
                    const last = obj.points[obj.points.length - 1];
                    // On recule un peu pour trouver l'angle de la pointe
                    const prevIndex = Math.max(0, obj.points.length - 5);
                    const prev = obj.points[prevIndex];

                    if (prev && last) {
                        drawArrowHead(ctx, prev.x, prev.y, last.x, last.y, obj.thickness);
                    }
                }
            }
        }

        ctx.restore(); // Fin du bloc, on restaure pour le prochain
    });
};