import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { DrawingObject, StrategyRecord } from '../types/canvas';
import { useAuth } from '../contexts/AuthContext';

export const useSupabaseStrategies = (mapName: string = '') => {
    const [savedStrategies, setSavedStrategies] = useState<StrategyRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const { user } = useAuth();

    // 1. CRÉER UNE NOUVELLE STRATÉGIE (Depuis la Home)
    const createNewStrategy = async (currentMapName: string, name: string = "Sans titre") => {
        if (!user) {
            alert("Vous devez être connecté pour créer une stratégie !");
            return null;
        }

        setIsLoading(true);
        const { data, error } = await supabase
            .from('strategies')
            .insert([{
                name: name,
                map_name: currentMapName,
                data: [],
                user_id: user.id
            }])
            .select()
            .single();

        setIsLoading(false);
        if (error) {
            console.error("Erreur création:", error);
            return null;
        }
        return data;
    };

    // 2. RÉCUPÉRER UNE STRATÉGIE PAR ID
    const getStrategyById = async (id: string) => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('strategies')
            .select('*')
            .eq('id', id)
            .single();

        setIsLoading(false);
        if (error) {
            console.error("Erreur récupération ID:", error);
            return null;
        }
        return data;
    };

    // 3. MISE À JOUR AUTOMATIQUE (Avec Debug et useCallback)
    const updateStrategyData = useCallback(async (id: string, drawingsData: any) => {
        // On demande à Supabase de compter combien de lignes ont été modifiées
        const { error, count } = await supabase
            .from('strategies')
            .update({
                data: drawingsData,
                updated_at: new Date().toISOString() // Assure-toi d'avoir créé cette colonne, sinon commente cette ligne
            })
            .eq('id', id)
            .select('id');

        if (error) {
            console.error('❌ Erreur technique Supabase:', error.message);
        } else if (count === 0) {
            console.warn(`⚠️ Aucune sauvegarde effectuée pour l'ID ${id}. (0 ligne modifiée). Vérifie les droits RLS ou si l'ID est correct.`);
        } else {
            console.log(`✅ Sauvegarde réussie (ID: ${id})`);
        }
    }, []);

    // 4. SAUVEGARDE MANUELLE (Depuis l'éditeur, retourne l'ID en string)
    const saveStrategy = async (drawings: DrawingObject[]): Promise<string | null> => {
        if (!user) {
            return null;
        }
        if (drawings.length === 0) {
            alert("Rien à sauvegarder !");
            return null;
        }
        const name = prompt("Nom de la stratégie :");
        if (!name) return null;

        setIsLoading(true);

        const { data, error } = await supabase
            .from('strategies')
            .insert([{ name, map_name: mapName, data: drawings, user_id: user.id }])
            .select();

        setIsLoading(false);

        if (error) {
            alert("Erreur sauvegarde : " + error.message);
            return null;
        } else {
            alert("Sauvegardé !");
            if (data && data.length > 0) {
                return data[0].id; // Retourne l'UUID (string)
            }
            return null;
        }
    };

    // 5. CHARGER LA LISTE DES STRATÉGIES
    const fetchStrategies = async () => {
        setShowLoadModal(true);
        setIsLoading(true);

        const { data } = await supabase
            .from('strategies')
            .select('*')
            .eq('map_name', mapName)
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
        fetchStrategies,
        updateStrategyData,
        createNewStrategy,
        getStrategyById,
    };
};