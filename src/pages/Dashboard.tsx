import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseStrategies, type Folder } from '../hooks/useSupabase';
import { useTeam } from '../hooks/useTeam';
import { MAP_CONFIGS } from '../utils/mapsRegistry';
import {
    FolderPlus, Trash2, Plus, Folder as FolderIcon,
    FolderOpen, Map as MapIcon, User, Users, ShieldAlert,
    AlertTriangle, X
} from 'lucide-react';

type WorkspaceMode = 'personal' | 'team';

export const Dashboard = () => {
    const navigate = useNavigate();

    // --- HOOKS ---
    const { team } = useTeam();
    const {
        savedStrategies, folders, isLoading: strategiesLoading,
        fetchStrategies, fetchFolders, deleteStrategy, createFolder, deleteFolder, moveStrategy
    } = useSupabaseStrategies();

    // --- STATE ---
    const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('personal');
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

    // Modal Création Dossier
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // Modal Suppression (Remplacement du confirm() JS)
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        type: 'strategy' | 'folder' | null;
        id: string | number | null;
        name?: string;
    }>({ isOpen: false, type: null, id: null });

    // --- EFFETS ---
    useEffect(() => {
        const targetTeamId = workspaceMode === 'team' && team ? team.id : null;

        // Si mode équipe sans équipe, on ne charge rien (le UI gère l'affichage vide)
        if (workspaceMode === 'team' && !team) return;

        fetchStrategies(targetTeamId);
        fetchFolders(targetTeamId);

        setCurrentFolderId(null);
    }, [fetchStrategies, fetchFolders, workspaceMode, team]);

    // --- FILTERING ---
    const filteredStrategies = savedStrategies.filter(s =>
        (currentFolderId === null && s.folder_id === null) ||
        (s.folder_id === currentFolderId)
    );

    // --- HANDLERS ---

    // 1. Création de Stratégie
    const handleCreateStrategy = () => {
        if (workspaceMode === 'team' && team) {
            navigate(`/create?teamId=${team.id}`);
        } else {
            navigate('/create');
        }
    };

    // 2. Création de Dossier
    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderName.trim()) {
            const targetTeamId = workspaceMode === 'team' && team ? team.id : null;
            await createFolder(newFolderName, targetTeamId);
            setNewFolderName("");
            setIsCreateFolderModalOpen(false);
        }
    };

    // 3. Gestion Suppression (Ouvre la modale)
    const promptDeleteStrategy = (e: React.MouseEvent, id: string, title: string) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, type: 'strategy', id, name: title });
    };

    const promptDeleteFolder = (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, type: 'folder', id, name });
    };

    const confirmDelete = async () => {
        if (deleteModal.type === 'strategy' && typeof deleteModal.id === 'string') {
            await deleteStrategy(deleteModal.id);
        } else if (deleteModal.type === 'folder' && typeof deleteModal.id === 'number') {
            await deleteFolder(deleteModal.id);
            // Si on était dans ce dossier, on remonte à la racine
            if (currentFolderId === deleteModal.id) setCurrentFolderId(null);
        }
        setDeleteModal({ isOpen: false, type: null, id: null });
    };

    // Drag & Drop
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

    // --- RENDU CONTENU ---
    const renderContent = () => {
        if (workspaceMode === 'team' && !team) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                    <ShieldAlert size={64} className="text-gray-600"/>
                    <h3 className="text-xl font-bold text-white">Aucune équipe rejointe</h3>
                    <p className="max-w-md text-center text-sm">
                        Rejoignez ou créez une équipe dans votre profil pour accéder à l'espace partagé.
                    </p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold"
                    >
                        Gérer mon équipe
                    </button>
                </div>
            );
        }

        if (strategiesLoading) {
            return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4655]"></div></div>;
        }

        if (filteredStrategies.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                    <div className="bg-gray-800/50 p-6 rounded-full mb-4">
                        <MapIcon size={48} className="text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-300 mb-2">
                        {workspaceMode === 'team' ? "Espace d'équipe vide" : "Aucune stratégie ici"}
                    </h3>
                    <p className="mb-6">Créez votre première stratégie pour commencer.</p>
                    <button
                        onClick={handleCreateStrategy}
                        className="bg-[#ff4655] hover:bg-[#e03e4b] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-900/20"
                    >
                        <Plus size={20} /> Créer maintenant
                    </button>
                </div>
            );
        }

        return (
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
                                {strat.team_id && (
                                    <div className="absolute top-2 right-2 bg-blue-600/90 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-white backdrop-blur-sm shadow-sm">
                                        TEAM
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex justify-between items-start flex-1">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-100 truncate text-sm mb-1 group-hover:text-[#ff4655] transition-colors">{strat.title || "Sans titre"}</h3>
                                    <p className="text-[10px] text-gray-500">
                                        {new Date(strat.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => promptDeleteStrategy(e, strat.id, strat.title)}
                                    className="text-gray-600 hover:text-red-500 p-1.5 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Supprimer"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-1 h-[calc(100vh-3.5rem)] overflow-hidden bg-[#121212] text-white font-sans relative">

            {/* SIDEBAR */}
            <div className="w-72 bg-[#181b1e] border-r border-gray-800 flex flex-col shrink-0">
                <div className="p-4 border-b border-gray-800 space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Espace de travail</div>

                    <button
                        onClick={() => setWorkspaceMode('personal')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${workspaceMode === 'personal' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <User size={18} />
                        <span className="font-medium text-sm">Personnel</span>
                    </button>

                    <button
                        onClick={() => setWorkspaceMode('team')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${workspaceMode === 'team' ? 'bg-[#ff4655]/20 text-[#ff4655] border border-[#ff4655]/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Users size={18} />
                        <div className="flex flex-col items-start min-w-0">
                            <span className="font-medium text-sm">Équipe</span>
                            {team && <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{team.name}</span>}
                        </div>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {!(workspaceMode === 'team' && !team) && (
                        <>
                            <div className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 flex justify-between items-center">
                                <span>Fichiers {workspaceMode === 'team' ? "Partagés" : ""}</span>
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
                                        onClick={(e) => promptDeleteFolder(e, folder.id, folder.name)}
                                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1"
                                        title="Supprimer dossier"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => setIsCreateFolderModalOpen(true)}
                                className="w-full flex items-center gap-2 px-4 py-2 mt-4 text-sm text-gray-500 hover:text-[#ff4655] transition-colors border border-dashed border-gray-800 hover:border-[#ff4655]/50 rounded-lg"
                            >
                                <FolderPlus size={16} />
                                <span>Nouveau dossier</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* CONTENU PRINCIPAL */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1113]">
                <div className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#181b1e] shrink-0">
                    <div className="flex items-center gap-3">
                        {currentFolderId === null ? <FolderOpen size={24} className="text-[#ff4655]" /> : <FolderIcon size={24} className="text-[#ff4655]" />}
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                                {workspaceMode === 'team' ? `Espace ${team?.tag || 'Équipe'}` : 'Espace Personnel'}
                            </div>
                            <h2 className="text-xl font-bold text-white">
                                {currentFolderId === null ? 'Racine' : folders.find((f: Folder) => f.id === currentFolderId)?.name}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={handleCreateStrategy}
                        disabled={workspaceMode === 'team' && !team}
                        className="bg-[#ff4655] hover:bg-[#e03e4b] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-900/20"
                    >
                        <Plus size={20} /> <span className="hidden sm:inline">Nouvelle Stratégie</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {renderContent()}
                </div>
            </div>

            {/* MODAL CRÉATION DOSSIER */}
            {isCreateFolderModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm animate-in fade-in duration-200">
                    <form onSubmit={handleCreateFolder} className="bg-[#1e2327] p-6 rounded-xl border border-gray-700 w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">
                            Nouveau Dossier {workspaceMode === 'team' ? "(Équipe)" : "(Perso)"}
                        </h3>
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

            {/* NOUVELLE MODAL DE SUPPRESSION (Style Alert) */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] backdrop-blur-md animate-in fade-in zoom-in duration-200">
                    <div className="bg-[#1e2327] p-6 rounded-xl border border-red-500/30 w-full max-w-sm shadow-2xl relative">
                        <button
                            onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-500/10 p-3 rounded-full mb-4">
                                <AlertTriangle size={32} className="text-red-500" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">Confirmer la suppression</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Êtes-vous sûr de vouloir supprimer <span className="text-white font-bold">"{deleteModal.name}"</span> ?
                                {deleteModal.type === 'folder' && <br/>}
                                {deleteModal.type === 'folder' && <span className="text-xs text-red-400 mt-1 block">Le contenu sera également effacé.</span>}
                                <br />Cette action est irréversible.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                                    className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-red-900/20"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};