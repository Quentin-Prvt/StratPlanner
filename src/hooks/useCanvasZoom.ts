import { useRef, useEffect } from 'react';


export const useCanvasZoom = (containerRef: React.RefObject<HTMLDivElement | null>) => {
    const transformRef = useRef({ scale: 1, x: 0, y: 0 });
    const contentRef = useRef<HTMLDivElement>(null);

    const updateTransformStyle = () => {
        if (contentRef.current) {
            const { x, y, scale } = transformRef.current;
            contentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const { scale, x, y } = transformRef.current;

            const newScale = Math.min(Math.max(0.1, scale + (e.deltaY > 0 ? -1 : 1) * 0.1 * scale), 5);

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const scaleRatio = newScale / scale;

            const newX = mouseX - (mouseX - x) * scaleRatio;
            const newY = mouseY - (mouseY - y) * scaleRatio;

            transformRef.current = { scale: newScale, x: newX, y: newY };
            updateTransformStyle();
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, []);
    return { transformRef, contentRef, updateTransformStyle };
};