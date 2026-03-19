import { getOptimizedImage, getOptimizedVideoThumbnail } from "./imagekitUtils";

/**
 * Returns a device-responsive, optimized ImageKit image URL (3:4 ratio)
 */
export const getImageUrl = (path, device = "auto") => {
    if (!path) return "";

    const deviceWidths = {
        mobile: 480,
        tablet: 900,
        desktop: 1200,
    };

    let width;
    if (device === "auto") {
        const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
        width = vw <= 640 ? 480 : vw <= 1024 ? 900 : 1200;
    } else {
        width = deviceWidths[device] || 800;
    }

    const height = Math.round((4 / 3) * width);

    return getOptimizedImage(path, { width, height });
};

/**
 * Returns optimized ImageKit video/reel URL (9:16 ratio)
 */
export const getVideoUrl = (path, mode = "full") => {
    if (!path) return "";
    if (mode === "thumbnail") {
        return getOptimizedVideoThumbnail(path);
    }
    return path;
};

/**
 * srcSet string for responsive image rendering
 */
export const getSrcSet = (path) => {
    if (!path) return "";

    const widths = [480, 900, 1200];
    return widths
        .map((w) => {
            const h = Math.round((4 / 3) * w);
            const url = getOptimizedImage(path, { width: w, height: h });
            return `${url} ${w}w`;
        })
        .join(", ");
};
