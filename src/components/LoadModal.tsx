import { X, Loader2 } from 'lucide-react';
import type { StrategyRecord } from '../types/canvas';

interface LoadModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    strategies: StrategyRecord[];
    onLoadStrategy: (strat: StrategyRecord) => void;
}

export const LoadModal = ({ isOpen, onClose, isLoading, strategies, onLoadStrategy }: LoadModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] w-full max-w-md rounded-xl shadow-2xl border border-gray-700 flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">Charger une Stratégie</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {isLoading ? (
                        <div className="flex justify-center p-8 text-[#ff4655]">
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : strategies.length === 0 ? (
                        <p className="text-center text-gray-500 p-4">Aucune sauvegarde trouvée.</p>
                    ) : (
                        strategies.map(strat => (
                            <button
                                key={strat.id}
                                onClick={() => onLoadStrategy(strat)}
                                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-[#ff4655] transition-all group"
                            >
                                <div className="text-white font-medium group-hover:text-[#ff4655]">{strat.name}</div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};