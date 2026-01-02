import { useNavigate } from 'react-router-dom';
import { AVAILABLE_MAPS, MAPS_REGISTRY } from '../utils/mapsRegistry';
import { useSupabaseStrategies } from '../hooks/useSupabase';

export const Home = () => {
    const navigate = useNavigate();
    const { createNewStrategy } = useSupabaseStrategies();

    const handleCreateStrategy = async (mapName: string) => {
        // 1. Créer une nouvelle entrée dans Supabase
        const newStrat = await createNewStrategy(mapName, `Stratégie ${mapName}`);

        // 2. Si succès, rediriger vers la page d'édition avec l'ID
        if (newStrat && newStrat.id) {
            navigate(`/editor/${newStrat.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#1f2326] p-8 text-white">
            <h1 className="text-3xl font-bold mb-8 text-center">Choisissez une carte</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {AVAILABLE_MAPS.map((mapName) => (
                    <button
                        key={mapName}
                        onClick={() => handleCreateStrategy(mapName)}
                        className="group relative aspect-video bg-gray-800 rounded-xl overflow-hidden border-2 border-transparent hover:border-[#ff4655] transition-all hover:scale-105 shadow-lg"
                    >
                        {/* Image de la map en background */}
                        <img
                            src={MAPS_REGISTRY[mapName]}
                            alt={mapName}
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        />

                        {/* Nom de la map */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors">
                            <span className="text-2xl font-black uppercase tracking-wider drop-shadow-lg">
                                {mapName}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};