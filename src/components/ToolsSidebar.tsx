import React from 'react';
import {
    Pencil, Eraser, Minus, MoveUpRight, Square,
    Hand, Save, FolderOpen, MousePointer2
} from 'lucide-react';

export type ToolType = 'pen' | 'eraser' | 'cursor' | 'agent' | null;
export type StrokeType = 'solid' | 'dashed' | 'arrow' | 'dashed-arrow' | 'rect';

interface ToolsSidebarProps {
    currentTool: ToolType;
    setTool: (t: ToolType) => void;
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
}

export const ToolsSidebar = ({
                                 currentTool, setTool,
                                 strokeType, setStrokeType,
                                 color, setColor,
                                 opacity, setOpacity,
                                 thickness, setThickness,
                                 selectedAgent, setSelectedAgent,
                                 onSave, onLoad
                             }: ToolsSidebarProps) => {

    const colors = [
        '#ffffff', '#000000', '#ef4444', '#ec4899',
        '#facc15', '#84cc16', '#14532d', '#3b82f6',
        '#8b5cf6', '#713f12'
    ];

    // Liste des agents
    const agents = [
        'astra', 'breach', 'brimstone', 'chamber', 'clove', 'cypher', 'deadlock',
        'fade', 'gekko', 'harbor', 'iso', 'jett', 'kayo', 'killjoy', 'neon',
        'omen', 'phoenix', 'raze', 'reyna', 'sage', 'skye', 'sova', 'viper',
        'vyse', 'yoru'
    ];

    const handleToolClick = (tool: ToolType) => {
        if (currentTool === tool) {
            setTool(null);
        } else {
            setTool(tool);
        }
    };

    const handleDragStart = (e: React.DragEvent, agentName: string) => {
        e.dataTransfer.setData("agent", agentName);
        e.dataTransfer.effectAllowed = "copy";
        setSelectedAgent(agentName);
        if (currentTool !== 'agent' && currentTool !== 'cursor') {
            setTool('agent');
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-[#1e293b] rounded-xl border border-gray-700 shadow-xl w-full lg:w-72 text-white overflow-y-auto max-h-full pointer-events-auto">
            {/* Header + Actions */}
            <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold">Outils</h2>
                <div className="flex gap-2">
                    <button onClick={onSave} title="Sauvegarder" className="p-2 hover:bg-slate-700 rounded text-green-400 border border-transparent hover:border-green-400/30 transition-all"><Save size={20} /></button>
                    <button onClick={onLoad} title="Charger" className="p-2 hover:bg-slate-700 rounded text-blue-400 border border-transparent hover:border-blue-400/30 transition-all"><FolderOpen size={20} /></button>
                </div>
            </div>

            {/* Outils Principaux */}
            <div className="grid grid-cols-4 gap-2 mb-2">
                <ToolButton active={currentTool === 'cursor'} onClick={() => handleToolClick('cursor')} icon={<MousePointer2 size={20} />} title="Déplacer" />
                <ToolButton active={currentTool === 'pen'} onClick={() => handleToolClick('pen')} icon={<Pencil size={20} />} title="Dessiner" />
                <ToolButton active={currentTool === 'eraser'} onClick={() => handleToolClick('eraser')} icon={<Eraser size={20} />} title="Gomme" />
                <ToolButton active={currentTool === 'agent'} onClick={() => handleToolClick('agent')} icon={<span className="font-bold text-lg">A</span>} title="Placer Agent" />
            </div>

            {/* Message Mode Navigation */}
            {currentTool === null && (
                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 flex items-center gap-3 text-sm text-blue-200">
                    <Hand size={18} />
                    <span>Mode Navigation.<br/>Molette pour zoomer/bouger.</span>
                </div>
            )}

            {/* Liste des Agents */}
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                <span className="text-sm font-medium text-gray-400">Agents (Glisser-Déposer)</span>
                <div className="grid grid-cols-4 gap-2 bg-slate-800 p-3 rounded-lg border border-slate-700 max-h-60 overflow-y-auto custom-scrollbar">
                    {agents.map(agent => (
                        <div
                            key={agent}
                            draggable
                            onDragStart={(e) => handleDragStart(e, agent)}
                            onClick={() => { setSelectedAgent(agent); setTool('agent'); }}
                            // --- MODIFICATION ICI : Style des bordures ---
                            className={`aspect-square p-1 rounded-md border-2 cursor-grab active:cursor-grabbing transition-all ${
                                selectedAgent === agent && currentTool === 'agent'
                                    ? 'border-[#ff4655] bg-slate-700' // Sélectionné : Rouge
                                    : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700' // Défaut : Gris
                            }`}
                            title={agent}
                        >
                            <img
                                src={`/agents/${agent}.png`}
                                alt={agent}
                                className="w-full h-full object-contain pointer-events-none"
                                onError={(e) => {e.currentTarget.src = 'https://placehold.co/40x40/black/white?text=?'}}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Options du Stylo */}
            {currentTool === 'pen' && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300 mt-2 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-16">Type</span>
                        <div className="grid grid-cols-5 gap-1 flex-1">
                            <SmallButton active={strokeType === 'solid'} onClick={() => setStrokeType('solid')} icon={<Minus size={16} className="-rotate-45" />} />
                            <SmallButton active={strokeType === 'dashed'} onClick={() => setStrokeType('dashed')} icon={<Minus size={16} className="border-dashed border-b-2 border-current w-4 h-0" />} />
                            <SmallButton active={strokeType === 'arrow'} onClick={() => setStrokeType('arrow')} icon={<MoveUpRight size={16} />} />
                            <SmallButton active={strokeType === 'dashed-arrow'} onClick={() => setStrokeType('dashed-arrow')} icon={<MoveUpRight size={16} className="opacity-75" />} />
                            <SmallButton active={strokeType === 'rect'} onClick={() => setStrokeType('rect')} icon={<Square size={16} />} />
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="text-sm font-medium w-16 pt-1">Couleur</span>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {colors.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${color === c ? 'border-white ring-2 ring-blue-500' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-16">Opacité</span>
                        <input
                            type="range" min="0.1" max="1" step="0.1"
                            value={opacity}
                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-16">Taille</span>
                        <input
                            type="range" min="2" max="20"
                            value={thickness}
                            onChange={(e) => setThickness(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const ToolButton = ({ active, onClick, icon, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, title?: string }) => (
    <button onClick={onClick} title={title} className={`p-3 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-[#0ea5e9] text-white shadow-lg shadow-blue-900/50' : 'bg-slate-700 hover:bg-slate-600 text-gray-300'}`}>{icon}</button>
);

const SmallButton = ({ active, onClick, icon, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, title?: string }) => (
    <button onClick={onClick} title={title} className={`w-9 h-9 rounded flex items-center justify-center transition-all ${active ? 'bg-[#0ea5e9] text-white' : 'bg-slate-700 hover:bg-slate-600 text-gray-400'}`}>{icon}</button>
);