import { useParams } from 'react-router-dom';
import { EditorCanvas } from '../components/EditorCanvas';

export const StrategyEditorPage = () => {
    const { id } = useParams();
    if (!id) return <div className="text-white">Erreur : Pas d'ID de stratégie.</div>;

    return (
        <div className="w-full h-full overflow-hidden">
            <EditorCanvas strategyId={id} />
        </div>
    );
};