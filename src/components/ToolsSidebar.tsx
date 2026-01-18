import React, { useState } from 'react';
import {
    Pencil, Eraser, Minus, MoveUpRight, ArrowBigRightDash, Square,
    Hand, MousePointer2, Settings, Hammer, Type, Trash2, FolderOpen, RefreshCcw,
    RotateCw, MessageSquareText, UserX, ZapOff, XCircle, FileText, Plus, ExternalLink,
    Eye
} from 'lucide-react';

import type { ToolType, StrokeType } from '../types/canvas';


interface StrategyRef {
    id: string;
    title: string;
    folder_id: number | null;
    map_name: string;
}

interface ToolsSidebarProps {
    currentTool: ToolType | 'tools' | 'settings' | 'text'| null;
    setTool: (t: ToolType | 'tools' | 'settings' | 'text'| null) => void;
    strokeType: StrokeType;
    setStrokeType: (t: StrokeType) => void;
    color: string;
    setColor: (c: string) => void;
    opacity: number;
    setOpacity: (o: number) => void;
    thickness: number;
    setThickness: (t: number) => void;
    selectedAgent: string;
    setSelectedAgent: (a: string) => void;
    onSave: () => void;
    onLoad: () => void;

    // ZONES & CALLS
    showZones: boolean;
    setShowZones: (b: boolean) => void;
    showMapCalls: boolean;
    setShowMapCalls: (b: boolean) => void;

    iconSize: number;
    setIconSize: (s: number) => void;

    // Rotation
    isRotated: boolean;
    setIsRotated: (b: boolean) => void;

    // Actions
    onClearAll: () => void;
    onClearAgents: () => void;
    onClearAbilities: () => void;
    onClearText: () => void;
    onClearDrawings: () => void;

    folders: { id: string, name: string }[];
    currentFolderId: string;
    onFolderChange: (folderId: string) => void;
    onDeleteStrategy: () => void;

    // --- NOUVELLES PROPS ---
    strategies: StrategyRef[];
    currentStrategyId: string;
    onNavigate: (id: string) => void;
    onCreateInFolder: () => void;
}

