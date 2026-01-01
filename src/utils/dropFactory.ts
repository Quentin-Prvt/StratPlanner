import type { DrawingObject } from '../types/canvas';
import { ABILITY_SIZES } from './abilitySizes';

export const createDrawingFromDrop = (
    type: string,
    name: string,
    x: number,
    y: number
): DrawingObject | null => {
    const id = Date.now();

    // --- 1. ASTRA ---
    if (name === 'astra_x') return { id, tool: 'wall', subtype: 'ability', points: [{x: x - 100, y}, {x: x + 100, y}], color: '#bd00ff', thickness: 6, opacity: 0.8 };

    // --- 2. BREACH ---
    if (name === 'breach_e') return { id, tool: 'stun_zone', subtype: 'ability', points: [{x, y}, {x, y: y - 200}], color: '#eab308', thickness: 0, opacity: 0.8 };
    if (name === 'breach_x') return { id, tool: 'breach_x_zone', subtype: 'ability', points: [{x, y}, {x, y: y - 850}], color: '#ef4444', thickness: 0, opacity: 0.8 };
    if (name === 'breach_c') return { id, tool: 'breach_c_zone', subtype: 'ability', points: [{x, y}, {x, y: y - 150}], color: '#f59e0b', thickness: 0, opacity: 0.8 };

    // --- 3. BRIMSTONE ---
    if (name === 'brimstone_c') return { id, tool: 'brimstone_c_zone', subtype: 'ability', points: [{x, y}], color: '#f97316', thickness: 0, opacity: 0.8 };
    if (name === 'brimstone_x') return { id, tool: 'brimstone_x_zone', subtype: 'ability', points: [{x, y}], color: '#ff4500', thickness: 0, opacity: 0.8 };

    // --- 4. CHAMBER ---
    if (name === 'chamber_c') return { id, tool: 'chamber_c_zone', subtype: 'ability', points: [{x, y}], color: '#eab308', thickness: 0, opacity: 0.8 };
    if (name === 'chamber_e') return { id, tool: 'chamber_e_zone', subtype: 'ability', points: [{x, y}], color: '#facc15', thickness: 0, opacity: 0.8 };
    if (name === 'cypher_c') {
        // On commence avec une petite longueur, l'utilisateur l'étendra
        const initialLength = 50;

        return {
            id,
            tool: 'cypher_c_wire',
            subtype: 'ability',
            points: [
                { x: x, y: y }, // P1 (Ancre) sous la souris
                { x: x + initialLength, y: y } // P2 (Poignée) à droite
            ],
            color: '#22d3ee',
            thickness: 2,
            opacity: 0.8
        };
    }

    if (name === 'cypher_q') {
        return {
            id,
            tool: 'cypher_q_zone',
            subtype: 'ability',
            points: [{x, y}], // Un seul point central
            color: '#22d3ee', // Cyan
            thickness: 0,
            opacity: 0.8
        };
    }
    if (name === 'deadlock_c') {
        const r = ABILITY_SIZES['deadlock_c_radius'] || 150;
        return {
            id,
            tool: 'deadlock_c_wall', // Nouveau nom
            subtype: 'ability',
            points: [
                { x, y },                // P0: Centre
                { x: x + r, y: y },      // P1: Droite (0°)
                { x: x, y: y + r },      // P2: Bas (90°)
                { x: x - r, y: y },      // P3: Gauche (180°)
                { x: x, y: y - r }       // P4: Haut (270°)
            ],
            color: '#22d3ee',
            thickness: 4,
            opacity: 0.8
        };
    }
    if (name === 'deadlock_q') {
        const len = ABILITY_SIZES['deadlock_q_length'] || 200;
        return {
            id,
            tool: 'deadlock_q_sensor',
            subtype: 'ability',
            points: [
                { x, y },            // Centre
                { x: x + len, y }    // Poignée (direction par défaut : droite)
            ],
            color: '#22d3ee',
            thickness: 2,
            opacity: 0.8
        };
    }
    if (name === 'fade_x') {
        const length = 470;
        return {
            id,
            tool: 'fade_x_zone',
            subtype: 'ability',
            points: [
                { x, y },
                { x: x + length, y }
            ],
            color: '#6366f1',
            thickness: 0,
            opacity: 0.8
        };
    }
    if (name === 'fade_q') {
        return {
            id,
            tool: 'fade_q_zone',
            subtype: 'ability',
            points: [{ x, y }],
            color: '#6366f1',
            thickness: 0,
            opacity: 0.8,
            imageSrc: 'fade_q_icon'
        };
    }
    if (name === 'fade_e') {
        return {
            id,
            tool: 'fade_e_zone',
            subtype: 'ability',
            points: [{ x, y }],
            color: '#818cf8',
            thickness: 0,
            opacity: 0.8,
            imageSrc: 'fade_e_icon'
        };
    }
    // --- 5. IMAGES GÉNÉRIQUES (Agents, Smokes, Mollys, Icons) ---

    // Liste des sorts qui utilisent l'image "_icon"
    const useIconFile = ['breach_q', 'chamber_q', 'chamber_x', 'clove_c', 'clove_x','cypher_e', 'cypher_x', 'deadlock_x', 'fade_c'];

    const suffix = useIconFile.includes(name) ? '_icon' : '_game';
    const finalImageSrc = type === 'ability' ? `${name}${suffix}` : name;

    let size = type === 'ability' ? 80 : 50;
    if (ABILITY_SIZES[name]) { size = ABILITY_SIZES[name]; }

    const defaultOpacity = type === 'ability' ? 0.8 : 1;

    return {
        id,
        tool: 'image',
        subtype: type as 'agent' | 'ability',
        points: [],
        color: '#fff',
        thickness: 0,
        opacity: defaultOpacity,
        imageSrc: finalImageSrc,
        x, y,
        width: size,
        height: size
    };
};