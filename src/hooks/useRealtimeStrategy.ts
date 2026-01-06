import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { DrawingObject } from '../types/canvas';

export const useRealtimeStrategy = (
    strategyId: string,
    setDrawings: React.Dispatch<React.SetStateAction<DrawingObject[]>>,
    isRemoteUpdate: React.MutableRefObject<boolean>,
    isInteractingRef: React.MutableRefObject<boolean> // <--- Nouveau paramètre
) => {
    // On stocke la dernière mise à jour reçue ici si l'utilisateur est occupé
    const pendingUpdate = useRef<DrawingObject[] | null>(null);

    // Fonction pour appliquer la mise à jour en attente (à appeler au MouseUp)
    const processPendingUpdates = useCallback(() => {
        if (pendingUpdate.current) {
            console.log("🔄 Application de la mise à jour différée");
            isRemoteUpdate.current = true;
            setDrawings(pendingUpdate.current);
            pendingUpdate.current = null;
        }
    }, [setDrawings, isRemoteUpdate]);

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
                    const newData = payload.new.data;

                    if (newData) {
                        // SI l'utilisateur est en train de cliquer/glisser :
                        if (isInteractingRef.current) {
                            console.log("⏳ Utilisateur occupé, mise à jour mise en file d'attente...");
                            pendingUpdate.current = newData;
                        }
                        // SINON, on applique direct :
                        else {
                            isRemoteUpdate.current = true;
                            // console.log("📥 Mise à jour reçue et appliquée !");
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