import React, { useState } from 'react'; // Ajout de useState
import {
    Pencil, Eraser, Minus, MoveUpRight, ArrowBigRightDash, Square,
    Hand, MousePointer2, Settings, Hammer, Type, Trash2, FolderOpen, RefreshCcw // Ajout de RefreshCcw pour l'icone reset
} from 'lucide-react';

import type { ToolType, StrokeType } from '../types/canvas';

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
    showZones: boolean;
    setShowZones: (b: boolean) => void;
    iconSize: number;
    setIconSize: (s: number) => void;

    // Actions
    onClearAll: () => void; // <--- NOUVELLE PROP
    folders: { id: string, name: string }[];
    currentFolderId: string;
    onFolderChange: (folderId: string) => void;
    onDeleteStrategy: () => void;
}

export const ToolsSidebar = ({
                                 currentTool, setTool,
                                 strokeType, setStrokeType,
                                 color, setColor,
                                 opacity, setOpacity,
                                 thickness, setThickness,
                                 selectedAgent, setSelectedAgent,
                                 showZones, setShowZones,
                                 iconSize, setIconSize,
                                 onClearAll, // <--- Récupération de la prop
                                 folders, currentFolderId, onFolderChange, onDeleteStrategy
                             }: ToolsSidebarProps) => {

    // État pour la confirmation du bouton "Tout effacer"
    const [confirmClear, setConfirmClear] = useState(false);

    const colors = ['#ffffff', '#000000', '#ef4444', '#ec4899', '#facc15', '#84cc16', '#14532d', '#3b82f6', '#8b5cf6', '#713f12'];
    const agents = ['astra', 'breach', 'brimstone', 'chamber', 'clove', 'cypher', 'deadlock', 'fade', 'gekko', 'harbor', 'iso', 'jett', 'kayo', 'killjoy', 'neon', 'omen', 'phoenix', 'raze', 'reyna', 'sage', 'skye', 'sova','tejo','veto', 'viper', 'vyse','waylay', 'yoru'];
    const abilities = ['c', 'q', 'e', 'x'];
    const mapIcons = [{ id: 'danger', label: 'Danger', src: '/icons/danger.png' }, { id: 'star', label: 'Important', src: '/icons/star.png' }, { id: 'target', label: 'Cible', src: '/icons/target.png' }, { id: 'spike', label: 'Spike', src: '/icons/spike.png' }];

    const handleToolClick = (tool: any) => currentTool === tool ? setTool(null) : setTool(tool);
    const activatePen = () => { setTool('pen'); setThickness(4); };
    const activateEraser = () => { setTool('eraser'); setThickness(30); };
    const isDrawingMode = currentTool === 'pen' || currentTool === 'eraser';

    // Gestion du clic "Tout effacer" avec confirmation
    const handleClearClick = () => {
        if (confirmClear) {
            onClearAll();
            setConfirmClear(false);
        } else {
            setConfirmClear(true);
            // Annule la confirmation après 3 secondes si pas de clic
            setTimeout(() => setConfirmClear(false), 3000);
        }
    };

    const handleDragStart = (e: React.DragEvent, type: 'agent' | 'ability' | 'icon', name: string) => {
        const dragData = JSON.stringify({ type, name });
        e.dataTransfer.setData("application/json", dragData);
        e.dataTransfer.effectAllowed = "copy";
        if (type === 'agent') setSelectedAgent(name);
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-[#1e293b] rounded-xl border border-gray-700 shadow-xl w-full lg:w-72 text-white overflow-y-auto max-h-full pointer-events-auto">
            <div className="flex justify-between items-center mb-1"><h2 className="text-xl font-bold">Éditeur</h2></div>

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

            {isDrawingMode && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="flex bg-slate-900 p-1 rounded-lg">
                        <button onClick={activatePen} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${currentTool === 'pen' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><Pencil size={14} /> Crayon</button>
                        <button onClick={activateEraser} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-all ${currentTool === 'eraser' ? 'bg-red-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}><Eraser size={14} /> Gomme</button>
                    </div>
                    {currentTool === 'pen' && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium w-12 text-gray-400">Style</span>
                            <div className="grid grid-cols-5 gap-1 flex-1">
                                <SmallButton active={strokeType === 'solid'} onClick={() => setStrokeType('solid')} icon={<Minus size={16} className="-rotate-45" />} />
                                <SmallButton active={strokeType === 'dashed'} onClick={() => setStrokeType('dashed')} icon={<Minus size={16} className="border-dashed border-b-2 border-current w-4 h-0" />} />
                                <SmallButton active={strokeType === 'arrow'} onClick={() => setStrokeType('arrow')} icon={<MoveUpRight size={16} />} />
                                <SmallButton active={strokeType === 'dashed-arrow'} onClick={() => setStrokeType('dashed-arrow')} icon={<ArrowBigRightDash size={16} className="opacity-75" />} />
                                <SmallButton active={strokeType === 'rect'} onClick={() => setStrokeType('rect')} icon={<Square size={16} />} />
                            </div>
                        </div>
                    )}
                    {currentTool === 'pen' && (
                        <div className="flex items-start gap-3">
                            <span className="text-xs font-medium w-12 pt-1 text-gray-400">Couleur</span>
                            <div className="flex flex-wrap gap-2 flex-1">
                                {colors.map((c) => (
                                    <button key={c} onClick={() => setColor(c)} className={`w-5 h-5 rounded border transition-transform hover:scale-110 ${color === c ? 'border-white ring-2 ring-blue-500' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-3 pt-2 border-t border-slate-700/50">
                        {currentTool === 'pen' && (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium w-12 text-gray-400">Opacité</span>
                                <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="flex-1 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]" />
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium w-12 text-gray-400">Taille</span>
                            <div className="flex-1 flex items-center gap-2">
                                <input type="range" min={currentTool === 'eraser' ? 10 : 1} max={currentTool === 'eraser' ? 200 : 30} value={thickness} onChange={(e) => setThickness(parseInt(e.target.value))} className="flex-1 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]" />
                                <span className="text-xs text-gray-300 w-8 text-right">{thickness}px</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(currentTool === 'tools' || currentTool === 'text') && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300 bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col gap-3">
                    <span className="text-sm font-medium text-gray-400 border-b border-gray-700 pb-2">Outils tactiques</span>
                    <button onClick={() => setTool('text')} className={`flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all ${currentTool === 'text' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-gray-300 hover:bg-slate-700 hover:text-white'}`}><Type size={18} /> Zone de Texte</button>
                    <div className="flex flex-col gap-2 mt-1"><span className="text-xs font-medium text-gray-500 uppercase">Objets (Glisser-déposer)</span><div className="grid grid-cols-4 gap-2">{mapIcons.map((icon) => (<div key={icon.id} draggable onDragStart={(e) => handleDragStart(e, 'icon', icon.id)} className="aspect-square bg-slate-900 p-2 rounded-lg border border-slate-700 hover:border-blue-500 hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-all flex items-center justify-center group relative" title={icon.label}><img src={icon.src} alt={icon.label} className="w-full h-full object-contain pointer-events-none drop-shadow-md" onError={(e) => {e.currentTarget.style.display = 'none'}} /><span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{icon.label}</span></div>))}</div></div>
                </div>
            )}

            {currentTool === 'settings' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 duration-300 bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="text-sm font-medium text-gray-400 border-b border-gray-700 pb-2">Affichage</span>
                    <button onClick={() => setShowZones(!showZones)} className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors ${showZones ? 'bg-gray-700 text-white' : 'bg-slate-900 text-gray-400 hover:bg-slate-700'}`}><span className="text-xs font-bold uppercase">Zones de portée</span><div className={`w-3 h-3 rounded-full transition-all ${showZones ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'}`} /></button>
                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-700"><div className="flex justify-between items-center text-gray-400 text-xs uppercase font-bold"><span>Taille Icônes</span><span className="text-white">{iconSize}px</span></div><input type="range" min="20" max="60" step="2" value={iconSize} onChange={(e) => setIconSize(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500" /></div>

                    {/* SECTION DOSSIER & SUPPRESSION */}
                    <div className="flex flex-col gap-3 pt-2 border-t border-gray-700">
                        <span className="text-sm font-medium text-gray-400 pb-1">Organisation</span>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                                <FolderOpen size={12} /> Dossier
                            </label>
                            <select
                                value={currentFolderId}
                                onChange={(e) => onFolderChange(e.target.value)}
                                className="w-full bg-slate-900 text-white text-sm rounded-lg border border-slate-700 p-2 focus:ring-2 focus:ring-blue-500 outline-none hover:bg-slate-800"
                            >
                                <option value="">Aucun dossier</option>
                                {folders.map((folder) => (
                                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* --- NOUVEAU BOUTON : TOUT EFFACER --- */}
                        <button
                            onClick={handleClearClick}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-all mt-2 ${
                                confirmClear
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse'
                                    : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                            }`}
                        >
                            <RefreshCcw size={16} className={confirmClear ? "animate-spin" : ""} />
                            {confirmClear ? "Confirmer l'effacement ?" : "Tout effacer sur la carte"}
                        </button>

                        <button onClick={onDeleteStrategy} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-red-900/20">
                            <Trash2 size={16} /> Supprimer la stratégie
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-300 mt-2"><span className="text-sm font-medium text-gray-400">Compétences ({selectedAgent})</span><div className="grid grid-cols-4 gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">{abilities.map(key => (<div key={key} draggable onDragStart={(e) => handleDragStart(e, 'ability', `${selectedAgent}_${key}`)} className="aspect-square p-1 rounded-md border border-slate-600 hover:border-white hover:bg-slate-700 cursor-grab active:cursor-grabbing transition-all flex items-center justify-center relative group" title={`Compétence ${key.toUpperCase()}`}><img src={`/abilities/${selectedAgent}_${key}_icon.png`} alt={key} className="w-full h-full object-contain pointer-events-none" onError={(e) => {e.currentTarget.src = 'https://placehold.co/40x40/black/white?text=?'}} /><span className="absolute bottom-0 right-0 bg-black/70 text-[10px] px-1 rounded text-white font-mono">{key.toUpperCase()}</span></div>))}</div></div>
            <div className="flex flex-col gap-2 flex-1 min-h-0"><span className="text-sm font-medium text-gray-400">Agents</span><div className="grid grid-cols-4 gap-2 bg-slate-800 p-3 rounded-lg border border-slate-700 overflow-y-auto custom-scrollbar">{agents.map(agent => (<div key={agent} draggable={true} onDragStart={(e) => handleDragStart(e, 'agent', agent)} onClick={() => { setSelectedAgent(agent); setTool('agent'); }} className={`aspect-square p-1 rounded-md border-2 cursor-grab active:cursor-grabbing transition-all ${selectedAgent === agent ? 'border-[#ff4655] bg-slate-700' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700'}`}><img src={`/agents/${agent}.png`} alt={agent} className="w-full h-full object-contain pointer-events-none" onError={(e) => {e.currentTarget.src = 'https://placehold.co/40x40/black/white?text=?'}} /></div>))}</div></div>
        </div>
    );
};

const ToolButton = ({ active, onClick, icon, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, title?: string }) => (<button onClick={onClick} title={title} className={`p-3 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-[#0ea5e9] text-white shadow-lg shadow-blue-900/50' : 'bg-slate-700 hover:bg-slate-600 text-gray-300'}`}>{icon}</button>);
const SmallButton = ({ active, onClick, icon, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, title?: string }) => (<button onClick={onClick} title={title} className={`w-8 h-8 rounded flex items-center justify-center transition-all ${active ? 'bg-[#0ea5e9] text-white' : 'bg-slate-700 hover:bg-slate-600 text-gray-400'}`}>{icon}</button>);