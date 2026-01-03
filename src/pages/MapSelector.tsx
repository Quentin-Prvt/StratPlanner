import { useNavigate } from 'react-router-dom';
import { AVAILABLE_MAPS, MAP_CONFIGS } from '../utils/mapsRegistry';
import { useSupabaseStrategies } from '../hooks/useSupabase';

export const MapSelector = () => {
    const navigate = useNavigate();
    const { createNewStrategy } = useSupabaseStrategies();

    const handleCreateStrategy = async (mapName: string) => {
        const newStrat = await createNewStrategy(mapName, `Stratégie ${mapName}`);
        if (newStrat && newStrat.id) {
            navigate(`/editor/${newStrat.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#1f2326] p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white flex items-center gap-2">
                        ← Retour au Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-center">Nouvelle Stratégie : Choisissez une carte</h1>
                    <div className="w-24"></div> {/* Spacer */}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {AVAILABLE_MAPS.map((mapName) => (
                        <button
                            key={mapName}
                            onClick={() => handleCreateStrategy(mapName)}
                            className="group relative aspect-video bg-gray-800 rounded-xl overflow-hidden border-2 border-transparent hover:border-[#ff4655] transition-all hover:scale-105 shadow-lg"
                        >
                            <img
                                src={MAP_CONFIGS[mapName].src}
                                alt={mapName}
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors">
                                <span className="text-2xl font-black uppercase tracking-wider drop-shadow-lg">
                                    {mapName}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};