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
import { getOptimizedImage, getOptimizedVideoThumbnail } from "../utils/imagekitUtils.js";
import useIntersectionObserver from "../hooks/useIntersectionObserver.js";
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
        // Use unified optimized utility even in fallback for consistent domain/params
        return getOptimizedImage(url, { width, height, cropMode: "at_max" });
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
                        width: "600",
                        height: "800",        // 3:4 Unified
                        cropMode: "at_max",
                        quality: "auto",
                        format: "auto",
                    }]}
                    srcSet={[
                        { width: "480",  height: "640"  },  // Mobile  3:4
                        { width: "600",  height: "800" },  // Unified default
                        { width: "900",  height: "1200" },  // Tablet  3:4
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
function XwakedVideo({ url, thumbnailUrl, updatedAt, isNext, className }) {
    const videoRef = useRef(null);
    const isIntersecting = useIntersectionObserver(videoRef);

    // Poster: Always use optimized version
    const poster = getOptimizedVideoThumbnail(thumbnailUrl || url, { updatedAt });

    // Enforce fixed versioning even for raw MP4 URLs if possible
    const videoSrc = url && url.includes("?") ? url : (updatedAt ? `${url}?v=${new Date(updatedAt).getTime()}` : url);

    // Dynamic Playback & Aggressive Memory Management
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        
        if (isIntersecting) {
            video.play().catch(() => {
                /* Silent fail: Autoplay often blocked until user interaction */
            });
        } else if (isNext) {
            video.pause();
        } else {
            // "The Nuclear Option": Force browser to kill the connection
            video.pause();
            video.removeAttribute("src");
            video.load();
            video.currentTime = 0;
        }
    }, [isIntersecting, isNext]);

    return (
        <div
            className={`xwaked-media-wrapper ${className || ""}`}
            style={{ aspectRatio: "9/16" }}
        >
            <video
                ref={videoRef}
                // Strict Source Guard: Omit src attribute entirely if not intersecting/next
                src={(isIntersecting || isNext) ? videoSrc : undefined}
                poster={poster}
                preload={isIntersecting ? "auto" : isNext ? "metadata" : "none"}
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
 * @param {boolean} isNext
 * @param {string} className
 */
function XwakedMedia({ post, type, alt, isNext, className }) {
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
                updatedAt={post.updatedAt}
                isNext={isNext}
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
