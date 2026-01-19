import type { DrawingObject, VisionObject } from '../types/canvas';
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

// Fonction utilitaire pour dessiner le losange rouge (poignée de rotation)
const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();
};

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
    globalIconSize: number = 20,
    isRotated: boolean = false
) => {
    // 1. Nettoyage du canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    drawings.forEach(obj => {
        ctx.save();
        ctx.setLineDash([]); // Reset des pointillés par sécurité

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = obj.opacity;

        // --- 1. OUTIL VISION (Cône) ---
        if (obj.tool === 'vision') {
            const vision = obj as VisionObject;

            // On se place au centre de l'objet et on tourne
            ctx.translate(vision.x, vision.y);
            ctx.rotate(vision.rotation);

            // Le Cône (Remplissage)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            // Arc de -30° à +30° (ajusté ici à PI/15 soit 12 degrés, modifiez selon besoin)
            ctx.arc(0, 0, vision.radius * mapScale, -Math.PI / 6, Math.PI / 6);
            ctx.closePath();
            ctx.fillStyle = `${vision.color}40`; // Couleur avec transparence
            ctx.fill();

            // Les contours (Lignes)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(vision.radius * mapScale, 0); // Ligne centrale
            ctx.strokeStyle = vision.color;
            ctx.lineWidth = vision.thickness;
            ctx.stroke();

            // Bords du cône
            ctx.beginPath();
            const r = vision.radius * mapScale;
            // Bord haut
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(-Math.PI/6) * r, Math.sin(-Math.PI/6) * r);
            // Bord bas
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(Math.PI/6) * r, Math.sin(Math.PI/6) * r);
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore(); // On annule la rotation pour dessiner les poignées droites

            // Poignée centrale (Déplacement)
            const handleSize = 6;
            ctx.beginPath();
            ctx.arc(vision.x, vision.y, handleSize, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Poignée de rotation (Losange)
            const handleX = vision.x + Math.cos(vision.rotation) * (vision.radius * mapScale);
            const handleY = vision.y + Math.sin(vision.rotation) * (vision.radius * mapScale);
            drawDiamond(ctx, handleX, handleY, handleSize, '#ff4655');

            return;
        }

        // --- 2. OUTIL TEXTE (Avec Styles Avancés) ---
        if (obj.tool === 'text' && obj.text && obj.x !== undefined && obj.y !== undefined) {
            ctx.translate(obj.x, obj.y);
            // Contre-rotation si la map est tournée pour que le texte reste lisible
            if (isRotated) ctx.rotate(Math.PI);

            const fontSize = (obj.fontSize || 20) * mapScale;
            const fontWeight = obj.fontWeight || 'normal';
            const fontStyle = obj.fontStyle || 'normal';
            const decoration = obj.textDecoration || 'none'; // 'underline' | 'none'
            const bgColor = obj.backgroundColor || null; // string | null

            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lines = obj.text.split('\n');
            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;
            const startY = -(totalHeight / 2) + (lineHeight / 2);

            // --- GESTION DU FOND (HIGHLIGHT) ---
            if (bgColor) {
                let maxWidth = 0;
                lines.forEach(line => {
                    const metrics = ctx.measureText(line);
                    if (metrics.width > maxWidth) maxWidth = metrics.width;
                });

                // Marge autour du texte
                const padding = 6 * mapScale;
                const bgWidth = maxWidth + (padding * 2);
                const bgHeight = totalHeight + (padding * 2);

                ctx.fillStyle = bgColor;
                // Dessiner le rectangle centré
                ctx.fillRect(-bgWidth / 2, -totalHeight / 2 - padding, bgWidth, bgHeight);
            }
            // -----------------------------------

            lines.forEach((line, index) => {
                const lineY = startY + (index * lineHeight);

                // Contour noir pour lisibilité
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 4;
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'black';
                ctx.strokeText(line, 0, lineY);

                // Texte rempli
                ctx.shadowBlur = 0;
                ctx.fillStyle = obj.color;
                ctx.fillText(line, 0, lineY);
                ctx.shadowBlur = 4; // Remettre l'ombre pour la suite

                // --- GESTION DU SOULIGNÉ ---
                if (decoration === 'underline') {
                    const metrics = ctx.measureText(line);
                    const lineWidth = metrics.width;

                    ctx.beginPath();
                    // Ligne un peu en dessous du texte
                    const underlineY = lineY + (fontSize * 0.4);
                    ctx.moveTo(-lineWidth / 2, underlineY);
                    ctx.lineTo(lineWidth / 2, underlineY);

                    ctx.strokeStyle = obj.color;
                    ctx.lineWidth = Math.max(1, fontSize * 0.08); // Épaisseur proportionnelle
                    ctx.stroke();
                }
                // ---------------------------
            });

            // Cadre de sélection
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
                ctx.strokeRect(-width/2, -height/2, width, height);
            }
            ctx.restore();
            return;
        }

        // --- 3. ABILITIES VECTORIELLES ---
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

        // --- 4. IMAGES CLASSIQUES (AGENTS) AVEC CONTRE-ROTATION ---
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

                // 1. On va au centre de l'objet
                const centerX = obj.x;
                const centerY = obj.y;

                ctx.translate(centerX, centerY);

                // 2. Si rotation map activée, on pivote l'icône de 180° pour qu'elle reste droite
                if (isRotated) ctx.rotate(Math.PI);

                const ratio = img.naturalWidth / img.naturalHeight;
                let drawW = targetSize;
                let drawH = targetSize;
                if (ratio > 1) drawH = targetSize / ratio; else drawW = targetSize * ratio;

                // 3. On dessine centré sur (0,0) (qui est maintenant obj.x, obj.y)
                const drawX = -drawW / 2;
                const drawY = -drawH / 2;

                ctx.save(); // Save pour le clip

                const isIconType = obj.subtype === 'icon';
                const hasFrame = isAgent || (obj.imageSrc.includes('_icon') && !isIconType) || (obj.subtype === 'ability' && !obj.imageSrc.includes('_game'));

                if (hasFrame) {
                    let agentName = obj.imageSrc.split('_')[0];
                    if(isAgent) agentName = obj.imageSrc;

                    const agentColor = getAgentColor(agentName);
                    const boxSize = targetSize;
                    const frameX = -boxSize/2; // Relatif à 0,0
                    const frameY = -boxSize/2;
                    const borderRadius = 6 * mapScale;

                    ctx.beginPath();
                    // @ts-ignore
                    if (ctx.roundRect) ctx.roundRect(frameX, frameY, boxSize, boxSize, borderRadius);
                    else ctx.rect(frameX, frameY, boxSize, boxSize);

                    ctx.fillStyle = hexToRgba(agentColor, 0.8);
                    ctx.fill();

                    ctx.save(); // Save interne pour clip
                    ctx.clip();
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                    ctx.restore(); // Restore clip

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5 * mapScale;
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 4;
                    ctx.setLineDash([]);
                    ctx.stroke();
                } else {
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                }

                ctx.restore(); // Restore save pour le clip

                if (draggingObjectId === obj.id) {
                    ctx.save();
                    ctx.strokeStyle = '#22c55e';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(-targetSize/2 - 4, -targetSize/2 - 4, targetSize + 8, targetSize + 8);
                    ctx.restore();
                }
            }
            ctx.restore(); // Restore translate/rotate global pour cet objet
            return;
        }

        // --- 5. DESSIN VECTORIEL (LIGNES, FLÈCHES) ---
        // Les lignes suivent généralement la géométrie de la map, donc on ne les contre-pivote pas.

        ctx.strokeStyle = obj.color;
        ctx.lineWidth = obj.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const style = obj.lineType || obj.tool;

        const isDashed = style.includes('dashed');
        const isArrow = style.includes('arrow');
        const isRect = style === 'rect';

        if (isDashed) {
            ctx.setLineDash([obj.thickness * 2, obj.thickness * 2]);
        } else {
            ctx.setLineDash([]);
        }

        if (isRect && obj.points.length > 1) {
            const start = obj.points[0];
            const end = obj.points[1];
            ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else {
            if (obj.points.length > 0) {
                drawSmoothLine(ctx, obj.points);

                if (isArrow && obj.points.length > 2) {
                    const last = obj.points[obj.points.length - 1];
                    const prevIndex = Math.max(0, obj.points.length - 5);
                    const prev = obj.points[prevIndex];

                    if (prev && last) {
                        drawArrowHead(ctx, prev.x, prev.y, last.x, last.y, obj.thickness);
                    }
                }
            }
        }

        ctx.restore();
    });
};