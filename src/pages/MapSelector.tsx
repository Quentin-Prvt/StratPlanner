import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { AVAILABLE_MAPS, MAP_CONFIGS } from '../utils/mapsRegistry';

export const MapSelector = () => {
    const navigate = useNavigate();
    const [selectedMap, setSelectedMap] = useState<string | null>(null);
    const [title, setTitle] = useState("");

    const handleStart = () => {
        if (selectedMap) {
            // Logique de création (sauvegarde en base ou passage via URL)
            // Pour l'exemple, on passe via l'URL
            navigate(`/create?map=${selectedMap}&title=${encodeURIComponent(title)}`);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#121212] text-white">
            {/* HEADER */}
            <div className="p-6 border-b border-gray-800 shrink-0">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors">
                    <ChevronLeft size={20} className="mr-1" /> Retour
                </button>
                <h1 className="text-3xl font-bold mb-2">Nouvelle Stratégie (Personnel)</h1>
                <p className="text-gray-400">Sélectionnez une carte et donnez un nom à votre stratégie.</p>
            </div>

            {/* CONTENU PRINCIPAL (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Input Titre */}
                    <div className="bg-[#181b1e] p-6 rounded-xl border border-gray-800">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Titre de la stratégie</label>
                        <input
                            type="text"
                            placeholder="Ex: Pistol Round A - Rush"
                            className="w-full bg-[#0f1113] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#ff4655] focus:outline-none transition-colors"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Grille des Maps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                        {AVAILABLE_MAPS.map((mapName) => (
                            <div
                                key={mapName}
                                onClick={() => setSelectedMap(mapName)}
                                className={`group relative aspect-video bg-gray-900 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                                    selectedMap === mapName
                                        ? 'border-[#ff4655] ring-2 ring-[#ff4655]/20 shadow-lg shadow-red-900/20'
                                        : 'border-transparent hover:border-gray-600'
                                }`}
                            >
                                <img
                                    src={MAP_CONFIGS[mapName].src}
                                    alt={mapName}
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                                />
                                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
                                    <span className="text-xl font-bold uppercase tracking-widest text-white">
                                        {mapName}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FOOTER (FIXE EN BAS) */}
            <div className="p-6 border-t border-gray-800 bg-[#181b1e] shrink-0 flex justify-end">
                <button
                    onClick={handleStart}
                    disabled={!selectedMap}
                    className="bg-[#ff4655] hover:bg-[#e03e4b] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold text-lg transition-all shadow-lg shadow-red-900/20"
                >
                    Commencer la stratégie
                </button>
            </div>
        </div>
    );
};