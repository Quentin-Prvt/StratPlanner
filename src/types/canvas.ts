
export type ToolType = 'pen' | 'eraser' | 'cursor' | 'agent' | 'ability' | 'wall' | null;

export type StrokeType = 'solid' | 'dashed' | 'arrow' | 'dashed-arrow' | 'rect' | 'wall' | 'stun_zone' | 'breach_x_zone' | 'breach_c_zone' | 'brimstone_c_zone' | 'brimstone_x_zone' | 'chamber_c_zone' | 'chamber_e_zone';


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