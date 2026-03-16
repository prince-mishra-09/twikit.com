import ImageKit from "imagekit";
import { compressImage, compressVideo } from "./compressMedia.js";

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
 * @param {string} fileContent - base64 data URI string, URL, or Buffer
 * @param {string} fileName - original file name
 * @param {string} folder - folder path in ImageKit (e.g., "profile-pics", "posts")
 * @returns {{ id: string, url: string }} - fileId and URL
 */
export const uploadFile = async (fileContent, fileName, folder = "") => {
    const result = await getImageKit().upload({
        file: fileContent,
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
 * Upload media to ImageKit with automatic compression.
 * Images → sharp WebP 3:4 | Videos → FFmpeg H.264 9:16 faststart
 *
 * @param {Buffer} buffer   - Raw file buffer from multer
 * @param {string} fileName - Original filename
 * @param {string} folder   - ImageKit folder ("posts" | "reels")
 * @param {string} mimeType - e.g. "image/jpeg" or "video/mp4"
 * @returns {{ id: string, url: string, mediaType: string }}
 */
export const uploadMedia = async (buffer, fileName, folder, mimeType) => {
    let uploadBuffer = buffer;
    let finalFileName = fileName;
    let mediaType = "image";

    if (mimeType.startsWith("image/")) {
        // Compress image: WebP, q-85, 3:4 crop
        uploadBuffer = await compressImage(buffer);
        finalFileName = fileName.replace(/\.[^.]+$/, ".webp");
        mediaType = "image";
    } else if (mimeType.startsWith("video/")) {
        // Compress video: H.264, CRF 26, 9:16, faststart
        uploadBuffer = await compressVideo(buffer);
        finalFileName = fileName.replace(/\.[^.]+$/, ".mp4");
        mediaType = "video";
    }

    const base64 = uploadBuffer.toString("base64");
    const dataUri = `data:${mimeType.startsWith("video") ? "video/mp4" : "image/webp"};base64,${base64}`;

    const result = await getImageKit().upload({
        file: dataUri,
        fileName: finalFileName,
        folder: `/xwaked/${folder}`,
        useUniqueFileName: true,
        tags: [folder, mediaType],
    });

    const finalUrl = result.url.replace("ik.imagekit.io", "ik.imgkit.net");

    return {
        id: result.fileId,
        url: finalUrl,
        thumbnailUrl: result.thumbnailUrl || null,
        mediaType,
    };
};

export default getImageKit;
