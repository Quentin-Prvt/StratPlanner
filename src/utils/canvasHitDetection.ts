import type { DrawingObject } from '../types/canvas';

// --- IMPORTS LOGIQUE ABILITÉS ---
import { checkBreachStunHit, updateBreachStunPosition } from './abilities/breachStun';
import { checkAstraWallHit, updateAstraWallPosition } from './abilities/astraWall';
import { checkBreachUltHit, updateBreachUltPosition } from './abilities/breachUlt';
import { checkBreachAftershockHit, updateBreachAftershockPosition } from './abilities/breachAftershock';
import { checkBrimstoneStimHit, updateBrimstoneStimPosition } from './abilities/brimstoneStim';
import { checkBrimstoneUltHit, updateBrimstoneUltPosition } from './abilities/brimstoneUlt';
import { checkChamberTrademarkHit, updateChamberTrademarkPosition } from './abilities/chamberTrademark';
import { checkChamberRendezvousHit, updateChamberRendezvousPosition } from './abilities/chamberRendezvous';
import { checkCypherTrapwireHit, updateCypherTrapwirePosition } from './abilities/cypherTrapwire';
import { checkCypherCageHit, updateCypherCagePosition } from './abilities/cypherCage';
import { checkDeadlockWallHit, updateDeadlockWallPosition } from './abilities/deadlockWall';
import { checkDeadlockSensorHit, updateDeadlockSensorPosition } from './abilities/deadlockSensor';
import { checkFadeUltHit, updateFadeUltPosition } from './abilities/fadeUlt';
import { checkFadeSeizeHit, updateFadeSeizePosition } from './abilities/fadeSeize';
import { checkFadeHauntHit, updateFadeHauntPosition } from './abilities/fadeHaunt';
import { checkGekkoQHit, updateGekkoQPosition } from "./abilities/gekkoQ";
import { checkIsoHit, updateIsoPosition } from './abilities/isoAbilities';
import { checkKayoHit, updateKayoPosition } from './abilities/kayoAbilities';
import { checkKilljoyHit, updateKilljoyPosition } from './abilities/killjoyAbilities';
import { checkNeonHit, updateNeonPosition } from './abilities/neonAbilities';
import { checkOmenHit, updateOmenPosition } from './abilities/omenAbilities';
import { checkRazeHit, updateRazePosition } from './abilities/razeAbilities';
import { checkSageHit, updateSagePosition } from './abilities/sageAbilities';
import { checkSovaHit, updateSovaPosition } from './abilities/sovaAbilities';
import { checkTejoUltHit, updateTejoUltPosition } from './abilities/tejoUlt';
import { checkVetoHit, updateVetoPosition } from './abilities/vetoAbilities';
import { checkViperHit, updateViperPosition } from './abilities/viperAbilities';
import { checkVyseHit, updateVysePosition } from './abilities/vyseAbilities';
import { checkWaylayHit, updateWaylayPosition } from './abilities/waylayAbilities';
import { checkHarborUltHit, updateHarborUltPosition } from './abilities/harborUlt';
import {checkViperUltHit, updateViperUltPosition} from "./abilities/viperUlt.ts";


export interface HitResult {
    id: number;
    mode: string | null;
    offset?: { x: number, y: number };
    centerStart?: { x: number, y: number };
}

/**
 * Vérifie si la souris touche une compétence complexe
 */
