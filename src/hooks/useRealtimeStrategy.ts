import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { throttle } from 'lodash';
import type { StrategyStep } from '../types/canvas';

export const useRealtimeStrategy = (
    strategyId: string,
    setSteps: React.Dispatch<React.SetStateAction<StrategyStep[]>>,
    currentStepIndexRef: React.MutableRefObject<number>, // <--- NOUVEAU : Pour savoir quelle step updater
    isRemoteUpdate: React.MutableRefObject<boolean>,
    isInteractingRef: React.MutableRefObject<boolean>
) => {
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // --- FONCTION D'ENVOI (BROADCAST) ---
    // On utilise throttle pour ne pas envoyer 60 messages par seconde, mais plutôt ~30 (30ms)
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

    useEffect(() => {
        if (!strategyId) return;

        // Création du canal unique pour cette stratégie
        const channel = supabase.channel(`room-${strategyId}`);
        channelRef.current = channel;

        channel
            // 1. ÉCOUTE DES DÉPLACEMENTS EN TEMPS RÉEL (FLUIDITÉ)
            .on(
                'broadcast',
                { event: 'OBJECT_MOVE' },
                ({ payload }: { payload: { id: number; x: number; y: number; stepIndex: number } }) => {
                    // Si c'est moi qui bouge, j'ignore mes propres messages (déjà géré par React)
                    if (isInteractingRef.current) return;

                    // On ne met à jour que si le mouvement concerne l'étape qu'on regarde
                    if (payload.stepIndex !== currentStepIndexRef.current) return;

                    isRemoteUpdate.current = true; // Empêche l'auto-save de se déclencher inutilement

                    setSteps((prevSteps) => {
                        const newSteps = [...prevSteps];
                        const currentIndex = currentStepIndexRef.current;

                        if (!newSteps[currentIndex]) return prevSteps;

                        // Copie profonde des données pour éviter les mutations directes
                        const currentData = [...newSteps[currentIndex].data];

                        // On cherche l'objet à déplacer
                        const objIndex = currentData.findIndex((o) => o.id === payload.id);

                        if (objIndex !== -1) {
                            // On met à jour uniquement la position
                            currentData[objIndex] = {
                                ...currentData[objIndex],
                                x: payload.x,
                                y: payload.y
                            };

                            newSteps[currentIndex] = {
                                ...newSteps[currentIndex],
                                data: currentData
                            };
                            return newSteps;
                        }
                        return prevSteps;
                    });
                }
            )
            // 2. ÉCOUTE DES SAUVEGARDES DB (PERSISTANCE / NOUVEAUX OBJETS)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'strategies',
                    filter: `id=eq.${strategyId}`
                },
                (payload) => {
                    if (isInteractingRef.current) return; // Bouclier anti-clignotement

                    const newData = payload.new.data;
                    if (newData) {
                        isRemoteUpdate.current = true;
                        if (Array.isArray(newData)) {
                            // Legacy format support (si jamais)
                            // Idéalement on attend une structure { steps: ... }
                        } else if (newData.steps) {
                            setSteps(newData.steps);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [strategyId, setSteps]); // On retire les refs des dépendances car elles sont stables

    return { broadcastMove };
};