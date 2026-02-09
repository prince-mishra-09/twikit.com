
import mongoose from "mongoose";
import { Post } from "../models/postModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Manual .env parsing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");
const envPath = path.join(rootDir, ".env");

let mongoUri = "";

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, ''); // basic unquote
            if (key.trim() === 'MONGO_CONNECTION' || key.trim() === 'MONGO_URI') {
                mongoUri = value;
                break;
            }
        }
    }
}

if (!mongoUri) {
    // Fallback if not found or empty
    console.log("MONGO_CONNECTION/MONGO_URI not found in .env, trying process.env...");
    mongoUri = process.env.MONGO_CONNECTION || process.env.MONGO_URI;
}

if (!mongoUri) {
    console.error("MONGO_URI is missing. Cannot continue.");
    process.exit(1);
}

console.log("Found Mongo URI (masked):", mongoUri.substring(0, 15) + "...");

const migrateCaptions = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(mongoUri, { dbName: "twikitcom" });
        console.log("Connected to DB successfully.");

        const totalPosts = await Post.countDocuments();
        console.log(`Total Posts in DB: ${totalPosts}`);

        console.log("Running updateMany...");
        const result = await Post.updateMany(
            {
                $or: [
                    { caption: { $exists: false } },
                    { caption: "" },
                    { caption: null },
                    { caption: { $regex: /^\s*$/ } }
                ]
            },
            { $set: { caption: "______" } }
        );

        console.log(`Migration Complete.`);
        console.log(`Matched Documents: ${result.matchedCount}`);
        console.log(`Modified Documents: ${result.modifiedCount}`);

        await mongoose.disconnect();
        console.log("Disconnected from DB.");
        process.exit(0);
    } catch (error) {
        console.error("Migration Failed with Error:");
        console.error(error);
        process.exit(1);
    }
};

migrateCaptions();
