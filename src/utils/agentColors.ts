// src/utils/agentColors.ts

// Palette des couleurs par Agent
export const AGENT_COLORS: Record<string, string> = {
    // Sentinelles
    killjoy: '#facc15', // Jaune
    cypher: '#9ca3af',  // Gris/Blanc
    sage: '#22d3ee',    // Cyan/Jade
    chamber: '#eab308', // Or
    deadlock: '#38bdf8',// Bleu Tech
    vyse: '#94a3b8',    // Acier/Gris métal

    // Contrôleurs
    brimstone: '#f97316', // Orange
    viper: '#4ade80',     // Vert Poison
    omen: '#6366f1',      // Indigo/Violet
    astra: '#a855f7',     // Violet Cosmique
    harbor: '#0696d4',    // Cyan Eau
    clove: '#f472b6',     // Rose

    // Initiateurs
    sova: '#3b82f6',      // Bleu Chasseur
    breach: '#d97706',    // Orange Terre
    skye: '#84cc16',      // Vert Nature
    kayo: '#60a5fa',      // Bleu Robot
    fade: '#1e293b',      // Noir/Gris (Nightmare) - ou #0f172a
    gekko: '#a3e635',     // Vert Lime
    tejo: '#2dd4bf',      // Teal (Custom)
    waylay: '#ef4444',    // Rouge (Custom)

    // Duelistes
    jett: '#e0f2fe',      // Blanc/Bleu Ciel
    phoenix: '#f97316',   // Feu
    raze: '#f59e0b',      // Orange Explosif
    reyna: '#d946ef',     // Violet Impératrice
    yoru: '#3b82f6',      // Bleu Dimensionnel
    neon: '#ffe46a',      // Jaune Électrique
    iso: '#c084fc',       // Violet Énergie

    // Custom
    veto: '#ec4899',      // Rose
};

/**
 * Récupère la couleur HEX de l'agent basée sur le nom de l'outil (ex: 'killjoy_c_zone' -> '#facc15')
 */
export const getAgentColor = (toolName: string): string => {
    const agent = toolName.split('_')[0]; // Récupère "killjoy" depuis "killjoy_c_zone"
    return AGENT_COLORS[agent] || '#ffffff'; // Blanc par défaut
};

/**
 * Convertit une couleur Hex (#RRGGBB) en RGBA avec opacité
 */
export const hexToRgba = (hex: string, alpha: number): string => {
    let r = 0, g = 0, b = 0;
    // Gestion hex 3 chars (#fff) ou 6 chars (#ffffff)
    if (hex.length === 4) {
        r = parseInt("0x" + hex[1] + hex[1]);
        g = parseInt("0x" + hex[2] + hex[2]);
        b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
        r = parseInt("0x" + hex[1] + hex[2]);
        g = parseInt("0x" + hex[3] + hex[4]);
        b = parseInt("0x" + hex[5] + hex[6]);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};