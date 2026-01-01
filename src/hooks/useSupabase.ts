import { useState } from 'react';
import { supabase } from '../supabaseClient';
import type { DrawingObject, StrategyRecord } from '../types/canvas';

export const useSupabaseStrategies = (currentMap: string) => {
    const [savedStrategies, setSavedStrategies] = useState<StrategyRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);

    const saveStrategy = async (drawings: DrawingObject[]) => {
        if (drawings.length === 0) {
            alert("Rien à sauvegarder !");
            return;
        }
        const name = prompt("Nom de la stratégie :");
        if (!name) return;

        setIsLoading(true);
        const { error } = await supabase.from('strategies').insert([
            { name, map_name: currentMap, data: drawings }
        ]);
        setIsLoading(false);

        if (error) alert("Erreur sauvegarde : " + error.message);
        else alert("Sauvegardé !");
    };

    const fetchStrategies = async () => {
        setShowLoadModal(true);
        setIsLoading(true);
        const { data } = await supabase
            .from('strategies')
            .select('*')
            .eq('map_name', currentMap)
            .order('created_at', { ascending: false });

        setSavedStrategies(data || []);
        setIsLoading(false);
    };

    return {
        savedStrategies,
        isLoading,
        showLoadModal,
        setShowLoadModal,
        saveStrategy,
        fetchStrategies
    };
};