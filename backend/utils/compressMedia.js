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

    return await sharp(inputPath)
        .resize({
            width: width,
            height: height,
            fit: "cover",           // Crop to fill exactly
            position: "centre",     // Center the crop
            withoutEnlargement: true, // Never upscale small images
        })
        .webp({
            quality: 80,            // Reduced from 85 for better bandwidth savings
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

        const stats = fs.statSync(inputPath);
        console.log(`[FFMPEG] Starting compression. Original size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

        ffmpeg(inputPath)
            // ── Video Settings ──────────────────────────────────────────
            .videoCodec("libx264")          // H.264
            .addOption("-crf", "30")         // Higher CRF = Lower size (30 is safe for web)
            .addOption("-preset", "medium")  
            .addOption("-profile:v", "main") // Main profile for better compatibility/size
            .addOption("-level", "4.0")
            .addOption("-pix_fmt", "yuv420p")
            // Cap bitrate to prevent size explosion (e.g., 2.5 Mbps max)
            .addOption("-maxrate", "2.5M")
            .addOption("-bufsize", "5M")
            // 9:16 Scale: Always fill 1080x1920 (Instagram style)
            // Scale to fill width/height (increase) then crop to center 1080x1920
            .addOption(
                "-vf",
                "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
            )
            // ── Audio Settings ───────────────────────────────────────────
            .audioCodec("aac")
            .audioBitrate("96k")            // Lower audio bitrate for social media
            // ── Container/Streaming ──────────────────────────────────────
            .addOption("-movflags", "+faststart") // Moov atom first → instant play
            .format("mp4")
            .output(outputPath)
            .on("end", () => {
                const outStats = fs.statSync(outputPath);
                console.log(`[FFMPEG] Compression complete. Optimized size: ${(outStats.size / (1024 * 1024)).toFixed(2)} MB`);
                resolve(outputPath); // Return the PATH not the buffer
            })
            .on("error", (err) => {
                try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
                reject(new Error(`FFmpeg compression failed: ${err.message}`));
            })
            .run();
    });
};