export const ToolsSidebar = ({
                                 currentTool, setTool,
                                 strokeType, setStrokeType,
                                 color, setColor,
                                 opacity, setOpacity,
                                 thickness, setThickness,
                                 selectedAgent, setSelectedAgent,
                                 showZones, setShowZones,
                                 showMapCalls, setShowMapCalls,
                                 iconSize, setIconSize,
                                 isRotated, setIsRotated,

                                 // Actions de nettoyage
                                 onClearAll,
                                 onClearAgents,
                                 onClearAbilities,
                                 onClearText,
                                 onClearDrawings,

                                 folders, currentFolderId, onFolderChange, onDeleteStrategy,

                                 // Nouvelles props
                                 strategies, currentStrategyId, onNavigate, onCreateInFolder
                             }: ToolsSidebarProps) => {

    const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

    const colors = ['#ffffff', '#000000', '#ef4444', '#ec4899', '#facc15', '#84cc16', '#14532d', '#3b82f6', '#8b5cf6', '#713f12'];
    const agents = ['astra', 'breach', 'brimstone', 'chamber', 'clove', 'cypher', 'deadlock', 'fade', 'gekko', 'harbor', 'iso', 'jett', 'kayo', 'killjoy', 'neon', 'omen', 'phoenix', 'raze', 'reyna', 'sage', 'skye', 'sova','tejo','veto', 'viper', 'vyse','waylay', 'yoru'];
    const abilities = ['c', 'q', 'e', 'x'];

    // Ajout de l'icône Vision ici avec le composant Eye
    const mapIcons = [
        { id: 'vision', label: 'Vision', icon: <Eye size={24} className="text-blue-400" /> },
        { id: 'danger', label: 'Danger', src: '/icons/danger.png' },
        { id: 'star', label: 'Important', src: '/icons/star.png' },
        { id: 'target', label: 'Cible', src: '/icons/target.png' },
        { id: 'spike', label: 'Spike', src: '/icons/spike.png' }
    ];

    const handleToolClick = (tool: any) => currentTool === tool ? setTool(null) : setTool(tool);
    const activatePen = () => { setTool('pen'); setThickness(4); };
    const activateEraser = () => { setTool('eraser'); setThickness(30); };
    const isDrawingMode = currentTool === 'pen' || currentTool === 'eraser';

    const handleSafeAction = (target: string, action: () => void) => {
        if (confirmTarget === target) {
            action();
            setConfirmTarget(null);
        } else {
            setConfirmTarget(target);
            setTimeout(() => setConfirmTarget(prev => prev === target ? null : prev), 3000);
        }
    };

    const handleDragStart = (e: React.DragEvent, type: 'agent' | 'ability' | 'icon', name: string) => {
        const dragData = JSON.stringify({ type, name });
        e.dataTransfer.setData("application/json", dragData);
        e.dataTransfer.effectAllowed = "copy";
        if (type === 'agent') setSelectedAgent(name);
    };

    const getDeleteButtonStyle = (targetName: string) => {
        const isConfirming = confirmTarget === targetName;
        return `flex items-center justify-center gap-2 p-2 rounded text-xs transition-all duration-200 border ${
            isConfirming
                ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500 animate-pulse font-bold'
                : 'bg-slate-700 hover:bg-slate-600 text-gray-300 border-transparent hover:border-slate-500'
        }`;
    };

    // --- FILTRAGE DES STRATÉGIES DU DOSSIER COURANT ---
    const filteredStrategies = strategies.filter(s => {
        if (currentFolderId === "") return s.folder_id === null;
        return s.folder_id?.toString() === currentFolderId;
    });

    return (
        <div className="
            flex flex-col gap-4 p-4 bg-[#1e293b] rounded-xl border border-gray-700 shadow-xl w-full lg:w-72 text-white
            overflow-y-auto max-h-full pointer-events-auto
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-700
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:hover:bg-gray-600
        ">

            {/* HEADER + ROTATION */}
            <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold">Éditeur</h2>
                <button
                    onClick={() => setIsRotated(!isRotated)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                        isRotated
                            ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                            : 'bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30'
                    }`}
                    title={isRotated ? "Mode Attaque (Rotaté)" : "Mode Défense (Normal)"}
                >
                    <RotateCw size={14} className={`transition-transform duration-500 ${isRotated ? "rotate-180" : ""}`} />
                    <span>{isRotated ? "ATK" : "DEF"}</span>
                </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2">
                <ToolButton active={currentTool === 'cursor'} onClick={() => handleToolClick('cursor')} icon={<MousePointer2 size={20} />} title="Déplacer" />
                <ToolButton active={isDrawingMode} onClick={() => handleToolClick('pen')} icon={<Pencil size={20} />} title="Dessiner" />
                <ToolButton active={currentTool === 'tools' || currentTool === 'text'} onClick={() => handleToolClick('tools')} icon={<Hammer size={20} />} title="Outils" />
                <ToolButton active={currentTool === 'settings'} onClick={() => handleToolClick('settings')} icon={<Settings size={20} />} title="Paramètres" />
            </div>

            {currentTool === null && (
                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 flex items-center gap-3 text-sm text-blue-200">
                    <Hand size={18} /><span>Mode Navigation.<br/>Molette pour zoomer/bouger.</span>
                </div>
            )}

            {/* DESSIN */}
            {isDrawingMode && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="flex bg-slate-900 p-1 rounded-lg">
                        <button onClick={activatePen} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${currentTool === 'pen' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><Pencil size={14} /> Crayon</button>
                        <button onClick={activateEraser} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${currentTool === 'eraser' ? 'bg-red-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}><Eraser size={14} /> Gomme</button>
                    </div>
                    {currentTool === 'pen' && (
                        <>
                            <div className="flex items-center gap-3"><span className="text-xs font-medium w-12 text-gray-400">Style</span><div className="grid grid-cols-5 gap-1 flex-1"><SmallButton active={strokeType === 'solid'} onClick={() => setStrokeType('solid')} icon={<Minus size={16} className="-rotate-45" />} /><SmallButton active={strokeType === 'dashed'} onClick={() => setStrokeType('dashed')} icon={<Minus size={16} className="border-dashed border-b-2 border-current w-4 h-0" />} /><SmallButton active={strokeType === 'arrow'} onClick={() => setStrokeType('arrow')} icon={<MoveUpRight size={16} />} /><SmallButton active={strokeType === 'dashed-arrow'} onClick={() => setStrokeType('dashed-arrow')} icon={<ArrowBigRightDash size={16} className="opacity-75" />} /><SmallButton active={strokeType === 'rect'} onClick={() => setStrokeType('rect')} icon={<Square size={16} />} /></div></div>
                            <div className="flex items-start gap-3"><span className="text-xs font-medium w-12 pt-1 text-gray-400">Couleur</span><div className="flex flex-wrap gap-2 flex-1">{colors.map((c) => (<button key={c} onClick={() => setColor(c)} className={`w-5 h-5 rounded border transition-transform hover:scale-110 ${color === c ? 'border-white ring-2 ring-blue-500' : 'border-transparent'}`} style={{ backgroundColor: c }} />))}</div></div>
                        </>
                    )}
                    <div className="space-y-3 pt-2 border-t border-slate-700/50">
                        {currentTool === 'pen' && (<div className="flex items-center gap-3"><span className="text-xs font-medium w-12 text-gray-400">Opacité</span><input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="flex-1 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]" /></div>)}
                        <div className="flex items-center gap-3"><span className="text-xs font-medium w-12 text-gray-400">Taille</span><div className="flex-1 flex items-center gap-2"><input type="range" min={currentTool === 'eraser' ? 10 : 1} max={currentTool === 'eraser' ? 200 : 30} value={thickness} onChange={(e) => setThickness(parseInt(e.target.value))} className="flex-1 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]" /><span className="text-xs text-gray-300 w-8 text-right">{thickness}px</span></div></div>
                    </div>
                </div>
            )}

            {/* OUTILS - MODIFIÉ POUR GÉRER L'ICÔNE VISION */}
            {(currentTool === 'tools' || currentTool === 'text') && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300 bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col gap-3">
                    <span className="text-sm font-medium text-gray-400 border-b border-gray-700 pb-2">Outils tactiques</span>
                    <button onClick={() => setTool('text')} className={`flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all ${currentTool === 'text' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-gray-300 hover:bg-slate-700 hover:text-white'}`}><Type size={18} /> Zone de Texte</button>

                    <div className="flex flex-col gap-2 mt-1">
                        <span className="text-xs font-medium text-gray-500 uppercase">Objets (Glisser-déposer)</span>
                        <div className="grid grid-cols-4 gap-2">
                            {mapIcons.map((iconItem) => (
                                <div
                                    key={iconItem.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'icon', iconItem.id)}
                                    className="aspect-square bg-slate-900 p-2 rounded-lg border border-slate-700 hover:border-blue-500 hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-all flex items-center justify-center group relative"
                                    title={iconItem.label}
                                >
                                    {/* CONDITION : Si on a une icône React, on l'affiche, sinon on affiche l'image SRC */}
                                    {iconItem.icon ? (
                                        iconItem.icon
                                    ) : (
                                        <img
                                            src={iconItem.src}
                                            alt={iconItem.label}
                                            className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                                            onError={(e) => {e.currentTarget.style.display = 'none'}}
                                        />
                                    )}
                                    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{iconItem.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PARAMÈTRES (ORGANISATION & NAVIGATION) */}
            {currentTool === 'settings' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 duration-300 bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="text-sm font-medium text-gray-400 border-b border-gray-700 pb-2">Affichage</span>

                    <button onClick={() => setShowZones(!showZones)} className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors ${showZones ? 'bg-gray-700 text-white' : 'bg-slate-900 text-gray-400 hover:bg-slate-700'}`}><span className="text-xs font-bold uppercase">Zones de portée</span><div className={`w-3 h-3 rounded-full transition-all ${showZones ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'}`} /></button>

                    <button onClick={() => setShowMapCalls(!showMapCalls)} className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors ${showMapCalls ? 'bg-gray-700 text-white' : 'bg-slate-900 text-gray-400 hover:bg-slate-700'}`}>
                        <div className="flex items-center gap-2"><MessageSquareText size={14} /><span className="text-xs font-bold uppercase">Afficher Calls</span></div>
                        <div className={`w-3 h-3 rounded-full transition-all ${showMapCalls ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-gray-600'}`} />
                    </button>

                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-700"><div className="flex justify-between items-center text-gray-400 text-xs uppercase font-bold"><span>Taille Icônes</span><span className="text-white">{iconSize}px</span></div><input type="range" min="20" max="60" step="2" value={iconSize} onChange={(e) => setIconSize(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" /></div>

                    {/* NETTOYAGE RAPIDE */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-700">
                        <span className="text-xs font-bold uppercase text-gray-500 mb-1">Nettoyage Rapide</span>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleSafeAction('agents', onClearAgents)} className={getDeleteButtonStyle('agents')} title="Supprimer tous les agents"><UserX size={14} />{confirmTarget === 'agents' ? "Confirmer ?" : "Agents"}</button>
                            <button onClick={() => handleSafeAction('abilities', onClearAbilities)} className={getDeleteButtonStyle('abilities')} title="Supprimer tous les sorts"><ZapOff size={14} />{confirmTarget === 'abilities' ? "Confirmer ?" : "Sorts"}</button>
                            <button onClick={() => handleSafeAction('drawings', onClearDrawings)} className={getDeleteButtonStyle('drawings')} title="Supprimer tous les dessins"><Pencil size={14} />{confirmTarget === 'drawings' ? "Confirmer ?" : "Dessins"}</button>
                            <button onClick={() => handleSafeAction('text', onClearText)} className={getDeleteButtonStyle('text')} title="Supprimer tous les textes"><Type size={14} />{confirmTarget === 'text' ? "Confirmer ?" : "Textes"}</button>
                        </div>
                        <button onClick={() => handleSafeAction('all', onClearAll)} className={`flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-xs transition-all mt-1 border ${confirmTarget === 'all' ? 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse border-orange-500' : 'bg-red-900/30 border-red-900/50 hover:bg-red-900/50 text-red-200'}`}>{confirmTarget === 'all' ? <RefreshCcw size={14} className="animate-spin" /> : <Trash2 size={14} />}{confirmTarget === 'all' ? "CONFIRMER TOUT EFFACER ?" : "Tout effacer (Reset)"}</button>
                    </div>

                    {/* ORGANISATION & NAVIGATION */}
                    <div className="flex flex-col gap-3 pt-2 border-t border-gray-700">
                        <span className="text-sm font-medium text-gray-400 pb-1">Organisation</span>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2"><FolderOpen size={12} /> Dossier actuel</label>
                            <select value={currentFolderId} onChange={(e) => onFolderChange(e.target.value)} className="w-full bg-slate-900 text-white text-sm rounded-lg border border-slate-700 p-2 focus:ring-2 focus:ring-blue-500 outline-none hover:bg-slate-800">
                                <option value="">Aucun dossier</option>
                                {folders.map((folder) => (<option key={folder.id} value={folder.id}>{folder.name}</option>))}
                            </select>
                        </div>

                        {/* --- LISTE DES AUTRES STRATÉGIES DU DOSSIER --- */}
                        <div className="flex flex-col gap-1.5 mt-1">
                            <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                                <FileText size={12} /> Autres stratégies
                            </label>

                            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 custom-scrollbar">
                                {filteredStrategies.length <= 1 ? (
                                    <span className="text-xs text-gray-500 italic p-1">Aucune autre stratégie</span>
                                ) : (
                                    filteredStrategies.map(strat => (
                                        <button
                                            key={strat.id}
                                            onClick={() => onNavigate(strat.id)}
                                            className={`text-left text-xs px-2 py-1.5 rounded truncate flex items-center justify-between group ${strat.id === currentStrategyId ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30' : 'text-gray-400 hover:bg-slate-700 hover:text-white'}`}
                                        >
                                            <span className="truncate">{strat.title || "Sans titre"}</span>
                                            {strat.id !== currentStrategyId && <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"/>}
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* BOUTON CRÉER DANS LE DOSSIER */}
                            <button
                                onClick={onCreateInFolder}
                                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded-lg font-medium text-xs transition-colors border border-slate-600 hover:border-slate-500 mt-1"
                            >
                                <Plus size={14} /> Nouvelle stratégie ici
                            </button>
                        </div>

                        <button onClick={onDeleteStrategy} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-red-900/20 mt-4 border border-red-500"><XCircle size={16} /> Supprimer la stratégie</button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-300 mt-2">
                <span className="text-sm font-medium text-gray-400">Compétences ({selectedAgent})</span>
                <div className="grid grid-cols-4 gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
                    {abilities.map(key => (
                        <div key={key} draggable onDragStart={(e) => handleDragStart(e, 'ability', `${selectedAgent}_${key}`)} className="aspect-square p-1 rounded-md border border-slate-600 hover:border-white hover:bg-slate-700 cursor-grab active:cursor-grabbing transition-all flex items-center justify-center relative group" title={`Compétence ${key.toUpperCase()}`}>
                            <img src={`/abilities/${selectedAgent}_${key}_icon.png`} alt={key} className="w-full h-full object-contain pointer-events-none" onError={(e) => {e.currentTarget.src = 'https://placehold.co/40x40/black/white?text=?'}} />
                            <span className="absolute bottom-0 right-0 bg-black/70 text-[10px] px-1 rounded text-white font-mono">{key.toUpperCase()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section Agents */}
            <div className="flex flex-col gap-2 flex-1 min-h-0">
                <span className="text-sm font-medium text-gray-400">Agents</span>
                <div className="
                    grid grid-cols-4 gap-2 bg-slate-800 p-3 rounded-lg border border-slate-700 overflow-y-auto
                    [&::-webkit-scrollbar]:w-2
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-gray-700
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:hover:bg-gray-600
                ">
                    {agents.map(agent => (
                        <div key={agent} draggable={true} onDragStart={(e) => handleDragStart(e, 'agent', agent)} onClick={() => { setSelectedAgent(agent); setTool('agent'); }} className={`aspect-square p-1 rounded-md border-2 cursor-grab active:cursor-grabbing transition-all ${selectedAgent === agent ? 'border-[#ff4655] bg-slate-700' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700'}`}>
                            <img src={`/agents/${agent}.png`} alt={agent} className="w-full h-full object-contain pointer-events-none" onError={(e) => {e.currentTarget.src = 'https://placehold.co/40x40/black/white?text=?'}} />
                        </div>
                    ))}
                </div>
            </div></div>
    );
};

const ToolButton = ({ active, onClick, icon, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, title?: string }) => (<button onClick={onClick} title={title} className={`p-3 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-[#0ea5e9] text-white shadow-lg shadow-blue-900/50' : 'bg-slate-700 hover:bg-slate-600 text-gray-300'}`}>{icon}</button>);
const SmallButton = ({ active, onClick, icon, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, title?: string }) => (<button onClick={onClick} title={title} className={`w-8 h-8 rounded flex items-center justify-center transition-all ${active ? 'bg-[#0ea5e9] text-white' : 'bg-slate-700 hover:bg-slate-600 text-gray-400'}`}>{icon}</button>);