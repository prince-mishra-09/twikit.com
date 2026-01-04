import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female"]
  },
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // keep consistent
    }
  ],
  followings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  profilePic: {
    id: String,
    url: String
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);
export default User;
