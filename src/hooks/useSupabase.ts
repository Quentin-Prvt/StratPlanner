import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface Folder {
    id: number;
    name: string;
    created_at: string;
}

export const useSupabaseStrategies = () => {
    const { user } = useAuth();
    const [savedStrategies, setSavedStrategies] = useState<any[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- STRATEGIES ---

    const fetchStrategies = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('strategies')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (!error && data) setSavedStrategies(data);
        setIsLoading(false);
    }, [user]);

    const getStrategyById = async (id: string) => {
        const { data, error } = await supabase
            .from('strategies')
            .select('*')
            .eq('id', id)
            .single();
        if (error) console.error(error);
        return data;
    };

    const createNewStrategy = async (mapName: string, title: string) => {
        if (!user) return null;
        const { data, error } = await supabase
            .from('strategies')
            .insert([{
                user_id: user.id,
                map_name: mapName,
                title: title,
                data: [],
                folder_id: null // Par défaut à la racine
            }])
            .select()
            .single();

        if (error) {
            console.error(error);
            return null;
        }
        return data;
    };

    const updateStrategyData = async (id: string, drawingData: any[]) => {
        const { error } = await supabase
            .from('strategies')
            .update({ data: drawingData, updated_at: new Date() })
            .eq('id', id);
        if (error) console.error("Erreur save:", error);
    };

    const deleteStrategy = async (id: string) => {
        const { error } = await supabase
            .from('strategies')
            .delete()
            .eq('id', id);

        if (!error) {
            setSavedStrategies(prev => prev.filter(s => s.id !== id));
        }
    };

    const moveStrategy = async (strategyId: string, folderId: number | null) => {
        const { error } = await supabase
            .from('strategies')
            .update({ folder_id: folderId })
            .eq('id', strategyId);

        if (!error) fetchStrategies(); // Rafraîchir
    };

    // --- FOLDERS ---

    const fetchFolders = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('folders')
            .select('*')
            .eq('user_id', user.id)
            .order('name');

        if (data) setFolders(data);
    }, [user]);

    const createFolder = async (name: string) => {
        if (!user) return;
        const { data } = await supabase
            .from('folders')
            .insert([{ user_id: user.id, name }])
            .select()
            .single();

        if (data) setFolders(prev => [...prev, data]);
    };

    const deleteFolder = async (id: number) => {
        // 1. D'abord on sort les stratégies du dossier (optionnel, sinon elles sont supprimées si cascade, ou set null)
        // Ici on a mis "ON DELETE SET NULL" dans SQL donc les strats reviennent à la racine automatiquement.

        const { error } = await supabase
            .from('folders')
            .delete()
            .eq('id', id);

        if (!error) {
            setFolders(prev => prev.filter(f => f.id !== id));
            fetchStrategies(); // Pour mettre à jour les folder_id des strats
        }
    };

    return {
        savedStrategies,
        folders,
        isLoading,
        fetchStrategies,
        fetchFolders,
        getStrategyById,
        createNewStrategy,
        updateStrategyData,
        deleteStrategy,
        createFolder,
        deleteFolder,
        moveStrategy
    };
};