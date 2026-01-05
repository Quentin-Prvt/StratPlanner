import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean; // Pour mettre le bouton en rouge
}

export const ConfirmModal = ({
                                 isOpen,
                                 onClose,
                                 onConfirm,
                                 title,
                                 message,
                                 confirmText = "Confirmer",
                                 cancelText = "Annuler",
                                 isDangerous = false
                             }: ConfirmModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#1e293b] rounded-xl border border-gray-700 shadow-2xl overflow-hidden scale-100 transition-all p-6">

                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-full ${isDangerous ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>

                <p className="text-gray-300 mb-6 leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg transition-colors ${
                            isDangerous
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};