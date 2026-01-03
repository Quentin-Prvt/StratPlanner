import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX 1: Import 'Folder' as a type explicitly
import { useSupabaseStrategies, type Folder } from '../hooks/useSupabase';
import { MAP_CONFIGS } from '../utils/mapsRegistry';
import { useAuth } from '../contexts/AuthContext';
// FIX 3: Replaced 'FileMap' with 'Map' (or you can use 'File' or 'MapPin')
import { FolderPlus, Trash2, Plus, LogOut, Folder as FolderIcon, FolderOpen, Map as MapIcon } from 'lucide-react';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const {
        savedStrategies, folders, isLoading,
        fetchStrategies, fetchFolders, deleteStrategy, createFolder, deleteFolder, moveStrategy
    } = useSupabaseStrategies();

    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    useEffect(() => {
        fetchStrategies();
        fetchFolders();
    }, [fetchStrategies, fetchFolders]);

    // Filtrer les stratégies selon le dossier courant
    const filteredStrategies = savedStrategies.filter(s =>
        (currentFolderId === null && s.folder_id === null) || // Racine
        (s.folder_id === currentFolderId) // Dans un dossier
    );

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderName.trim()) {
            await createFolder(newFolderName);
            setNewFolderName("");
            setIsCreateFolderModalOpen(false);
        }
    };

    // Drag and Drop pour déplacer dans un dossier
    const handleDragStart = (e: React.DragEvent, stratId: string) => {
        e.dataTransfer.setData("stratId", stratId);
    };

    const handleDropOnFolder = async (e: React.DragEvent, folderId: number | null) => {
        e.preventDefault();
        const stratId = e.dataTransfer.getData("stratId");
        if (stratId) {
            await moveStrategy(stratId, folderId);
        }
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    return (
        <div className="min-h-screen bg-[#121212] text-white flex">

            {/* --- SIDEBAR (DOSSIERS) --- */}
            <div className="w-64 bg-[#181b1e] border-r border-gray-800 flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-black tracking-wider text-[#ff4655]">STRAT PLANNER</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button
                        onClick={() => setCurrentFolderId(null)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnFolder(e, null)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentFolderId === null ? 'bg-[#ff4655] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <FolderOpen size={20} />
                        <span className="font-medium">Tous les fichiers</span>
                    </button>

                    <div className="pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                        Dossiers
                    </div>

                    {folders.map((folder: Folder) => (
                        <div
                            key={folder.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDropOnFolder(e, folder.id)}
                            className={`group flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-colors ${currentFolderId === folder.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
                        >
                            <button
                                onClick={() => setCurrentFolderId(folder.id)}
                                className="flex items-center gap-3 flex-1 text-left truncate"
                            >
                                <FolderIcon size={18} />
                                <span>{folder.name}</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); if(confirm('Supprimer ce dossier ?')) deleteFolder(folder.id); }}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={() => setIsCreateFolderModalOpen(true)}
                        className="w-full flex items-center gap-2 px-4 py-2 mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors border border-dashed border-gray-700 rounded-lg hover:border-blue-400"
                    >
                        <FolderPlus size={16} />
                        <span>Nouveau dossier</span>
                    </button>
                </div>

                <div className="p-4 border-t border-gray-800">
                    <button onClick={signOut} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-red-500/10 rounded-lg transition-colors">
                        <LogOut size={18} /> Déconnexion
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-16 border-b border-gray-800 flex items-center justify-center px-8 bg-[#121212] relative">
                    <h2 className="text-lg font-medium text-gray-200 absolute left-8">
                        {currentFolderId === null ? 'Toutes les stratégies' : folders.find((f: Folder) => f.id === currentFolderId)?.name}
                    </h2>
                    <button
                        onClick={() => navigate('/create')}
                        className="bg-[#ff4655] hover:bg-[#e03e4b] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-red-900/20 absolute right-8"
                    >
                        <Plus size={20} /> Nouvelle Stratégie
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-8">
                    {isLoading ? (
                        <div className="text-center text-gray-500 mt-20">Chargement...</div>
                    ) : filteredStrategies.length === 0 ? (
                        <div className="text-center mt-20">
                            <div className="bg-gray-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapIcon size={32} className="text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-300 mb-2">C'est vide ici</h3>
                            <p className="text-gray-500">Créez une nouvelle stratégie pour commencer.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredStrategies.map((strat) => {
                                const mapConfig = MAP_CONFIGS[strat.map_name.toLowerCase()];
                                return (
                                    <div
                                        key={strat.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, strat.id)}
                                        onClick={() => navigate(`/editor/${strat.id}`)}
                                        className="bg-[#1e2327] rounded-xl overflow-hidden border border-gray-800 hover:border-[#ff4655] transition-all cursor-pointer group shadow-lg hover:shadow-xl hover:-translate-y-1 relative"
                                    >
                                        <div className="aspect-video relative overflow-hidden bg-gray-900">
                                            {mapConfig ? (
                                                <img src={mapConfig.src} alt={strat.map_name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">Map inconnue</div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs uppercase font-bold text-white backdrop-blur-sm">
                                                {strat.map_name}
                                            </div>
                                        </div>
                                        <div className="p-4 flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-100 truncate pr-2" title={strat.title}>{strat.title}</h3>
                                                <p className="text-xs text-gray-500 mt-1">Modifié le {new Date(strat.updated_at).toLocaleDateString()}</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if(confirm('Supprimer cette stratégie ?')) deleteStrategy(strat.id); }}
                                                className="text-gray-500 hover:text-red-500 p-1 rounded-md hover:bg-gray-800 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Nouveau Dossier */}
            {isCreateFolderModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                    <form onSubmit={handleCreateFolder} className="bg-[#1e2327] p-6 rounded-xl border border-gray-700 w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Nouveau Dossier</h3>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Nom du dossier..."
                            className="w-full bg-[#121212] border border-gray-700 rounded-lg px-4 py-2 text-white mb-6 focus:border-[#ff4655] focus:outline-none"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsCreateFolderModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Annuler</button>
                            <button type="submit" className="px-4 py-2 bg-[#ff4655] hover:bg-[#e03e4b] text-white rounded-lg font-medium">Créer</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};