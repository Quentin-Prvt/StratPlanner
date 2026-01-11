import { useEffect,  useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { DrawingObject } from '../types/canvas';

export const useRealtimeStrategy = (
    strategyId: string,
    setDrawings: React.Dispatch<React.SetStateAction<DrawingObject[]>>,
    isRemoteUpdate: React.MutableRefObject<boolean>,
    isInteractingRef: React.MutableRefObject<boolean>
) => {

    // On simplifie : plus besoin de pendingUpdate complexe
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
                        if (Array.isArray(newData)) {
                            setDrawings(newData);
                        } else if (newData.steps) {
                            // Gestion compatibilité
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