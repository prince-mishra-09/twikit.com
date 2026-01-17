import mongoose from "mongoose";

const verifiedEmailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    verifiedAt: {
        type: Date,
        default: Date.now,
        required: true,
        index: { expires: 600 } // Auto-delete in 10 minutes (600 seconds)
    }
});

const VerifiedEmail = mongoose.model("VerifiedEmail", verifiedEmailSchema);
export default VerifiedEmail;