export const checkAbilityHit = (pos: {x: number, y: number}, obj: DrawingObject): HitResult | null => {
    if (obj.tool === 'stun_zone') { const hit = checkBreachStunHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'breach_x_zone') { const hit = checkBreachUltHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'breach_c_zone') { const hit = checkBreachAftershockHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'wall') { const hit = checkAstraWallHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset, centerStart: hit.centerStart } : null; }
    if (obj.tool === 'brimstone_c_zone') { const hit = checkBrimstoneStimHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'brimstone_x_zone') { const hit = checkBrimstoneUltHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'chamber_c_zone') { const hit = checkChamberTrademarkHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'chamber_e_zone') { const hit = checkChamberRendezvousHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'cypher_c_wire') { const hit = checkCypherTrapwireHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'deadlock_q_sensor') { const hit = checkDeadlockSensorHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'cypher_q_zone') { const hit = checkCypherCageHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'deadlock_c_wall') { const hit = checkDeadlockWallHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode.toString(), offset: hit.offset } : null; }
    if (obj.tool === 'fade_x_zone') { const hit = checkFadeUltHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'fade_q_zone') { const hit = checkFadeSeizeHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'fade_e_zone') { const hit = checkFadeHauntHit(pos, obj); return hit ? { id: obj.id, mode: 'center', offset: hit.offset } : null; }
    if (obj.tool === 'gekko_q_wingman') { const hit = checkGekkoQHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'harbor_x_zone') {const hit = checkHarborUltHit(pos, obj, 1.0); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null;}    if (['iso_c_wall', 'iso_q_zone', 'iso_x_zone'].includes(obj.tool as string)) { const hit = checkIsoHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'kayo_e_zone' || obj.tool === 'kayo_x_zone') { const hit = checkKayoHit(pos, obj); return hit ? { id: obj.id, mode: 'center', offset: hit.offset } : null; }
    if (obj.tool.startsWith('killjoy_')) { const hit = checkKilljoyHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'neon_c_wall' || obj.tool === 'neon_q_zone') { const hit = checkNeonHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'omen_q_zone') { const hit = checkOmenHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'raze_c_boombot') { const hit = checkRazeHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'sage_c_wall') { const hit = checkSageHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool.startsWith('sova_')) { const hit = checkSovaHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'tejo_x_zone') { const hit = checkTejoUltHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (['veto_c_zone', 'veto_q_zone', 'veto_e_zone'].includes(obj.tool as string)) { const hit = checkVetoHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'viper_e_wall') { const hit = checkViperHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'viper_x_zone') { const hit = checkViperUltHit(pos,obj); return hit ? {id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool.startsWith('vyse_')) { const hit = checkVyseHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }
    if (obj.tool === 'waylay_x_zone') { const hit = checkWaylayHit(pos, obj); return hit ? { id: obj.id, mode: hit.mode, offset: hit.offset } : null; }

    return null;
};

/**
 * Met à jour la position d'une compétence complexe lors du drag
 */
export const updateAbilityPosition = (
    obj: DrawingObject,
    pos: {x: number, y: number},
    specialDragMode: string | null,
    dragOffset: {x: number, y: number},
    wallCenterStart: {x: number, y: number}
): DrawingObject => {
    if (obj.tool === 'stun_zone') return updateBreachStunPosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'breach_x_zone') return updateBreachUltPosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'breach_c_zone') return updateBreachAftershockPosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'wall') return updateAstraWallPosition(obj, pos, specialDragMode as any, dragOffset, wallCenterStart);
    if (obj.tool === 'brimstone_c_zone') return updateBrimstoneStimPosition(obj, pos, dragOffset);
    if (obj.tool === 'brimstone_x_zone') return updateBrimstoneUltPosition(obj, pos, dragOffset);
    if (obj.tool === 'chamber_c_zone') return updateChamberTrademarkPosition(obj, pos, dragOffset);
    if (obj.tool === 'chamber_e_zone') return updateChamberRendezvousPosition(obj, pos, dragOffset);
    if (obj.tool === 'cypher_q_zone') return updateCypherCagePosition(obj, pos, dragOffset);
    if (obj.tool === 'cypher_c_wire') return updateCypherTrapwirePosition(obj, pos, specialDragMode as 'handle'|'body', dragOffset);
    if (obj.tool === 'deadlock_c_wall') { const pointIndex = parseInt(specialDragMode as string, 10); return updateDeadlockWallPosition(obj, pos, pointIndex, dragOffset); }
    if (obj.tool === 'deadlock_q_sensor') return updateDeadlockSensorPosition(obj, pos, specialDragMode as 'center'|'rotate', dragOffset);
    if (obj.tool === 'fade_x_zone') return updateFadeUltPosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'fade_q_zone') return updateFadeSeizePosition(obj, pos, dragOffset);
    if (obj.tool === 'fade_e_zone') return updateFadeHauntPosition(obj, pos, dragOffset);
    if (obj.tool === 'gekko_q_wingman') return updateGekkoQPosition(obj, pos, specialDragMode as 'center'|'rotate', dragOffset);
    if (obj.tool === 'harbor_x_zone') return updateHarborUltPosition(obj, pos, specialDragMode as any, dragOffset);
    if (['iso_c_wall', 'iso_q_zone', 'iso_x_zone'].includes(obj.tool as string)) return updateIsoPosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'kayo_e_zone' || obj.tool === 'kayo_x_zone') return updateKayoPosition(obj, pos, dragOffset);
    if (obj.tool.startsWith('killjoy_')) return updateKilljoyPosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'neon_c_wall' || obj.tool === 'neon_q_zone') return updateNeonPosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'omen_q_zone') return updateOmenPosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'raze_c_boombot') return updateRazePosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'sage_c_wall') return updateSagePosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool.startsWith('sova_')) return updateSovaPosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'tejo_x_zone') return updateTejoUltPosition(obj, pos, specialDragMode as any, dragOffset);
    if (['veto_c_zone', 'veto_q_zone', 'veto_e_zone'].includes(obj.tool as string)) return updateVetoPosition(obj, pos, dragOffset);
    if (obj.tool === 'viper_e_wall') return updateViperPosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'viper_x_zone') return updateViperUltPosition(obj, pos, specialDragMode as string, dragOffset);
    if (obj.tool.startsWith('vyse_')) return updateVysePosition(obj, pos, specialDragMode as any, dragOffset);
    if (obj.tool === 'waylay_x_zone') return updateWaylayPosition(obj, pos, specialDragMode as any, dragOffset);

    return obj;
};