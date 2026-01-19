import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Type, X, Check, Minus, Plus, Underline, Highlighter } from 'lucide-react';

interface TextEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { text: string; color: string; fontSize: number; isBold: boolean; isItalic: boolean; isUnderline: boolean; backgroundColor: string | null }) => void;
    initialText?: string;
    initialColor?: string;
    initialFontSize?: number;
    initialBold?: boolean;
    initialItalic?: boolean;
    initialUnderline?: boolean;
    initialBackgroundColor?: string | null;
}

export const TextEditorModal = ({
                                    isOpen,
                                    onClose,
                                    onSave,
                                    initialText = '',
                                    initialColor = '#ffffff',
                                    initialFontSize = 24,
                                    initialBold = false,
                                    initialItalic = false,
                                    initialUnderline = false,
                                    initialBackgroundColor = null
                                }: TextEditorModalProps) => {

    const [text, setText] = useState(initialText);
    const [localColor, setLocalColor] = useState(initialColor);
    const [fontSize, setFontSize] = useState(initialFontSize);
    const [isBold, setIsBold] = useState(initialBold);
    const [isItalic, setIsItalic] = useState(initialItalic);
    const [isUnderline, setIsUnderline] = useState(initialUnderline);
    const [bgColor, setBgColor] = useState<string | null>(initialBackgroundColor);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Palette étendue
    const textColors = ['#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#d946ef'];

    // CORRECTION ICI : On définit la liste qu'on va utiliser juste après
    const bgColors = ['#000000', '#ffffff', '#ef4444', '#eab308', '#22c55e', '#3b82f6'];

    useEffect(() => {
        if (isOpen) {
            setText(initialText);
            setLocalColor(initialColor);
            setFontSize(initialFontSize);
            setIsBold(initialBold);
            setIsItalic(initialItalic);
            setIsUnderline(initialUnderline);
            setBgColor(initialBackgroundColor);
            setTimeout(() => textareaRef.current?.focus(), 50);
        }
    }, [isOpen, initialText, initialColor, initialFontSize, initialBold, initialItalic, initialUnderline, initialBackgroundColor]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (text.trim()) {
            onSave({
                text,
                color: localColor,
                fontSize,
                isBold,
                isItalic,
                isUnderline,
                backgroundColor: bgColor
            });
        } else {
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4" onMouseDown={onClose}>
            <div className="w-full max-w-lg bg-[#0f172a] rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onMouseDown={(e) => e.stopPropagation()}>

                {/* HEADER */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-[#1e293b]">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Type size={16} className="text-blue-400"/> Éditer le texte
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700" title="Annuler (Echap)">
                        <X size={20} />
                    </button>
                </div>

                {/* TOOLBAR */}
                <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-[#1e293b]/50 border-b border-slate-700/50">

                    {/* Style Texte */}
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button onClick={() => setIsBold(!isBold)} className={`p-1.5 rounded transition-all ${isBold ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`} title="Gras"><Bold size={16} /></button>
                        <button onClick={() => setIsItalic(!isItalic)} className={`p-1.5 rounded transition-all ${isItalic ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`} title="Italique"><Italic size={16} /></button>
                        <button onClick={() => setIsUnderline(!isUnderline)} className={`p-1.5 rounded transition-all ${isUnderline ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`} title="Souligné"><Underline size={16} /></button>
                    </div>

                    {/* Taille */}
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Minus size={14} /></button>
                        <span className="text-xs font-mono w-8 text-center text-slate-200">{fontSize}px</span>
                        <button onClick={() => setFontSize(Math.min(100, fontSize + 2))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Plus size={14} /></button>
                    </div>

                    {/* Surlignage (Fond) */}
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700 pl-2">
                        <Highlighter size={14} className="text-slate-400" />
                        <div className="flex gap-1">
                            <button onClick={() => setBgColor(null)} className={`w-5 h-5 rounded border ${bgColor === null ? 'border-red-500 bg-slate-700' : 'border-slate-600 hover:border-slate-400'} flex items-center justify-center transition-colors`} title="Aucun fond">
                                <div className="w-full h-px bg-red-500 transform rotate-45"></div>
                            </button>

                            {/* CORRECTION ICI : On utilise bien bgColors défini plus haut */}
                            {bgColors.map(c => (
                                <button key={c} onClick={() => setBgColor(c)} className={`w-5 h-5 rounded border transition-transform hover:scale-110 ${bgColor === c ? 'border-white ring-1 ring-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ZONE DE SAISIE */}
                <div className="p-4 bg-slate-900/50 relative">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Votre texte ici..."
                        className="w-full h-40 bg-transparent border-none focus:ring-0 outline-none resize-none placeholder-slate-600"
                        style={{
                            fontSize: `${fontSize}px`,
                            fontWeight: isBold ? 'bold' : 'normal',
                            fontStyle: isItalic ? 'italic' : 'normal',
                            textDecoration: isUnderline ? 'underline' : 'none',
                            color: localColor,
                            backgroundColor: bgColor || 'transparent',
                            lineHeight: 1.4,
                            padding: '8px',
                            borderRadius: '4px'
                        }}
                    />
                    <div className="absolute bottom-2 right-4 text-[10px] text-slate-500 pointer-events-none">
                        Ctrl + Entrée pour valider
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 bg-[#1e293b] border-t border-slate-700 flex flex-col gap-4">
                    <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Couleur du texte</span>
                        <div className="flex flex-wrap gap-2">
                            {textColors.map(c => (
                                <button key={c} onClick={() => setLocalColor(c)} className={`w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none ${localColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'border border-slate-600'}`} style={{ backgroundColor: c }} title={c} />
                            ))}
                        </div>
                    </div>
                    <div className="h-px bg-slate-700/50 w-full" />
                    <div className="flex items-center justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">Annuler</button>
                        <button onClick={handleSave} className="px-6 py-2 rounded-lg text-sm font-bold bg-[#ff4655] text-white hover:bg-[#e63e4c] transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2"><Check size={18} /> Valider</button>
                    </div>
                </div>
            </div>
        </div>
    );
};