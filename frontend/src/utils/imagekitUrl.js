// ─────────────────────────────────────────────────────────────────
// ImageKit URL Helper — xwaked
// Generates optimized, device-specific URLs with correct aspect ratios
// Images: 3:4 | Reels/Videos: 9:16
// ─────────────────────────────────────────────────────────────────

const IMAGEKIT_BASE = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || "";

/**
 * Returns a device-responsive, optimized ImageKit image URL (3:4 ratio)
 *
 * @param {string} path   - ImageKit file path or full URL
 * @param {"mobile"|"tablet"|"desktop"|"auto"} device - Target device
 * @returns {string}      - Full optimized URL
 */
export const getImageUrl = (path, device = "auto") => {
    if (!path) return "";

    // If it's already a full URL (legacy), extract the path
    const filePath = path.startsWith("http") ? path : `${IMAGEKIT_BASE}/${path}`;

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

    // 3:4 aspect ratio: height = (4/3) * width
    const height = Math.round((4 / 3) * width);

    // If path is already a full URL, append tr params
    if (path.startsWith("http")) {
        const separator = path.includes("?") ? "&" : "?";
        return `${path}${separator}tr=w-${width},h-${height},c-maintain_ratio,q-auto,f-auto`;
    }

    return `${IMAGEKIT_BASE}/${path}?tr=w-${width},h-${height},c-maintain_ratio,q-auto,f-auto`;
};

/**
 * Returns optimized ImageKit video/reel URL (9:16 ratio)
 * Videos are not transformed via URL (ImageKit video transforms are paid),
 * but this ensures correct LQIP thumbnail URL for the poster.
 *
 * @param {string} path   - ImageKit file path or full URL
 * @param {"thumbnail"|"full"} mode - thumbnail = static poster image
 * @returns {string}
 */
export const getVideoUrl = (path, mode = "full") => {
    if (!path) return "";

    if (mode === "thumbnail") {
        // ImageKit auto-generates thumbnails for videos
        const thumbPath = path.replace(/\.(mp4|webm|mov)$/i, "/ik-thumbnail.jpg");
        const separator = thumbPath.includes("?") ? "&" : "?";
        return `${thumbPath}${separator}tr=w-480,h-853,q-auto,f-auto`; // 9:16 thumb
    }

    return path; // return raw video URL for <video> tag
};

/**
 * srcSet string for responsive image rendering in <img> or IKImage
 * Encodes widths for Mobile (480px), Tablet (900px), Desktop (1200px)
 * All at 3:4 aspect ratio
 *
 * @param {string} path
 * @returns {string} srcset attribute string
 */
export const getSrcSet = (path) => {
    if (!path) return "";

    const widths = [480, 900, 1200];
    return widths
        .map((w) => {
            const h = Math.round((4 / 3) * w);
            if (path.startsWith("http")) {
                const sep = path.includes("?") ? "&" : "?";
                return `${path}${sep}tr=w-${w},h-${h},c-maintain_ratio,q-auto,f-auto ${w}w`;
            }
            return `${IMAGEKIT_BASE}/${path}?tr=w-${w},h-${h},c-maintain_ratio,q-auto,f-auto ${w}w`;
        })
        .join(", ");
};
