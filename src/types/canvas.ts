
export type ToolType = 'pen' | 'eraser' | 'cursor' | 'agent' | 'ability' | 'wall' | null;

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
    | 'raze_c_boombot'; // Raze
export interface DrawingObject {
    id: number;
    tool: StrokeType | 'image';
    subtype?: 'agent' | 'ability';
    points: { x: number, y: number }[];
    color: string;
    thickness: number;
    opacity: number;
    imageSrc?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}
export interface DrawingObject {
    id: number;
    tool: StrokeType | 'image';
    subtype?: 'agent' | 'ability';
    points: { x: number, y: number }[];
    color: string;
    thickness: number;
    opacity: number;
    imageSrc?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}

export interface StrategyRecord {
    id: string;
    name: string;
    data: DrawingObject[];
    created_at: string;
}