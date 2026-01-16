import { MousePointer2 } from 'lucide-react';

export interface RemoteCursor {
    id: string;
    x: number;
    y: number;
    color: string;
    name: string;
    lastUpdate: number;
}

interface RemoteCursorOverlayProps {
    cursors: Record<string, RemoteCursor>;
    isRotated?: boolean;
}

export const RemoteCursorOverlay = ({ cursors, isRotated = false }: RemoteCursorOverlayProps) => {
    return (
        <div
            className="absolute inset-0 pointer-events-none z-50 overflow-hidden"
            style={{
                // 1. On tourne TOUT le calque de 180° pour que les coordonnées X/Y
                // s'alignent avec l'image de la map qui est elle aussi tournée.
                transform: isRotated ? 'rotate(180deg)' : 'none',
                // Important : On tourne par rapport au centre, comme l'image de la map
                transformOrigin: 'center center'
            }}
        >
            {Object.values(cursors).map((cursor) => (
                <div
                    key={cursor.id}
                    className="absolute top-0 left-0 flex flex-col items-start"
                    style={{
                        // 2. On positionne le curseur
                        // 3. On applique une SECONDE rotation de 180° au curseur lui-même.
                        //    (180° du conteneur + 180° du curseur = 360° -> Le texte revient à l'endroit !)
                        transform: `translate(${cursor.x}px, ${cursor.y}px) ${isRotated ? 'rotate(180deg)' : ''}`,

                        transition: 'transform 0.1s linear',
                        transformOrigin: '0 0'
                    }}
                >
                    <MousePointer2
                        size={24}
                        fill={cursor.color}
                        color="white"
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