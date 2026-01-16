import { MousePointer2 } from 'lucide-react';

export interface RemoteCursor {
    id: string;      // ID de l'user (Supabase Auth ID)
    x: number;       // Position X sur la MAP (pas l'écran)
    y: number;       // Position Y sur la MAP
    color: string;   // Couleur unique générée
    name: string;    // Pseudo ou Email
    lastUpdate: number; // Timestamp pour le nettoyage
}

interface RemoteCursorOverlayProps {
    cursors: Record<string, RemoteCursor>; // Dictionnaire des curseurs actifs
}

export const RemoteCursorOverlay = ({ cursors }: RemoteCursorOverlayProps) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {Object.values(cursors).map((cursor) => (
                <div
                    key={cursor.id}
                    className="absolute top-0 left-0 flex flex-col items-start"
                    style={{
                        // C'est ici que la magie opère pour la position
                        transform: `translate(${cursor.x}px, ${cursor.y}px)`,
                        // Transition fluide pour interpoler les "sauts" du réseau
                        transition: 'transform 0.1s linear',
                    }}
                >
                    <MousePointer2
                        size={24}
                        fill={cursor.color}
                        color="white" // Contour blanc pour contraste
                        className="drop-shadow-md"
                    />
                    <div
                        className="px-2 py-1 rounded-full text-xs font-bold text-white shadow-md whitespace-nowrap mt-1 ml-4"
                        style={{ backgroundColor: cursor.color }}
                    >
                        {cursor.name}
                    </div>
                </div>
            ))}
        </div>
    );
};