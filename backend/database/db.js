import mongoose from "mongoose";


export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_CONNECTION, {
            dbName: "twikitcom"
        })

        console.log("Connected to db")
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1); // Exit process with failure code to trigger restart in production
    }
}