import ImageKit from "imagekit";

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

export default getImageKit;
