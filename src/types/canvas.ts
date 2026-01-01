// src/types/canvas.ts
import type { StrokeType } from '../components/ToolsSidebar';

// Définition d'un objet dessiné
export interface DrawingObject {
    id: number;
    tool: StrokeType | 'image';
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

// Structure de la BDD Supabase
export interface StrategyRecord {
    id: string;
    name: string;
    data: DrawingObject[];
    created_at: string;
}