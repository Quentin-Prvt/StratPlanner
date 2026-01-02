import type {DrawingObject, StrokeType} from '../types/canvas';
import {ABILITY_SIZES} from './abilitySizes';

export const createDrawingFromDrop = (
    type: string,
    name: string,
    x: number,
    y: number
): DrawingObject | null => {
    const id = Date.now();

    // =========================================================================
    // 1. GESTION DES COMPÉTENCES SPÉCIFIQUES (Zones, Murs, Lignes...)
    // =========================================================================

    // --- ASTRA ---
    if (name === 'astra_x') return {
        id,
        tool: 'wall',
        subtype: 'ability',
        points: [{x: x - 100, y}, {x: x + 100, y}],
        color: '#bd00ff',
        thickness: 6,
        opacity: 0.8
    };

    // --- BREACH ---
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

    // --- BRIMSTONE ---
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

    // --- CHAMBER ---
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

    // --- CYPHER ---
    if (name === 'cypher_c') {
        const initialLength = 50;
        return {
            id,
            tool: 'cypher_c_wire',
            subtype: 'ability',
            points: [
                {x: x, y: y},
                {x: x + initialLength, y: y}
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
            points: [{x, y}],
            color: '#22d3ee',
            thickness: 0,
            opacity: 0.8
        };
    }

    // --- DEADLOCK ---
    if (name === 'deadlock_c') {
        const r = ABILITY_SIZES['deadlock_c_radius'] || 150;
        return {
            id,
            tool: 'deadlock_c_wall',
            subtype: 'ability',
            points: [
                {x, y},
                {x: x + r, y: y},
                {x: x, y: y + r},
                {x: x - r, y: y},
                {x: x, y: y - r}
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
                {x, y},
                {x: x + len, y}
            ],
            color: '#22d3ee',
            thickness: 2,
            opacity: 0.8
        };
    }

    // --- FADE ---
    if (name === 'fade_x') {
        const length = 470;
        return {
            id,
            tool: 'fade_x_zone',
            subtype: 'ability',
            points: [{x, y}, {x: x + length, y}],
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

    // --- GEKKO ---
    if (name === 'gekko_q') {
        const handleDist = ABILITY_SIZES['gekko_q_handle_dist'] || 60;
        return {
            id,
            tool: 'gekko_q_wingman',
            subtype: 'ability',
            points: [{x, y}, {x, y: y - handleDist}],
            imageSrc: 'gekko_q_game',
            color: '#fda4af',
            thickness: 0,
            opacity: 1
        };
    }

    // --- ISO ---
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
            toolName = 'iso_q_zone';
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
            points: [{x, y}, {x: x + length, y}],
            color: color,
            thickness: 0,
            opacity: 0.6
        };
    }

    // --- KAY/O ---
    if (name === 'kayo_e' || name === 'kayo_x') {
        const isUlt = name === 'kayo_x';
        const toolName: StrokeType = isUlt ? 'kayo_x_zone' : 'kayo_e_zone';
        const color = isUlt ? '#06b6d4' : '#22d3ee';

        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}],
            color: color,
            thickness: 0,
            opacity: 0.7,
            imageSrc: `${name}_icon`
        };
    }

    // --- KILLJOY ---
    if (name.startsWith('killjoy_')) {
        if (name === 'killjoy_e') {
            const dist = ABILITY_SIZES['killjoy_e_handle_dist'] || 60;
            const toolName: StrokeType = 'killjoy_e_turret';
            return {
                id,
                tool: toolName,
                subtype: 'ability',
                points: [{x, y}, {x, y: y - dist}],
                imageSrc: 'killjoy_e_game',
                color: '#eab308',
                thickness: 0,
                opacity: 1
            };
        }
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

    // --- NEON ---
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

    // --- OMEN ---
    if (name.startsWith('omen_')) {
        if (name === 'omen_q') {
            const length = ABILITY_SIZES['omen_q_length'] || 600;
            const toolName: StrokeType = 'omen_q_zone';
            return {
                id,
                tool: toolName,
                subtype: 'ability',
                points: [{x, y}, {x: x + length, y}],
                color: '#8b5cf6',
                thickness: 0,
                opacity: 0.7
            };
        }
    }

    // --- RAZE ---
    if (name === 'raze_c') {
        const dist = ABILITY_SIZES['raze_c_handle_dist'] || 60;
        const toolName: StrokeType = 'raze_c_boombot';
        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x, y: y - dist}],
            imageSrc: 'raze_c_game',
            color: '#f97316',
            thickness: 0,
            opacity: 1
        };
    }

    // --- SAGE ---
    if (name === 'sage_c') {
        const dist = ABILITY_SIZES['sage_c_handle_dist'] || 70;
        const toolName: StrokeType = 'sage_c_wall';
        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x, y: y - dist}],
            imageSrc: 'sage_c_game',
            color: '#2dd4bf',
            thickness: 0,
            opacity: 1
        };
    }

    // --- SOVA ---
    if (name.startsWith('sova_')) {
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
    if (name === 'sova_x') {
        const length = ABILITY_SIZES['sova_x_length'] || 900;
        const toolName: StrokeType = 'sova_x_blast';
        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x: x + length, y}],
            color: '#3b82f6',
            thickness: 0,
            opacity: 0.6
        };
    }

    // --- TEJO ---
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

    // --- VETO ---
    if (name.startsWith('veto_')) {
        if (['veto_c', 'veto_q', 'veto_e'].includes(name)) {
            const toolName = `${name}_zone` as StrokeType;
            let color = '#ef4444';
            if (name === 'veto_q') color = '#a855f7';
            if (name === 'veto_e') color = '#ec4899';

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
    }

    // --- VIPER ---
    if (name === 'viper_e') {
        const length = ABILITY_SIZES['viper_e_length'] || 1200;
        const handleDist = length / 2;
        const toolName: StrokeType = 'viper_e_wall';
        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x: x + handleDist, y}],
            color: '#65a30d',
            thickness: 0,
            opacity: 0.7
        };
    }

    // --- VYSE ---
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
                color: '#6b7280',
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
                color: '#a855f7',
                thickness: 0,
                opacity: 0.6
            };
        }
    }

    // --- WAYLAY ---
    if (name === 'waylay_x') {
        const length = ABILITY_SIZES['waylay_x_length'] || 600;
        const toolName: StrokeType = 'waylay_x_zone';
        return {
            id,
            tool: toolName,
            subtype: 'ability',
            points: [{x, y}, {x: x + length, y}],
            color: '#d97706',
            thickness: 0,
            opacity: 0.6
        };
    }


    // =========================================================================
    // 2. GESTION DES ICÔNES DROPPABLES (Danger, Star, Target, Spike...)
    // =========================================================================
    // C'est ici que l'on ajoute le nouveau type
    if (type === 'icon') {
        return {
            id,
            tool: 'image',
            subtype: 'icon',
            points: [],
            x, y,
            width: 40, // Taille standard pour une icône
            height: 40,
            imageSrc: `/icons/${name}.png`, // ex: /icons/danger.png
            color: '#ffffff',
            thickness: 0,
            opacity: 1
        };
    }

    // =========================================================================
    // 3. GESTION PAR DÉFAUT : IMAGES GÉNÉRIQUES (Agents, Spells simples)
    // =========================================================================

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