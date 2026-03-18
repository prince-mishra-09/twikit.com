import ImageKit from "imagekit";
import { compressImage, compressVideo } from "./compressMedia.js";
import fs from "fs";

let _imagekit = null;

/**
 * Get the ImageKit instance (lazy initialization)
 * This ensures env vars are loaded before ImageKit is initialized
 */
function getImageKit() {
    if (!_imagekit) {
        _imagekit = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        });
    }
    return _imagekit;
}

/**
 * Upload a file to ImageKit
 * @param {string|Buffer|Stream} fileSource - Path to file, Buffer, or Stream
 * @param {string} fileName - original file name
 * @param {string} folder - folder path in ImageKit (e.g., "profile-pics", "posts")
 * @returns {{ id: string, url: string }} - fileId and URL
 */
export const uploadFile = async (fileSource, fileName, folder = "") => {
    const result = await getImageKit().upload({
        file: fileSource,
        fileName: fileName || `file_${Date.now()}`,
        folder: folder,
        useUniqueFileName: true,
    });
    // The SDK sometimes returns the default ik.imagekit.io domain regardless of urlEndpoint setting.
    // Force the working alternate domain ik.imgkit.net to prevent 504 Gateway errors.
    const finalUrl = result.url.replace("ik.imagekit.io", "ik.imgkit.net");

    return {
        id: result.fileId,
        url: finalUrl,
    };
};

/**
 * Delete a file from ImageKit by fileId
 * @param {string} fileId - The ImageKit fileId
 */
export const deleteFile = async (fileId) => {
    if (!fileId) return;
    await getImageKit().deleteFile(fileId);
};


/**
 * Upload media to ImageKit with automatic local compression.
 * Enforces specific aspect ratios and formats based on folder/profile.
 *
 * @param {string} filePath - Path to raw file from multer
 * @param {string} fileName - Original filename
 * @param {string} folder   - ImageKit folder ("posts" | "reels" | "stories" | "profile-pics")
 * @param {string} mimeType - e.g. "image/jpeg" or "video/mp4"
 * @returns {{ id: string, url: string, thumbnailUrl: string, mediaType: string }}
 */
export const uploadMedia = async (filePath, fileName, folder, mimeType) => {
    let uploadSource = filePath;
    let finalFileName = fileName;
    let mediaType = "image";
    let isTempFile = false;

    // Remove leading/trailing slashes for consistency
    const cleanFolder = folder.replace(/^\/+|\/+$/g, "");

    if (mimeType.startsWith("image/")) {
        // Use Sharp for local compression
        // Default to 3:4 for posts/stories/reels, square for profile-pics
        const isProfilePic = cleanFolder === "profile-pics";
        const options = isProfilePic
            ? { width: 500, height: 500, ratio: "1:1" }
            : { width: 1200, height: 1600, ratio: "3:4" };

        uploadSource = await compressImage(filePath, options);
        finalFileName = fileName.replace(/\.[^.]+$/, ".webp");
        mediaType = "image";
    } else if (mimeType.startsWith("video/")) {
        // Use FFmpeg for local compression (9:16 vertical)
        uploadSource = await compressVideo(filePath);
        finalFileName = fileName.replace(/\.[^.]+$/, ".mp4");
        mediaType = "video";
        isTempFile = true;
    }

    console.log(`[IMAGEKIT] Uploading ${mediaType} to folder xwaked/${cleanFolder}. Source: ${isTempFile ? "Optimized Temp File" : "Raw Buffer"}`);

    const result = await getImageKit().upload({
        file: isTempFile ? fs.createReadStream(uploadSource) : uploadSource,
        fileName: finalFileName,
        folder: `/xwaked/${cleanFolder}`,
        useUniqueFileName: true,
        tags: [cleanFolder, mediaType],
    });

    // Cleanup the temporary compressed video file if created
    if (isTempFile && uploadSource !== filePath) {
        try { fs.unlinkSync(uploadSource); } catch (_) {}
    }

    const finalUrl = result.url.replace("ik.imagekit.io", "ik.imgkit.net");

    return {
        id: result.fileId,
        url: finalUrl,
        thumbnailUrl: result.thumbnailUrl || null,
        mediaType,
    };
};

export default getImageKit;
