import { useEffect, useRef, useCallback } from 'react';

export const useCanvasZoom = (containerRef: React.RefObject<HTMLDivElement | null>) => {
    const transformRef = useRef({ scale: 0.75, x: 0, y: 0 });
    const contentRef = useRef<HTMLDivElement>(null);

    // CONFIGURATION
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 2.0;
    const SAFETY_MARGIN = 300; // On garde toujours au moins 100px de la map visible

    const updateTransformStyle = useCallback(() => {
        if (contentRef.current) {
            const { scale, x, y } = transformRef.current;
            contentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
            contentRef.current.style.transformOrigin = '0 0';
        }
    }, []);

    // --- FONCTION DE CALCUL DES LIMITES (CLAMP) ---
    const getClampedPosition = useCallback((targetX: number, targetY: number, currentScale: number) => {
        if (!containerRef.current || !contentRef.current) return { x: targetX, y: targetY };

        const container = containerRef.current.getBoundingClientRect();
        const contentW = contentRef.current.scrollWidth * currentScale;
        const contentH = contentRef.current.scrollHeight * currentScale;


        const minX = SAFETY_MARGIN - contentW;
        const maxX = container.width - SAFETY_MARGIN;

        // Limite Haut/Bas
        const minY = SAFETY_MARGIN - contentH;
        const maxY = container.height - SAFETY_MARGIN;

        return {
            x: Math.min(Math.max(targetX, minX), maxX),
            y: Math.min(Math.max(targetY, minY), maxY)
        };
    }, [containerRef]);

    // --- FONCTION POUR DÉPLACER LA CARTE (PAN) ---
    const panCanvas = useCallback((dx: number, dy: number) => {
        const { scale, x, y } = transformRef.current;

        // On calcule la nouvelle position théorique
        const potentialX = x + dx;
        const potentialY = y + dy;

        // On applique les limites
        const clamped = getClampedPosition(potentialX, potentialY, scale);

        transformRef.current = { scale, x: clamped.x, y: clamped.y };
        updateTransformStyle();
    }, [getClampedPosition, updateTransformStyle]);

    // --- CENTRER LA VUE ---
    const centerView = useCallback((targetScale: number = 0.75) => {
        if (!containerRef.current || !contentRef.current) return;

        const container = containerRef.current.getBoundingClientRect();
        const contentW = contentRef.current.scrollWidth;
        const contentH = contentRef.current.scrollHeight;

        const x = (container.width - contentW * targetScale) / 2;
        const y = (container.height - contentH * targetScale) / 2;

        transformRef.current = { scale: targetScale, x, y };
        updateTransformStyle();
    }, [containerRef, updateTransformStyle]);

    // --- GESTION DU ZOOM (WHEEL) ---
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();

        const delta = -e.deltaY;
        const zoomIntensity = 0.1;
        const scaleChange = delta > 0 ? (1 + zoomIntensity) : (1 / (1 + zoomIntensity));

        let newScale = transformRef.current.scale * scaleChange;
        newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

        if (newScale === transformRef.current.scale) return;

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calcul du nouveau X/Y pour zoomer vers la souris
            const rawNewX = mouseX - (mouseX - transformRef.current.x) * (newScale / transformRef.current.scale);
            const rawNewY = mouseY - (mouseY - transformRef.current.y) * (newScale / transformRef.current.scale);

            // On applique aussi les limites lors du zoom pour ne pas sortir de l'écran
            const clamped = getClampedPosition(rawNewX, rawNewY, newScale);

            transformRef.current = { scale: newScale, x: clamped.x, y: clamped.y };
            updateTransformStyle();
        }
    }, [containerRef, updateTransformStyle, getClampedPosition]);

    // --- INITIALISATION ---
    useEffect(() => {
        const timer = setTimeout(() => { centerView(0.75); }, 100);
        const resizeObserver = new ResizeObserver(() => { centerView(transformRef.current.scale); });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
            containerRef.current.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            clearTimeout(timer);
            resizeObserver.disconnect();
            if (containerRef.current) containerRef.current.removeEventListener('wheel', handleWheel);
        };
    }, [containerRef, handleWheel, centerView]);

    return { transformRef, contentRef, updateTransformStyle, centerView, panCanvas };
};