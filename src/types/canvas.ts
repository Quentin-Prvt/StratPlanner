// src/types/canvas.ts

// Définition centralisée des types
export type ToolType = 'pen' | 'eraser' | 'cursor' | 'agent' | 'ability' | 'wall' | null;
export type StrokeType = 'solid' | 'dashed' | 'arrow' | 'dashed-arrow' | 'rect' | 'wall';

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