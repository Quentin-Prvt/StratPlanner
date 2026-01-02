import type {DrawingObject, StrokeType} from '../types/canvas';
import {ABILITY_SIZES} from './abilitySizes';

export const createDrawingFromDrop = (

    type: string,
    name: string,
    x: number,
    y: number
): DrawingObject | null => {
    const id = Date.now();

    // --- 1. ASTRA ---
    if (name === 'astra_x') return {
        id,
        tool: 'wall',
        subtype: 'ability',
        points: [{x: x - 100, y}, {x: x + 100, y}],
        color: '#bd00ff',
        thickness: 6,
        opacity: 0.8
    };

    // --- 2. BREACH ---
    if (name === 'breach_e') return {
        id,
        tool: 'stun_zone',
        subtype: 'ability',
        points: [{x, y}, {x, y: y - 200}],
        color: '#eab308',
        thickness: 0,
        opacity: 0.8
    };
    if (name === 'breach_x') return {
        id,
        tool: 'breach_x_zone',
        subtype: 'ability',
        points: [{x, y}, {x, y: y - 850}],
        color: '#ef4444',
        thickness: 0,
        opacity: 0.8
    };
    if (name === 'breach_c') return {
        id,
        tool: 'breach_c_zone',
        subtype: 'ability',
        points: [{x, y}, {x, y: y - 150}],
        color: '#f59e0b',
        thickness: 0,
        opacity: 0.8
    };

    // --- 3. BRIMSTONE ---
    if (name === 'brimstone_c') return {
        id,
        tool: 'brimstone_c_zone',
        subtype: 'ability',
        points: [{x, y}],
        color: '#f97316',
        thickness: 0,
        opacity: 0.8
    };
    if (name === 'brimstone_x') return {
        id,
        tool: 'brimstone_x_zone',
        subtype: 'ability',
        points: [{x, y}],
        color: '#ff4500',
        thickness: 0,
        opacity: 0.8
    };

    // --- 4. CHAMBER ---
    if (name === 'chamber_c') return {
        id,
        tool: 'chamber_c_zone',
        subtype: 'ability',
        points: [{x, y}],
        color: '#eab308',
        thickness: 0,
        opacity: 0.8
    };
    if (name === 'chamber_e') return {
        id,
        tool: 'chamber_e_zone',
        subtype: 'ability',
        points: [{x, y}],
        color: '#facc15',
        thickness: 0,
        opacity: 0.8
    };
    if (name === 'cypher_c') {
        // On commence avec une petite longueur, l'utilisateur l'étendra
        const initialLength = 50;

        return {
            id,
            tool: 'cypher_c_wire',
            subtype: 'ability',
            points: [
                {x: x, y: y}, // P1 (Ancre) sous la souris
                {x: x + initialLength, y: y} // P2 (Poignée) à droite
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
                {x, y},                // P0: Centre
                {x: x + r, y: y},      // P1: Droite (0°)
                {x: x, y: y + r},      // P2: Bas (90°)
                {x: x - r, y: y},      // P3: Gauche (180°)
                {x: x, y: y - r}       // P4: Haut (270°)
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
                {x, y},            // Centre
                {x: x + len, y}    // Poignée (direction par défaut : droite)
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
                {x, y},
                {x: x + length, y}
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
            points: [{x, y}],
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
            points: [{x, y}],
            color: '#818cf8',
            thickness: 0,
            opacity: 0.8,
            imageSrc: 'fade_e_icon'
        };
    }
    if (name === 'gekko_q') {
        const handleDist = ABILITY_SIZES['gekko_q_handle_dist'] || 60;
        return {
            id,
            tool: 'gekko_q_wingman', // Nouveau tool
            subtype: 'ability',
            // P1 au centre, P2 vers le haut par défaut (car l'image regarde vers le haut)
            points: [{x, y}, {x, y: y - handleDist}],
            imageSrc: 'gekko_q_game', // Nom de ton image
            color: '#fda4af',
            thickness: 0,
            opacity: 1
        };
    }
    if (['iso_c', 'iso_q', 'iso_x'].includes(name)) {
        let length = 400;


        let toolName: StrokeType = 'iso_c_wall';

        let color = '#8b5cf6';

        if (name === 'iso_c') {
            length = ABILITY_SIZES['iso_c_length'] || 400;
            toolName = 'iso_c_wall';
        }
        if (name === 'iso_q') {
            length = ABILITY_SIZES['iso_q_length'] || 500;
            toolName = 'iso_q_zone'; // TypeScript acceptera car c'est une valeur valide de StrokeType
            color = '#6d28d9';
        }
        if (name === 'iso_x') {
            length = ABILITY_SIZES['iso_x_length'] || 800;
            toolName = 'iso_x_zone';
            color = '#3b82f6';
        }

        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x: x + length, y}], // P1 et P2 (horizontal)
            color: color,
            thickness: 0,
            opacity: 0.6
        };
    }
    if (name === 'kayo_e' || name === 'kayo_x') {
        const isUlt = name === 'kayo_x';
        const toolName: StrokeType = isUlt ? 'kayo_x_zone' : 'kayo_e_zone';
        const color = isUlt ? '#06b6d4' : '#22d3ee'; // Cyan

        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}], // Un seul point central
            color: color,
            thickness: 0,
            opacity: 0.7,
            imageSrc: `${name}_icon` // ex: kayo_e_icon
        };
    }
    if (name.startsWith('killjoy_')) {
        // E - Tourelle (Orientable)
        if (name === 'killjoy_e') {
            const dist = ABILITY_SIZES['killjoy_e_handle_dist'] || 60;
            const toolName: StrokeType = 'killjoy_e_turret';
            return {
                id,
                tool: toolName,
                subtype: 'ability',
                points: [{x, y}, {x, y: y - dist}],
                imageSrc: 'killjoy_e_game', // Assure-toi d'avoir cette image
                color: '#eab308',
                thickness: 0,
                opacity: 1
            };
        }
        // Q & X (Circulaire)
        let toolName: StrokeType = 'killjoy_q_zone';
        let color = '#eab308';
        if (name === 'killjoy_x') {
            toolName = 'killjoy_x_zone';
            color = '#06b6d4';
        }
        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}],
            imageSrc: `${name}_icon`,
            color: color,
            thickness: 0,
            opacity: 0.6
        };
    }
    if (name.startsWith('neon_')) {
        if (name === 'neon_c') {
            const length = ABILITY_SIZES['neon_c_length'] || 600;
            const toolName: StrokeType = 'neon_c_wall';
            return {
                id,
                tool: toolName,
                subtype: 'ability',
                points: [{x, y}, {x: x + length, y}],
                color: '#22d3ee',
                thickness: 0,
                opacity: 0.7
            };
        }
        if (name === 'neon_q') {
            const toolName: StrokeType = 'neon_q_zone';
            return {
                id,
                tool: toolName,
                subtype: 'ability',
                points: [{x, y}],
                imageSrc: 'neon_q_icon',
                color: '#22d3ee',
                thickness: 0,
                opacity: 0.6
            };
        }
    }
    if (name.startsWith('omen_')) {
        // Q - Paranoïa
        if (name === 'omen_q') {
            const length = ABILITY_SIZES['omen_q_length'] || 600;
            const toolName: StrokeType = 'omen_q_zone';
            return {
                id,
                tool: toolName,
                subtype: 'ability',
                points: [{x, y}, {x: x + length, y}], // P1 et P2
                color: '#8b5cf6',
                thickness: 0,
                opacity: 0.7
            };
        }
    }
    if (name === 'raze_c') {
        const dist = ABILITY_SIZES['raze_c_handle_dist'] || 60;
        const toolName: StrokeType = 'raze_c_boombot';
        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x, y: y - dist}], // P1 et P2
            imageSrc: 'raze_c_game',
            color: '#f97316',
            thickness: 0,
            opacity: 1
        };
    }
    if (name === 'sage_c') {
        const dist = ABILITY_SIZES['sage_c_handle_dist'] || 70;
        const toolName: StrokeType = 'sage_c_wall';

        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x, y: y - dist}], // P1 et P2
            imageSrc: 'sage_c_game', // Assurez-vous d'avoir cette image
            color: '#2dd4bf',
            thickness: 0,
            opacity: 1
        };
    }
    if (name.startsWith('sova_')) {
        // E - Recon (Rond avec Icone)
        if (name === 'sova_e') {
            const toolName: StrokeType = 'sova_e_bolt';
            return {
                id,
                tool: toolName,
                subtype: 'ability',
                points: [{x, y}],
                imageSrc: 'sova_e_icon',
                color: '#3b82f6',
                thickness: 0,
                opacity: 0.6
            };
        }
    }

    // X - Hunter's Fury (Rectangle Directionnel)
    if (name === 'sova_x') {
        const length = ABILITY_SIZES['sova_x_length'] || 900;
        const toolName: StrokeType = 'sova_x_blast';
        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x: x + length, y}], // P1 et P2
            color: '#3b82f6',
            thickness: 0,
            opacity: 0.6
        };
    }
    if (name === 'tejo_x') {
        const length = ABILITY_SIZES['tejo_x_length'] || 650;
        const toolName: StrokeType = 'tejo_x_zone';

        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x: x + length, y}],
            color: '#475569',
            thickness: 0,
            opacity: 0.6
        };
    }
    if (name.startsWith('veto_')) {
        // C, Q, E -> Zones Circulaires
        if (['veto_c', 'veto_q', 'veto_e'].includes(name)) {
            // Astuce pour générer le nom du tool dynamiquement : veto_c_zone, veto_q_zone...
            const toolName = `${name}_zone` as StrokeType;

            // Couleurs par défaut (seront surchargées par le dessinateur, mais utiles ici)
            let color = '#ef4444';
            if (name === 'veto_q') color = '#a855f7';
            if (name === 'veto_e') color = '#ec4899';

            return {
                id,
                tool: toolName,
                subtype: 'ability',
                points: [{x, y}],
                imageSrc: `${name}_icon`, // ex: veto_c_icon
                color: color,
                thickness: 0,
                opacity: 0.6
            };
        }
    }
    if (name === 'viper_e') {
        const length = ABILITY_SIZES['viper_e_length'] || 1200;
        const handleDist = length / 2;

        const toolName: StrokeType = 'viper_e_wall';

        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x: x + handleDist, y}], // P1 et P2
            color: '#65a30d',
            thickness: 0,
            opacity: 0.7
        };
    }
    if (name.startsWith('vyse_')) {
        if (name === 'vyse_q') {
            const length = ABILITY_SIZES['vyse_q_length'] || 450;
            const handleDist = length / 2;
            const toolName: StrokeType = 'vyse_q_wall';
            return {
                id,
                tool: toolName,
                subtype: 'ability',
                points: [{x, y}, {x: x + handleDist, y}],
                color: '#6b7280', // Gris Métal
                thickness: 0,
                opacity: 0.7
            };
        }
        if (name === 'vyse_x') {
            const toolName: StrokeType = 'vyse_x_zone';
            return {
                id,
                tool: toolName,
                subtype: 'ability',
                points: [{x, y}],
                imageSrc: 'vyse_x_icon',
                color: '#a855f7', // Violet
                thickness: 0,
                opacity: 0.6
            };
        }
    }
    if (name === 'waylay_x') {
        const length = ABILITY_SIZES['waylay_x_length'] || 600;
        const toolName: StrokeType = 'waylay_x_zone';

        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x: x + length, y}], // P1 et P2
            color: '#d97706', // Ambre
            thickness: 0,
            opacity: 0.6
        };
    }


    // --- 5. IMAGES GÉNÉRIQUES (Agents, Smokes, Mollys, Icons) ---

    // Liste des sorts qui utilisent l'image "_icon"
    const useIconFile = ['breach_q',
        'neon_e', 'neon_x', 'kayo_q', 'jett_q', 'jett_e', 'jett_x', 'chamber_q', 'chamber_x', 'clove_c', 'clove_x', 'cypher_e', 'cypher_x', 'deadlock_x', 'fade_c', 'gekko_e', 'gekko_x', 'iso_e',
        'omen_c', 'omen_x', 'phoenix_c', 'phoenix_e', 'phoenix_x', 'raze_q', 'raze_e', 'raze_x', 'reyna_q', 'reyna_e', 'reyna_x', 'sage_e', 'sage_x', 'skye_c', 'skye_q', 'skye_e', 'skye_x', 'sova_c',
        'tejo_c', 'veto_x', 'vyse_e', 'yoru_c', 'yoru_q', 'yoru_e', 'yoru_x', 'waylay_q', 'waylay_e'
    ];

    const suffix = useIconFile.includes(name) ? '_icon' : '_game';
    const finalImageSrc = type === 'ability' ? `${name}${suffix}` : name;

    let size = type === 'ability' ? 80 : 50;
    if (ABILITY_SIZES[name]) {
        size = ABILITY_SIZES[name];
    }

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