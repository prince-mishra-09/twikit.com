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
 * Compresses an image from disk to WebP format enforcing a specific aspect ratio.
 * Reduces file size by 60-80% with no visible quality loss.
 *
 * @param {string} inputPath   - Path to the raw file
 * @param {Object} options      - { width, height, ratio }
 * @returns {Buffer}            - Compressed WebP buffer
 */
export const compressImage = async (inputPath, options = { width: 1200, height: 1600, ratio: "3:4" }) => {
    const { width, height } = options;
    const stats = fs.statSync(inputPath);

    try {
        const buffer = await sharp(inputPath)
            .resize({
                width: width,
                height: height,
                fit: "cover",
                position: "centre",
                withoutEnlargement: true,
            })
            .webp({
                quality: 80,
                effort: 4,
                smartSubsample: true,
            })
            .toBuffer();

        // Fallback Logic: If optimized size is larger than original, return original path (or buffer of original)
        // Note: controllers expect a buffer for images if using uploadMedia correctly with Sharp.
        // Actually, if it returns a buffer, we should compare buffer length.
        if (buffer.length > stats.size) {
            console.log(`[SHARP] Optimized image (${(buffer.length / 1024).toFixed(2)} KB) is larger than original (${(stats.size / 1024).toFixed(2)} KB). Falling back.`);
            return fs.readFileSync(inputPath);
        }

        console.log(`[SHARP] Compression complete. ${(stats.size / 1024).toFixed(2)} KB -> ${(buffer.length / 1024).toFixed(2)} KB`);
        return buffer;
    } catch (error) {
        console.error("Error compressing image:", error);
        return fs.readFileSync(inputPath);
    }
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

        const stats = fs.statSync(inputPath);
        console.log(`[FFMPEG] Starting compression. Original size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

        ffmpeg(inputPath)
            // ── Video Settings ──────────────────────────────────────────
            .videoCodec("libx264")          // H.264
            .addOption("-crf", "28")         // User requested 28 (Better quality/size balance)
            .addOption("-preset", "fast")    // Faster encoding for better server performance
            .addOption("-profile:v", "main")
            .addOption("-level", "4.0")
            .addOption("-pix_fmt", "yuv420p")
            // Strict bitrate limits to prevent size explosion
            .addOption("-maxrate", "2M")     // User requested 2M
            .addOption("-bufsize", "4M")
            // 9:16 Crop-to-Fill: Ensures the video fills the 1080x1920 screen (Instagram/Reels Style)
            .videoFilters("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920")
            // ── Audio Settings ───────────────────────────────────────────
            .audioCodec("aac")
            .audioBitrate("128k")            
            // ── Container/Streaming ──────────────────────────────────────
            .addOption("-movflags", "+faststart") // Moov atom first → instant play
            .format("mp4")
            .output(outputPath)
            .on("start", (cmd) => {
                console.log(`[FFMPEG] Running: ${cmd}`);
            })
            .on("end", () => {
                const originalStats = fs.statSync(inputPath);
                const optimizedStats = fs.statSync(outputPath);

                const originalMB = (originalStats.size / (1024 * 1024)).toFixed(2);
                const optimizedMB = (optimizedStats.size / (1024 * 1024)).toFixed(2);

                if (optimizedStats.size > originalStats.size) {
                    console.log(`[FFMPEG] Optimized file (${optimizedMB} MB) is larger than original (${originalMB} MB). Falling back to original.`);
                    try { fs.unlinkSync(outputPath); } catch (_) { }
                    resolve(inputPath);
                } else {
                    console.log(`[FFMPEG] Compression complete. ${originalMB} MB -> ${optimizedMB} MB`);
                    resolve(outputPath);
                }
            })
            .on("error", (err) => {
                try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
                reject(new Error(`FFmpeg compression failed: ${err.message}`));
            })
            .run();
    });
};
