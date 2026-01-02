import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Type, X } from 'lucide-react';

interface TextEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { text: string; color: string; fontSize: number; isBold: boolean; isItalic: boolean }) => void;
    // --- NOUVELLES PROPS POUR L'ÉDITION ---
    initialText?: string;
    initialColor?: string;
    initialFontSize?: number;
    initialBold?: boolean;
    initialItalic?: boolean;
}

export const TextEditorModal = ({
                                    isOpen,
                                    onClose,
                                    onSave,
                                    initialText = '',
                                    initialColor = '#ffffff',
                                    initialFontSize = 24,
                                    initialBold = false,
                                    initialItalic = false
                                }: TextEditorModalProps) => {

    const [text, setText] = useState(initialText);
    const [localColor, setLocalColor] = useState(initialColor);
    const [fontSize, setFontSize] = useState(initialFontSize);
    const [isBold, setIsBold] = useState(initialBold);
    const [isItalic, setIsItalic] = useState(initialItalic);

    const containerRef = useRef<HTMLDivElement>(null);
    const presetColors = ['#ffffff', '#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308'];

    // Quand la fenêtre s'ouvre, on met à jour les états avec les valeurs reçues (soit vides, soit celles du texte à éditer)
    useEffect(() => {
        if (isOpen) {
            setText(initialText);
            setLocalColor(initialColor);
            setFontSize(initialFontSize);
            setIsBold(initialBold);
            setIsItalic(initialItalic);
        }
    }, [isOpen, initialText, initialColor, initialFontSize, initialBold, initialItalic]);

    if (!isOpen) return null;

    const handleSaveAndClose = () => {
        // On autorise la sauvegarde même si c'est vide (pour pouvoir vider un texte si on veut)
        // ou on garde la condition text.trim() selon ta préférence.
        if (text.trim()) {
            onSave({
                text,
                color: localColor,
                fontSize,
                isBold,
                isItalic
            });
        } else {
            onClose();
        }
    };

    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleSaveAndClose();
        }
    };

    return (
        <div
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackgroundClick}
        >
            <div
                ref={containerRef}
                className="w-full max-w-md bg-[#1e293b] rounded-xl border border-gray-700 shadow-2xl overflow-hidden transform scale-100 transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* BARRE D'OUTILS */}
                <div className="flex items-center justify-between p-3 bg-[#0f172a] border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsBold(!isBold)}
                            className={`p-2 rounded hover:bg-white/10 transition-colors ${isBold ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                            title="Gras"
                        >
                            <Bold size={18} />
                        </button>

                        <button
                            onClick={() => setIsItalic(!isItalic)}
                            className={`p-2 rounded hover:bg-white/10 transition-colors ${isItalic ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                            title="Italique"
                        >
                            <Italic size={18} />
                        </button>

                        <div className="w-px h-6 bg-gray-700 mx-1" />

                        <div className="flex items-center gap-2">
                            <Type size={16} className="text-gray-400"/>
                            <input
                                type="range" min="12" max="64"
                                value={fontSize}
                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <span className="text-xs text-gray-400 w-6">{fontSize}</span>
                        </div>
                    </div>

                    <button onClick={handleSaveAndClose} className="text-gray-400 hover:text-white p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* ZONE DE TEXTE */}
                <div className="p-4 bg-[#1e293b]">
                    <textarea
                        autoFocus
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Tapez ici..."
                        className="w-full h-32 bg-transparent text-white border-none focus:ring-0 outline-none resize-none placeholder-gray-600"
                        style={{
                            fontSize: `${fontSize}px`,
                            fontWeight: isBold ? 'bold' : 'normal',
                            fontStyle: isItalic ? 'italic' : 'normal',
                            color: localColor,
                            lineHeight: 1.2
                        }}
                    />

                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-700/50 justify-end">
                        {presetColors.map(c => (
                            <button
                                key={c}
                                onClick={() => setLocalColor(c)}
                                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${localColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};