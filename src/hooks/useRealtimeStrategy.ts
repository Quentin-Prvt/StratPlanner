import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { throttle } from 'lodash';
import type { StrategyStep } from '../types/canvas';
import type { RemoteCursor } from '../components/editor/RemoteCursorOverlay';

// Helper couleur
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export const useRealtimeStrategy = (
    strategyId: string,
    user: any, // On récupère le user auth
    setSteps: React.Dispatch<React.SetStateAction<StrategyStep[]>>,
    currentStepIndexRef: React.MutableRefObject<number>,
    isRemoteUpdate: React.MutableRefObject<boolean>,
    isInteractingRef: React.MutableRefObject<boolean>
) => {
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // État pour stocker les curseurs des autres : { "user_id_123": { x: 10, y: 20... } }
    const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});

    // --- 1. FONCTION D'ENVOI MOUVEMENT OBJET (Déjà là) ---
    const broadcastMove = useCallback(
        throttle((objectId: number, x: number, y: number) => {
            if (!channelRef.current) return;
            channelRef.current.send({
                type: 'broadcast',
                event: 'OBJECT_MOVE',
                payload: { id: objectId, x, y, stepIndex: currentStepIndexRef.current }
            });
        }, 30),
        []
    );

    // --- 2. FONCTION D'ENVOI CURSEUR (NOUVEAU) ---
    // On throttle à 50ms (20 images/sec) pour ne pas saturer le réseau
    const broadcastCursor = useCallback(
        throttle((x: number, y: number) => {
            if (!channelRef.current || !user) return;

            // On envoie le pseudo (metadata) ou l'email coupé
            const displayName = user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || 'Anonyme';
            const userColor = stringToColor(user.id);

            channelRef.current.send({
                type: 'broadcast',
                event: 'CURSOR_POS',
                payload: {
                    id: user.id,
                    x: Math.round(x), // On arrondit pour alléger le JSON
                    y: Math.round(y),
                    color: userColor,
                    name: displayName
                }
            });
        }, 50),
        [user]
    );

    useEffect(() => {
        if (!strategyId) return;

        const channel = supabase.channel(`room-${strategyId}`);
        channelRef.current = channel;

        channel
            // A. RECEPTION OBJET
            .on('broadcast', { event: 'OBJECT_MOVE' }, ({ payload }) => {
                if (isInteractingRef.current) return;
                if (payload.stepIndex !== currentStepIndexRef.current) return;

                isRemoteUpdate.current = true;
                setSteps((prevSteps) => {
                    const newSteps = [...prevSteps];
                    const currentIndex = currentStepIndexRef.current;
                    if (!newSteps[currentIndex]) return prevSteps;
                    const currentData = [...newSteps[currentIndex].data];
                    const objIndex = currentData.findIndex((o) => o.id === payload.id);
                    if (objIndex !== -1) {
                        currentData[objIndex] = { ...currentData[objIndex], x: payload.x, y: payload.y };
                        newSteps[currentIndex] = { ...newSteps[currentIndex], data: currentData };
                        return newSteps;
                    }
                    return prevSteps;
                });
            })
            // B. RECEPTION CURSEUR (NOUVEAU)
            .on('broadcast', { event: 'CURSOR_POS' }, ({ payload }) => {
                // Si c'est mon propre curseur qui revient en écho, on ignore
                if (user && payload.id === user.id) return;

                setRemoteCursors(prev => ({
                    ...prev,
                    [payload.id]: {
                        id: payload.id,
                        x: payload.x,
                        y: payload.y,
                        color: payload.color,
                        name: payload.name,
                        lastUpdate: Date.now() // Important pour le nettoyage
                    }
                }));
            })
            // C. RECEPTION DB
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'strategies', filter: `id=eq.${strategyId}` }, (payload) => {
                if (isInteractingRef.current) return;
                const newData = payload.new.data;
                if (newData) {
                    isRemoteUpdate.current = true;
                    if (Array.isArray(newData)) { /* Legacy */ }
                    else if (newData.steps) { setSteps(newData.steps); }
                }
            })
            .subscribe();

        // NETTOYAGE AUTOMATIQUE DES CURSEURS INACTIFS
        // Si on n'a pas reçu de news d'un curseur depuis 3 secondes, on l'efface
        const cleanupInterval = setInterval(() => {
            setRemoteCursors(prev => {
                const now = Date.now();
                const next = { ...prev };
                let hasChanges = false;
                Object.keys(next).forEach(key => {
                    if (now - next[key].lastUpdate > 3000) { // 3 secondes d'inactivité = Disparition
                        delete next[key];
                        hasChanges = true;
                    }
                });
                return hasChanges ? next : prev;
            });
        }, 1000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(cleanupInterval);
        };
    }, [strategyId, setSteps, user]); // User ajouté aux dépendances

    return { broadcastMove, broadcastCursor, remoteCursors };
};