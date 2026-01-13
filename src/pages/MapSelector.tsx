import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseStrategies } from '../hooks/useSupabase';
import { MAP_CONFIGS, AVAILABLE_MAPS } from '../utils/mapsRegistry';
import { ArrowLeft, Check } from 'lucide-react';

export const MapSelector = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();


    const teamId = searchParams.get('teamId');
    const folderParam = searchParams.get('folderId');
    const folderId = folderParam ? parseInt(folderParam, 10) : null;

    const { createNewStrategy } = useSupabaseStrategies();

    const [selectedMap, setSelectedMap] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedMap || !title.trim()) return;

        setIsCreating(true);

        // 2. On passe le folderId à la fonction de création
        // (Assurez-vous que votre hook useSupabaseStrategies accepte ce 4ème argument, voir plus bas)
        const newStrat = await createNewStrategy(selectedMap, title, teamId, folderId);

        if (newStrat) {
            navigate(`/editor/${newStrat.id}`);
        } else {
            alert("Erreur lors de la création");
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#121212] text-white overflow-hidden font-sans">

            {/* HEADER (Fixe) */}
            <div className="p-6 border-b border-gray-800 bg-[#121212] shrink-0 z-10">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft size={20} /> Retour
                </button>
                <h1 className="text-3xl font-bold mb-2">
                    Nouvelle Stratégie {teamId ? <span className="text-[#ff4655]">(Équipe)</span> : "(Personnel)"}
                </h1>
                <p className="text-gray-400">Sélectionnez une carte et donnez un nom à votre stratégie.</p>
            </div>

            {/* CONTENU (Scrollable avec Scrollbar Custom) */}
            <div className="
                flex-1 overflow-y-auto p-6
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-gray-700
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:hover:bg-gray-600
            ">
                <div className="max-w-7xl mx-auto space-y-8 pb-32">

                    {/* Input Titre */}
                    <div className="bg-[#1e2327] p-6 rounded-xl border border-gray-800 shadow-sm">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Titre de la stratégie</label>
                        <input
                            type="text"
                            autoFocus
                            required
                            placeholder="Ex: Pistol Round A - Rush"
                            className="w-full bg-[#121212] border border-gray-700 rounded-lg p-4 text-lg text-white focus:border-[#ff4655] focus:outline-none transition-colors placeholder-gray-600"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Grille des Maps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {AVAILABLE_MAPS.map((mapName) => (
                            <div
                                key={mapName}
                                onClick={() => setSelectedMap(mapName)}
                                className={`group relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                                    selectedMap === mapName
                                        ? 'border-[#ff4655] ring-4 ring-[#ff4655]/20 shadow-xl shadow-red-900/20 opacity-100'
                                        : 'border-transparent hover:border-gray-600 opacity-60 hover:opacity-100'
                                }`}
                            >
                                <img
                                    src={MAP_CONFIGS[mapName].src}
                                    alt={mapName}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-4">
                                    <span className="font-bold uppercase tracking-widest text-lg drop-shadow-md">{mapName}</span>
                                </div>
                                {selectedMap === mapName && (
                                    <div className="absolute top-2 right-2 bg-[#ff4655] text-white p-1.5 rounded-full shadow-lg animate-in zoom-in duration-200">
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FOOTER (Fixe en bas) */}
            <div className="p-6 border-t border-gray-800 bg-[#1e2327] shrink-0 flex justify-end items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                <button
                    onClick={() => handleCreate()}
                    disabled={!selectedMap || !title.trim() || isCreating}
                    className="bg-[#ff4655] hover:bg-[#e03e4b] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-lg shadow-red-900/20 active:scale-95"
                >
                    {isCreating ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                            Création...
                        </>
                    ) : 'Commencer la stratégie'}
                </button>
            </div>
        </div>
    );
};