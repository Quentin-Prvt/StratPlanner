import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseStrategies, type Folder } from '../hooks/useSupabase';
import { MAP_CONFIGS } from '../utils/mapsRegistry';
import { useAuth } from '../contexts/AuthContext';
import {
    FolderPlus, Trash2, Plus, LogOut, Folder as FolderIcon,
    FolderOpen, Map as MapIcon, User
} from 'lucide-react';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();

    // --- HOOKS ---
    const {
        savedStrategies, folders, isLoading,
        fetchStrategies, fetchFolders, deleteStrategy, createFolder, deleteFolder, moveStrategy
    } = useSupabaseStrategies();

    // --- STATE ---
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // --- INITIALISATION ---
    useEffect(() => {
        fetchStrategies();
        fetchFolders();
    }, [fetchStrategies, fetchFolders]);

    // --- FILTERING ---
    const filteredStrategies = savedStrategies.filter(s =>
        (currentFolderId === null && s.folder_id === null) ||
        (s.folder_id === currentFolderId)
    );

    // --- HANDLERS ---
    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderName.trim()) {
            await createFolder(newFolderName);
            setNewFolderName("");
            setIsCreateFolderModalOpen(false);
        }
    };

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
        <div className="min-h-screen bg-[#121212] text-white flex font-sans">

            {/* --- SIDEBAR --- */}
            <div className="w-72 bg-[#181b1e] border-r border-gray-800 flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-black tracking-wider text-[#ff4655] italic">STRAT PLANNER</h1>
                </div>

                <div className="p-4 border-b border-gray-800 space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Espace de travail</div>
                    <div className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/50">
                        <User size={18} />
                        <span className="font-medium text-sm">Personnel</span>
                    </div>
                </div>

                {/* FOLDERS LIST */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    <div className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                        Fichiers
                    </div>

                    <button
                        onClick={() => setCurrentFolderId(null)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnFolder(e, null)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${currentFolderId === null ? 'bg-gray-800 text-white font-medium' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
                    >
                        <FolderOpen size={18} className={currentFolderId === null ? "text-[#ff4655]" : ""} />
                        <span>Tous les fichiers</span>
                    </button>

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
                                <FolderIcon size={18} className={currentFolderId === folder.id ? "text-[#ff4655]" : ""} />
                                <span className="truncate">{folder.name}</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); if(confirm('Supprimer ce dossier ?')) deleteFolder(folder.id); }}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={() => setIsCreateFolderModalOpen(true)}
                        className="w-full flex items-center gap-2 px-4 py-2 mt-4 text-sm text-gray-500 hover:text-[#ff4655] transition-colors"
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
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1113]">
                {/* Header */}
                <div className="h-20 border-b border-gray-800 flex items-center justify-between px-8 bg-[#181b1e]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {currentFolderId === null ? <FolderOpen size={24} className="text-[#ff4655]" /> : <FolderIcon size={24} className="text-[#ff4655]" />}
                            {currentFolderId === null ? 'Racine' : folders.find((f: Folder) => f.id === currentFolderId)?.name}
                        </h2>
                    </div>

                    <button
                        onClick={() => navigate('/create')}
                        className="bg-[#ff4655] hover:bg-[#e03e4b] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-900/20"
                    >
                        <Plus size={20} /> <span className="hidden sm:inline">Nouvelle Stratégie</span>
                    </button>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto p-8">
                    {isLoading ? (
                        <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4655]"></div></div>
                    ) : filteredStrategies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                            <div className="bg-gray-800/50 p-6 rounded-full mb-4">
                                <MapIcon size={48} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-300 mb-2">Aucune stratégie ici</h3>
                            <p>Créez votre première stratégie pour commencer.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {filteredStrategies.map((strat) => {
                                const mapConfig = MAP_CONFIGS[strat.map_name.toLowerCase()];
                                return (
                                    <div
                                        key={strat.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, strat.id)}
                                        onClick={() => navigate(`/editor/${strat.id}`)}
                                        className="group bg-[#1e2327] rounded-xl overflow-hidden border border-gray-800 hover:border-[#ff4655] transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 flex flex-col"
                                    >
                                        <div className="aspect-video relative overflow-hidden bg-gray-900">
                                            {mapConfig ? (
                                                <img src={mapConfig.src} alt={strat.map_name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-105" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Map inconnue</div>
                                            )}
                                            <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white tracking-widest backdrop-blur-sm border border-white/10">
                                                {strat.map_name}
                                            </div>
                                        </div>
                                        <div className="p-4 flex justify-between items-start flex-1">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-100 truncate text-sm mb-1 group-hover:text-[#ff4655] transition-colors">{strat.title || "Sans titre"}</h3>
                                                <p className="text-[10px] text-gray-500">
                                                    {new Date(strat.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if(confirm('Supprimer ?')) deleteStrategy(strat.id); }}
                                                className="text-gray-600 hover:text-red-500 p-1.5 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL */}
            {isCreateFolderModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm animate-in fade-in duration-200">
                    <form onSubmit={handleCreateFolder} className="bg-[#1e2327] p-6 rounded-xl border border-gray-700 w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Nouveau Dossier</h3>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Nom du dossier..."
                            className="w-full bg-[#121212] border border-gray-700 rounded-lg px-4 py-2 text-white mb-6 focus:border-[#ff4655] focus:outline-none focus:ring-1 focus:ring-[#ff4655]"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsCreateFolderModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Annuler</button>
                            <button type="submit" className="px-4 py-2 bg-[#ff4655] hover:bg-[#e03e4b] text-white rounded-lg font-bold transition-colors shadow-lg shadow-red-900/20">Créer</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};