import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";

// Configure FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// ─────────────────────────────────────────────
// IMAGE COMPRESSION — 3:4 aspect ratio, WebP
// ─────────────────────────────────────────────

/**
 * Compresses an image from disk to WebP format enforcing a 3:4 aspect ratio.
 * Reduces file size by 60-80% with no visible quality loss.
 *
 * @param {string} inputPath   - Path to the raw file
 * @returns {Buffer}            - Compressed WebP buffer
 */
export const compressImage = async (inputPath) => {
    // Target dimensions: max 2048px wide, 3:4 ratio = height is (4/3) * width
    const MAX_WIDTH = 2048;
    const MAX_HEIGHT = Math.round((4 / 3) * MAX_WIDTH); // 2731

    return await sharp(inputPath)
        .resize({
            width: MAX_WIDTH,
            height: MAX_HEIGHT,
            fit: "cover",           // Crop to fill 3:4 exactly
            position: "centre",     // Center the crop
            withoutEnlargement: true, // Never upscale small images
        })
        .webp({
            quality: 85,            // Sweet spot: invisible quality loss vs file size
            effort: 4,              // Encoding effort (0-6), 4 = fast+good
            smartSubsample: true,   // Better color subsampling
        })
        .toBuffer();
};

// ─────────────────────────────────────────────
// VIDEO COMPRESSION — 9:16 aspect ratio, H.264
// ─────────────────────────────────────────────

/**
 * Compresses a video from disk using FFmpeg for 9:16 vertical reels.
 * Enforces H.264, CRF 26, faststart for instant play.
 *
 * @param {string} inputPath  - Path to input video file
 * @returns {string}          - Path to compressed MP4 file
 */
export const compressVideo = (inputPath) => {
    return new Promise((resolve, reject) => {
        const tmpDir = os.tmpdir();
        const outputPath = path.join(tmpDir, `xwaked_out_${Date.now()}.mp4`);

        ffmpeg(inputPath)
            // ── Video Settings ──────────────────────────────────────────
            .videoCodec("libx264")          // H.264: Universal device support
            .addOption("-crf", "26")         // Quality (18-28). 26 = sweet spot for mobile
            .addOption("-preset", "fast")    // Compression speed/ratio balance
            // 9:16 Scale: scale to 1080 wide, pad vertically to maintain 9:16 = 1920px height
            .addOption(
                "-vf",
                "scale=1080:1920:force_original_aspect_ratio=decrease," +
                "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black"
            )
            .addOption("-r", "30")           // 30fps: smooth + low data
            // ── Audio Settings ───────────────────────────────────────────
            .audioCodec("aac")              // AAC: Best quality/size
            .audioBitrate("128k")           // 128kbps stereo
            // ── Container/Streaming ──────────────────────────────────────
            .addOption("-movflags", "+faststart") // Moov atom first → instant play
            .format("mp4")
            .output(outputPath)
            .on("end", () => {
                resolve(outputPath); // Return the PATH not the buffer
            })
            .on("error", (err) => {
                try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
                reject(new Error(`FFmpeg compression failed: ${err.message}`));
            })
            .run();
    });
};
