import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient.ts';
import { useAuth } from '../contexts/AuthContext';
import type { DrawingObject } from '../types/canvas';

// Mise à jour des interfaces pour inclure team_id
export interface Folder {
    id: number;
    name: string;
    user_id: string;
    team_id: string | null; // Nouveau
    created_at: string;
}

export interface Strategy {
    id: string;
    title: string;
    map_name: string;
    user_id: string;
    folder_id: number | null;
    team_id: string | null; // Nouveau
    data: DrawingObject[];
    created_at: string;
    updated_at: string;
}

export const useSupabaseStrategies = () => {
    const { user } = useAuth();
    const [savedStrategies, setSavedStrategies] = useState<Strategy[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);

    // --- STRATEGIES ---

    // Accepte un teamId optionnel pour filtrer
    const fetchStrategies = useCallback(async (teamId: string | null = null) => {
        if (!user) return;
        setIsLoading(true);

        let query = supabase
            .from('strategies')
            .select('*')
            .order('updated_at', { ascending: false });

        if (teamId) {
            // MODE ÉQUIPE : On cherche les strats qui appartiennent à l'équipe
            query = query.eq('team_id', teamId);
        } else {
            // MODE PERSO : Mes strats + Celles qui n'ont PAS de team_id
            query = query.eq('user_id', user.id).is('team_id', null);
        }

        const { data, error } = await query;

        if (error) console.error("Erreur fetch strategies:", error);
        if (data) setSavedStrategies(data);

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

    // Ajout de teamId lors de la création
    const createNewStrategy = async (mapName: string, title: string, teamId: string | null = null) => {
        if (!user) return null;

        const payload = {
            user_id: user.id,
            map_name: mapName,
            title: title,
            name: title, // Rétrocompatibilité si 'name' existe encore
            data: [],
            folder_id: null,
            team_id: teamId || null // Important : null si pas de team
        };

        const { data, error } = await supabase
            .from('strategies')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error("Erreur création strat:", error);
            return null;
        }
        return data;
    };

    const updateStrategyData = async (id: string, drawingData: any[]) => {
        const { error } = await supabase
            .from('strategies')
            .update({ data: drawingData, updated_at: new Date().toISOString() })
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

        if (!error) {
            setSavedStrategies(prev => prev.map(s =>
                s.id === strategyId ? { ...s, folder_id: folderId } : s
            ));
        }
    };

    // --- FOLDERS ---

    // Accepte un teamId optionnel pour filtrer
    const fetchFolders = useCallback(async (teamId: string | null = null) => {
        if (!user) return;

        let query = supabase
            .from('folders')
            .select('*')
            .order('name');

        if (teamId) {
            // MODE ÉQUIPE
            query = query.eq('team_id', teamId);
        } else {
            // MODE PERSO
            query = query.eq('user_id', user.id).is('team_id', null);
        }

        const { data, error } = await query;

        if (error) console.error("Erreur fetch folders:", error);
        if (data) setFolders(data);
    }, [user]);

    // Ajout de teamId lors de la création
    const createFolder = async (name: string, teamId: string | null = null) => {
        if (!user) return;

        const payload = {
            user_id: user.id,
            name,
            team_id: teamId || null
        };

        const { data } = await supabase
            .from('folders')
            .insert([payload])
            .select()
            .single();

        if (data) setFolders(prev => [...prev, data]);
    };

    const renameFolder = async (id: number, newName: string) => {
        const { error } = await supabase
            .from('folders')
            .update({ name: newName })
            .eq('id', id);

        if (!error) {
            // Mise à jour locale pour éviter un re-fetch complet
            setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
        } else {
            console.error("Erreur rename folder:", error);
        }
    };

    const deleteFolder = async (id: number) => {
        const { error } = await supabase
            .from('folders')
            .delete()
            .eq('id', id);

        if (!error) {
            setFolders(prev => prev.filter(f => f.id !== id));
            // Mettre à jour les strats orphelines localement
            setSavedStrategies(prev => prev.map(s =>
                s.folder_id === id ? { ...s, folder_id: null } : s
            ));
        }
    };

    return {
        savedStrategies, folders, isLoading,
        showLoadModal, setShowLoadModal,
        fetchStrategies, fetchFolders, getStrategyById,
        createNewStrategy, updateStrategyData, deleteStrategy,
        createFolder, deleteFolder, moveStrategy, renameFolder
    };
};