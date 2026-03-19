import { useEffect, useState } from "react";

/**
 * useIntersectionObserver — Standardized hook for xwaked
 * 
 * @param {React.RefObject} elementRef - Ref of the element to observe
 * @param {Function} callback - Optional callback on intersection change
 * @param {Object} options - IntersectionObserver options (threshold, root, etc)
 * @returns {boolean} - isIntersecting state
 */
const useIntersectionObserver = (elementRef, callback, options = { threshold: 0.1, rootMargin: "0px" }) => {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            const status = entry.isIntersecting;
            setIsIntersecting(status);
            if (callback) callback(entry);
        }, options);

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [elementRef, options, callback]);

    return isIntersecting;
};

export default useIntersectionObserver;
