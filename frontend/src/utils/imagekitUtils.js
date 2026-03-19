/**
 * Unified ImageKit Utility for xwaked (twikit.com)
 * Consolidates getOptimizedImg, imagekitUrl.js, and IKImage logic.
 * 
 * Features:
 * - Domain Sync (Forces ik.imagekit.io)
 * - Unified 3:4 Post Transformations
 * - Smart Cache Busting for Profile Pics (?v=timestamp)
 * - Bandwidth Optimization (Capped thumbnails)
 */

const IMAGEKIT_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/v8y6p6n9p";

/**
 * Generates an optimized ImageKit URL with specified transformations.
 * 
 * @param {string} url - Raw Image URL (full or path)
 * @param {object} options - Optimization options
 * @returns {string} - Optimized URL
 */
export const getOptimizedImage = (url, options = {}) => {
  if (!url) return "";

  const {
    width,
    height,
    cropMode = "at_max",
    quality = "auto",
    format = "auto",
    isProfilePic = false,
    updatedAt,
    isPost = false,
    isChatThumbnail = false,
  } = options;

  // 1. Normalize & Domain Sync: Force ik.imagekit.io across the app
  let cleanUrl = url;
  if (!url.startsWith("http")) {
    // If it's a relative path, prefix with endpoint
    const base = IMAGEKIT_ENDPOINT.endsWith("/") ? IMAGEKIT_ENDPOINT.slice(0, -1) : IMAGEKIT_ENDPOINT;
    cleanUrl = `${base}/${url.startsWith("/") ? url.slice(1) : url}`;
  }

  cleanUrl = cleanUrl.replace("ik.imgkit.net", "ik.imagekit.io");

  // If it's not an ImageKit URL, we can't transform it via IK params
  if (!cleanUrl.includes("ik.imagekit.io")) return cleanUrl;

  // 2. Clean: Remove existing tr: segments but PRESERVE version if no updatedAt provided
  const existingVersion = cleanUrl.includes("?v=") ? cleanUrl.split("?v=")[1].split("&")[0] : null;
  cleanUrl = cleanUrl.replace(/\/tr:[^/]+\//, "/").split("?")[0];
  
  // 3. Select Transformation Strategy
  let transforms = [];

  if (isProfilePic) {
    // Phase 2 Upgrade: Avatar Snapping (Strict 100px / 300px) for maximum CDN HITs
    let picSize = 100; // Snap all small/medium avatars to 100px
    if (width > 100) picSize = 300; // Snap large profile pictures to 300px

    transforms = [`w-${picSize}`, `h-${picSize}`, "f-auto", "q-auto", "c-at_max"];
  } else if (isPost) {
    // Unified 3:4 Transformation for consistency
    transforms = ["w-600", "f-auto", "q-auto", "c-at_max"];
  } else if (isChatThumbnail) {
    // Patch Bandwidth Leaks: Cap thumbnails at 300px
    transforms = ["w-300", "f-auto", "q-auto", "c-at_max"];
  } else {
    // Custom transformations
    transforms.push(`f-${format}`);
    transforms.push(`q-${quality}`);
    if (width) transforms.push(`w-${width}`);
    if (height) transforms.push(`h-${height}`);
    transforms.push(`c-${cropMode}`);
  }

  const trString = `tr:${transforms.join(",")}`;

  try {
    const urlObj = new URL(cleanUrl);
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);
    
    // Structure: https://ik.imagekit.io/<id>/<tr-string>/<path...>
    if (pathSegments.length >= 1) {
      const ikId = pathSegments[0];
      const filePath = pathSegments.slice(1).join("/");
      urlObj.pathname = `/${ikId}/${trString}/${filePath}`;
    }

    // 4. Smart Cache Busting for Profile Pictures (100% Consistent)
    if (isProfilePic) {
        // Enforce database-driven versioning or preserve existing one
        let v = 0; // Default fallback to avoid "Miss" due to missing param
        
        if (updatedAt) {
            v = new Date(updatedAt).getTime();
        } else if (existingVersion) {
            v = existingVersion;
        }

        urlObj.searchParams.set("v", v);
    }

    return urlObj.toString();
  } catch (e) {
    return cleanUrl;
  }
};

/**
 * Generates optimized video thumbnail URL (9:16 by default)
 */
export const getOptimizedVideoThumbnail = (url, options = {}) => {
    if (!url) return "";

    // ImageKit auto-generates thumbnails for videos
    const thumbUrl = url.replace(/\.(mp4|webm|mov)$/i, "/ik-thumbnail.jpg");

    return getOptimizedImage(thumbUrl, {
        width: options.width || 480,
        height: options.height || 853, // 9:16
        cropMode: "at_max",
        ...options
    });
};
