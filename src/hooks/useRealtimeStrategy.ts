import  { useEffect,  useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { DrawingObject } from '../types/canvas';

export const useRealtimeStrategy = (
    strategyId: string,
    setDrawings: React.Dispatch<React.SetStateAction<DrawingObject[]>>, // On passe directement le setter
    isRemoteUpdate: React.RefObject<boolean>,
    isInteractingRef: React.RefObject<boolean> // <--- LE BOUCLIER ANTI-CLIGNOTEMENT
) => {

    // Plus besoin de logique complexe de pendingUpdate ici, le bouclier suffit.
    const processPendingUpdates = useCallback(() => {}, []);

    useEffect(() => {
        if (!strategyId) return;

        const channel = supabase
            .channel(`room-${strategyId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'strategies',
                    filter: `id=eq.${strategyId}`
                },
                (payload) => {
                    if (isInteractingRef.current) {
                        return;
                    }

                    const newData = payload.new.data;
                    if (newData) {
                        isRemoteUpdate.current = true;

                        // Gestion de tes formats de données (array direct ou objet steps)
                        if (Array.isArray(newData)) {
                            setDrawings(newData);
                        } else if (newData.steps) {
                            setDrawings(newData);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [strategyId, setDrawings, isRemoteUpdate, isInteractingRef]);

    return { processPendingUpdates };
};