
import { Plus, Trash2, StickyNote, } from 'lucide-react';
import type { StrategyNote } from '../types/canvas';

interface NotesSidebarProps {
    notes: StrategyNote[];
    onAddNote: () => void;
    onEditNote: (note: StrategyNote) => void; // Nouvelle prop
    onDeleteNote: (id: string) => void;
}

export const NotesSidebar = ({ notes, onAddNote, onEditNote, onDeleteNote }: NotesSidebarProps) => {
    return (
        <div className="flex flex-col h-full bg-[#181b1e] border-l border-gray-800 w-80 shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#1e2327]">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <StickyNote size={18} className="text-yellow-500" />
                    Notes
                </h3>
                <button onClick={onAddNote} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors" title="Ajouter">
                    <Plus size={16} />
                </button>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notes.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10 text-sm italic">
                        Aucune note.<br/>Cliquez sur + pour commencer.
                    </div>
                ) : (
                    notes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => onEditNote(note)} // Clic = Édition
                            className="group relative rounded-lg p-3 border border-gray-700 hover:border-yellow-500/50 transition-all cursor-pointer hover:bg-[#2a2e33]"
                            style={{
                                backgroundColor: note.backgroundColor || '#23272b' // Fond par défaut gris foncé si pas de couleur
                            }}
                        >
                            <div style={{
                                color: note.color || '#fff',
                                fontSize: `${note.fontSize || 16}px`,
                                fontWeight: (note.fontWeight as any) || 'normal',
                                fontStyle: (note.fontStyle as any) || 'normal',
                                textDecoration: note.textDecoration || 'none',
                                whiteSpace: 'pre-wrap', // Garde les retours à la ligne
                                wordBreak: 'break-word'
                            }}>
                                {note.text || "Note vide..."}
                            </div>

                            {/* Bouton Supprimer (visible au survol) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all transform scale-75 group-hover:scale-100"
                                title="Supprimer"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};