
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Post } from "../models/postModel.js";

dotenv.config();

const migrateVibes = async () => {
    try {
        if (!process.env.MONGO_CONNECTION) {
            throw new Error("MONGO_CONNECTION is not defined");
        }

        await mongoose.connect(process.env.MONGO_CONNECTION, {
            dbName: "twikitcom",
        });

        console.log("Connected to DB for Migration...");

        // 1. Rename existing fields in Posts
        console.log("Starting Post field rename...");
        const postResult = await Post.updateMany(
            {},
            {
                $rename: {
                    "reals": "vibesUp",
                    "reflections": "vibesDown"
                }
            }
        );
        console.log(`Post Migration: Modified ${postResult.modifiedCount} documents.`);

        // 2. Migrate Notification Types
        console.log("Starting Notification type migration...");
        const { Notification } = await import("../models/Notification.js");

        const notifResult1 = await Notification.updateMany(
            { type: "real" },
            { $set: { type: "vibeUp" } }
        );
        console.log(`Notification Migration (Real -> VibeUp): Modified ${notifResult1.modifiedCount} documents.`);

        const notifResult2 = await Notification.updateMany(
            { type: "reflect" },
            { $set: { type: "vibeDown" } }
        );
        console.log(`Notification Migration (Reflect -> VibeDown): Modified ${notifResult2.modifiedCount} documents.`);


        process.exit(0);
    } catch (error) {
        console.error("Migration Failed:", error);
        process.exit(1);
    }
};

migrateVibes();
