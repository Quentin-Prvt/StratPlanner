import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseStrategies } from '../hooks/useSupabase';
import { MAP_CONFIGS } from '../utils/mapsRegistry';
import { ArrowLeft, Check } from 'lucide-react';

export const MapSelector = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // <--- Récupération des paramètres URL
    const teamId = searchParams.get('teamId'); // <--- On cherche l'ID de l'équipe

    const { createNewStrategy } = useSupabaseStrategies();

    const [selectedMap, setSelectedMap] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const mapList = Object.keys(MAP_CONFIGS);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMap || !title.trim()) return;

        setIsCreating(true);

        // CORRECTION ICI : On passe teamId (qui peut être null ou un UUID)
        const newStrat = await createNewStrategy(selectedMap, title, teamId);

        if (newStrat) {
            navigate(`/editor/${newStrat.id}`);
        } else {
            alert("Erreur lors de la création");
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] text-white p-8 font-sans flex flex-col items-center">
            <div className="w-full max-w-5xl">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} /> Retour
                </button>

                <h1 className="text-3xl font-bold mb-2">
                    Nouvelle Stratégie {teamId ? <span className="text-[#ff4655]">(Équipe)</span> : "(Personnel)"}
                </h1>
                <p className="text-gray-400 mb-8">Sélectionnez une carte et donnez un nom à votre stratégie.</p>

                <form onSubmit={handleCreate} className="space-y-8">
                    {/* Input Titre */}
                    <div className="bg-[#1e2327] p-6 rounded-xl border border-gray-800">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Titre de la stratégie</label>
                        <input
                            type="text"
                            autoFocus
                            required
                            placeholder="Ex: Pistol Round A - Rush"
                            className="w-full bg-[#121212] border border-gray-700 rounded-lg p-4 text-lg text-white focus:border-[#ff4655] focus:outline-none transition-colors"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Grille des Maps */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {mapList.map((mapName) => (
                            <div
                                key={mapName}
                                onClick={() => setSelectedMap(mapName)}
                                className={`group relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedMap === mapName ? 'border-[#ff4655] scale-105 shadow-xl shadow-red-900/20' : 'border-transparent hover:border-gray-600 opacity-60 hover:opacity-100'}`}
                            >
                                <img
                                    src={MAP_CONFIGS[mapName].src}
                                    alt={mapName}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                                    <span className="font-bold uppercase tracking-widest">{mapName}</span>
                                </div>
                                {selectedMap === mapName && (
                                    <div className="absolute top-2 right-2 bg-[#ff4655] rounded-full p-1">
                                        <Check size={12} className="text-white" strokeWidth={4} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={!selectedMap || !title.trim() || isCreating}
                            className="bg-[#ff4655] hover:bg-[#e03e4b] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-lg shadow-red-900/20"
                        >
                            {isCreating ? 'Création...' : 'Commencer la stratégie'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};