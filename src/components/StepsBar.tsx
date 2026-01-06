import  { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, ChevronLeft, ChevronRight, Edit2, Check } from 'lucide-react';
import type { StrategyStep } from '../types/canvas';

interface StepsBarProps {
    steps: StrategyStep[];
    currentIndex: number;
    onStepChange: (index: number) => void;
    onAddStep: () => void;
    onDuplicateStep: () => void;
    onDeleteStep: (index: number) => void;
    onRenameStep: (index: number, newName: string) => void;
}

export const StepsBar = ({ steps, currentIndex, onStepChange, onAddStep, onDuplicateStep, onDeleteStep, onRenameStep }: StepsBarProps) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const MAX_STEPS = 12;

    // --- GESTION RACCOURCIS CLAVIER (Q / D) ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            const key = e.key.toLowerCase();

            if (key === 'q') {
                if (currentIndex > 0) onStepChange(currentIndex - 1);
            } else if (key === 'd') {
                if (currentIndex < steps.length - 1) onStepChange(currentIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, steps.length, onStepChange]);

    // --- ÉDITION ---
    const startEditing = (index: number, currentName: string) => {
        setEditingIndex(index);
        setEditName(currentName);
    };

    const saveEditing = () => {
        if (editingIndex !== null && editName.trim()) {
            onRenameStep(editingIndex, editName);
        }
        setEditingIndex(null);
    };

    return (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#1e2327] border border-gray-700 rounded-xl shadow-2xl p-1.5 flex items-center gap-2 z-40 max-w-[95vw]">

            {/* Flèche Gauche */}
            <button
                onClick={() => currentIndex > 0 && onStepChange(currentIndex - 1)}
                disabled={currentIndex === 0}
                className={`p-1.5 rounded-lg transition-colors ${currentIndex === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
                <ChevronLeft size={20} />
            </button>

            {/* Liste des étapes */}
            <div className="flex items-center gap-1.5">
                {steps.map((step, index) => {
                    const isActive = index === currentIndex;
                    const isEditing = editingIndex === index;

                    return (
                        <div
                            key={step.id}
                            onClick={() => !isEditing && onStepChange(index)}
                            className={`group relative flex items-center justify-center rounded-lg cursor-pointer transition-all border select-none ${
                                isActive
                                    ? 'bg-[#ff4655] border-[#ff4655] text-white px-3 py-1.5 min-w-[120px]' // Style Étape Active (Large)
                                    : 'bg-[#121212] border-gray-800 text-gray-500 hover:text-white hover:border-gray-600 w-8 h-8' // Style Étape Inactive (Petit Carré)
                            }`}
                            title={!isActive ? step.name : ''} // Tooltip sur les inactifs
                        >
                            {isActive ? (
                                // --- CONTENU ÉTAPE ACTIVE ---
                                isEditing ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            autoFocus
                                            className="bg-black/20 text-white px-1 py-0.5 rounded outline-none w-20 text-xs font-bold"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                                            onBlur={saveEditing}
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); saveEditing(); }} className="hover:text-green-300"><Check size={14}/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between w-full gap-3">
                                        <span className="font-bold text-sm truncate max-w-[150px]">{step.name}</span>

                                        <div className="flex items-center gap-1 pl-2 border-l border-white/20">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startEditing(index, step.name); }}
                                                className="hover:bg-black/20 p-1 rounded text-white/80 hover:text-white transition-colors"
                                                title="Renommer"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDuplicateStep(); }}
                                                className="hover:bg-black/20 p-1 rounded text-white/80 hover:text-white transition-colors"
                                                title="Dupliquer"
                                            >
                                                <Copy size={12} />
                                            </button>
                                            {steps.length > 1 && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteStep(index); }}
                                                    className="hover:bg-black/20 p-1 rounded text-white/80 hover:text-white transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            ) : (
                                // --- CONTENU ÉTAPE INACTIVE (Juste le numéro) ---
                                <span className="font-mono text-xs font-bold">{index + 1}</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Flèche Droite */}
            <button
                onClick={() => currentIndex < steps.length - 1 && onStepChange(currentIndex + 1)}
                disabled={currentIndex === steps.length - 1}
                className={`p-1.5 rounded-lg transition-colors ${currentIndex === steps.length - 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
                <ChevronRight size={20} />
            </button>

            {/* Bouton Ajouter (Caché si limite atteinte) */}
            {steps.length < MAX_STEPS && (
                <>
                    <div className="h-6 w-[1px] bg-gray-800 mx-1"></div>
                    <button
                        onClick={onAddStep}
                        className="bg-gray-800 hover:bg-gray-700 text-white p-1.5 rounded-lg transition-colors shrink-0 border border-gray-700"
                        title={`Nouvelle étape (${steps.length}/${MAX_STEPS})`}
                    >
                        <Plus size={18} />
                    </button>
                </>
            )}
        </div>
    );
};