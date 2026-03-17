/**
 * XwakedMedia — Universal Media Component for xwaked
 *
 * Handles both images (3:4) and videos (9:16) with:
 *   - LQIP: blurred low-quality placeholder while loading
 *   - Responsive srcSet: serves 480/900/1200px based on viewport
 *   - Video: poster thumbnail + lazy play on enter
 *
 * Usage:
 *   <XwakedMedia post={post.post} type={post.type} alt="caption" />
 */

import { useState, useEffect, useRef } from "react";
import { IKContext, IKImage } from "imagekitio-react";
import { getVideoUrl } from "../utils/imagekitUrl.js";
import "./XwakedMedia.css";

const IMAGEKIT_URL = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || "";

// ─────────────────────────────────────────────────────────────────
// Sub-component: Optimized Image with LQIP + srcSet (3:4)
// ─────────────────────────────────────────────────────────────────
function XwakedImage({ url, alt, className }) {
    const [loaded, setLoaded] = useState(false);

    // Extract the relative path from the full URL for IKImage
    const ikPath = url ? url.replace(IMAGEKIT_URL, "").replace(/^https?:\/\/ik\.imgkit\.net\/[^/]+/, "") : "";

    // If IKImage path resolution fails, fall back to direct srcSet
    const isFallback = !IMAGEKIT_URL || !ikPath.startsWith("/");

    const buildSrcSetUrl = (width) => {
        const height = Math.round((4 / 3) * width);
        const sep = url.includes("?") ? "&" : "?";
        return `${url}${sep}tr=w-${width},h-${height},c-maintain_ratio,q-auto,f-auto`;
    };

    if (isFallback && url) {
        return (
            <div className={`xwaked-media-wrapper ${className || ""}`}>
                {!loaded && <div className="xwaked-lqip-blur" />}
                <img
                    src={buildSrcSetUrl(900)}
                    srcSet={`
                        ${buildSrcSetUrl(480)} 480w,
                        ${buildSrcSetUrl(900)} 900w,
                        ${buildSrcSetUrl(1200)} 1200w
                    `}
                    sizes="(max-width: 640px) 480px, (max-width: 1024px) 900px, 1200px"
                    alt={alt || "post"}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setLoaded(true)}
                    className={`xwaked-image ${loaded ? "xwaked-image--loaded" : ""}`}
                    style={{ aspectRatio: "3/4" }}
                    crossOrigin="anonymous"
                />
            </div>
        );
    }

    return (
        <IKContext urlEndpoint={IMAGEKIT_URL}>
            <div className={`xwaked-media-wrapper ${className || ""}`}>
                {!loaded && <div className="xwaked-lqip-blur" />}
                <IKImage
                    path={ikPath}
                    transformation={[{
                        width: "900",
                        height: "1200",        // 3:4
                        cropMode: "maintain_ratio",
                        quality: "auto",
                        format: "auto",
                    }]}
                    srcSet={[
                        { width: "480",  height: "640"  },  // Mobile  3:4
                        { width: "900",  height: "1200" },  // Tablet  3:4
                        { width: "1200", height: "1600" },  // Desktop 3:4
                    ]}
                    sizes="(max-width: 640px) 480px, (max-width: 1024px) 900px, 1200px"
                    lqip={{ active: true, quality: 10, blur: 20 }}
                    loading="lazy"
                    alt={alt || "post"}
                    onLoad={() => setLoaded(true)}
                    className={`xwaked-image ${loaded ? "xwaked-image--loaded" : ""}`}
                    style={{ aspectRatio: "3/4" }}
                    crossOrigin="anonymous"
                />
            </div>
        </IKContext>
    );
}

// ─────────────────────────────────────────────────────────────────
// Sub-component: Optimized Video/Reel (9:16)
// ─────────────────────────────────────────────────────────────────
function XwakedVideo({ url, thumbnailUrl, className }) {
    const videoRef = useRef(null);
    const [showPoster, setShowPoster] = useState(true);

    // Poster: auto-generated ImageKit thumbnail or from props
    const poster = thumbnailUrl || getVideoUrl(url, "thumbnail");

    // Lazy play: only load video source when near viewport
    useEffect(() => {
        if (!videoRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShowPoster(false);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );
        observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            className={`xwaked-media-wrapper ${className || ""}`}
            style={{ aspectRatio: "9/16" }}
        >
            <video
                ref={videoRef}
                src={showPoster ? undefined : url}
                poster={poster}
                preload={showPoster ? "none" : "metadata"}
                playsInline
                loop
                muted
                controls
                className="xwaked-video"
                style={{ aspectRatio: "9/16" }}
                crossOrigin="anonymous"
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Main: XwakedMedia — auto-routes to Image or Video
// ─────────────────────────────────────────────────────────────────
/**
 * @param {{ url: string, thumbnailUrl?: string, mediaType?: "image"|"video" }} post
 * @param {"post"|"reel"} type
 * @param {string} alt
 * @param {string} className
 */
function XwakedMedia({ post, type, alt, className }) {
    if (!post || !post.url) return null;

    // Detect media type: use stored mediaType or infer from type/URL
    const isVideo =
        post.mediaType === "video" ||
        type === "reel" ||
        /\.(mp4|webm|mov)(\?|$)/i.test(post.url);

    if (isVideo) {
        return (
            <XwakedVideo
                url={post.url}
                thumbnailUrl={post.thumbnailUrl}
                className={className}
            />
        );
    }

    return (
        <XwakedImage
            url={post.url}
            alt={alt}
            className={className}
        />
    );
}

export default XwakedMedia;
