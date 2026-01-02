import { EditorCanvas } from "../components/EditorCanvas";

export const AscentPage = () => {
    return (
        <div className="h-screen w-screen bg-[#121516] flex flex-col overflow-hidden">
            {/* Header compact */}
            <header className="flex-none py-3 px-6 bg-[#181b1e] border-b border-gray-800 flex items-center justify-between z-10">
                <div className="flex items-baseline gap-4">
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                        STRAT<span className="text-[#ff4655]">PLANNER</span>
                    </h1>
                    <span className="text-gray-500 font-mono text-xs tracking-widest bg-gray-900 px-2 py-1 rounded">
                        MAP: ASCENT
                    </span>
                </div>
            </header>

            {/* Zone de contenu principale (prend tout le reste de la place) */}
            <div className="flex-1 w-full h-full  relative overflow-hidden bg-[#121516]">
                <EditorCanvas mapSrc="/ascent.svg" />
            </div>
        </div>
    );
};