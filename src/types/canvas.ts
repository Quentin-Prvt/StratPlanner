export type ToolType = 'pen' | 'eraser' | 'cursor' | 'image' | 'text' | string ;

export type StrokeType =
    | 'solid' | 'dashed' | 'arrow' | 'dashed-arrow' | 'rect'
    | 'wall' // Astra
    | 'stun_zone' | 'breach_x_zone' | 'breach_c_zone' // Breach
    | 'brimstone_c_zone' | 'brimstone_x_zone' // Brimstone
    | 'chamber_c_zone' | 'chamber_e_zone' // Chamber
    | 'cypher_c_wire'| 'cypher_q_zone'// Cypher
    | 'deadlock_c_wall'| 'deadlock_q_sensor' // Deadlock
    | 'fade_q_zone' | 'fade_e_zone' | 'fade_x_zone' // Fade
    | 'gekko_c_zone' |'gekko_q'| 'gekko_q_wingman' // Gekko
    | 'iso_c_wall' | 'iso_q_zone' | 'iso_e' | 'iso_x_zone' // Iso
    | 'kayo_e_zone' | 'kayo_x_zone' // Kayo
    | 'killjoy_q_zone' | 'killjoy_e_turret' | 'killjoy_x_zone' // Killjoy
    | 'neon_c_wall' | 'neon_q_zone' // Neon
    | 'omen_q_zone' // Omen
    | 'raze_c_boombot' // Raze
    | 'sage_c_wall' // Sage
    | 'sova_e_bolt' | 'sova_x_blast' // Sova
    | 'tejo_x_zone' // Tejo
    | 'veto_c_zone' | 'veto_q_zone' | 'veto_e_zone' // Veto
    | 'viper_e_wall' // Viper
    | 'vyse_q_wall' | 'vyse_x_zone' // Vyse
    | 'waylay_x_zone'; // Waylay


export interface DrawingObject {
    id: number;
    tool: ToolType;
    subtype?: string; // 'agent', 'ability', 'icon'
    lineType?: StrokeType;

    points: { x: number; y: number }[];
    color: string;
    thickness: number;
    opacity: number;

    imageSrc?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;

    text?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
}

export interface StrategyStep {
    id: string;
    name: string;
    data: DrawingObject[];
}

export interface StrategyRecord {
    id: string;
    title: string;
    name?: string;
    map_name: string;
    data: any;
    created_at?: string;
    updated_at?: string;
    user_id?: string;
    folder_id?: number | null;
    team_id?: string | null;
}