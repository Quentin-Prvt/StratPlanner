import { useState, useCallback } from 'react';
import type { DrawingObject } from '../types/canvas';

export const useUndoRedo = () => {
    const [past, setPast] = useState<DrawingObject[][]>([]);
    const [future, setFuture] = useState<DrawingObject[][]>([]);

    const addToHistory = useCallback((currentData: DrawingObject[]) => {
        setPast(prev => [...prev, currentData]);
        setFuture([]);
    }, []);

    const undo = useCallback((currentData: DrawingObject[]) => {
        if (past.length === 0) return null;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        setPast(newPast);
        setFuture(prev => [currentData, ...prev]);
        return previous;
    }, [past]);

    const redo = useCallback((currentData: DrawingObject[]) => {
        if (future.length === 0) return null;
        const next = future[0];
        const newFuture = future.slice(1);
        setFuture(newFuture);
        setPast(prev => [...prev, currentData]);
        return next;
    }, [future]);

    return { addToHistory, undo, redo };
};