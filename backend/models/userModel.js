import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    maxLength: 120,
    default: "",
  },
  link: {
    type: String,
    default: "",
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
  savedPosts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  hiddenPosts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post"
    }
  ],
  mutedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  isPrivate: {
    type: Boolean,
    default: false,
  },
  followRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],
  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],
  pushSubscriptions: [
    {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String
      }
    }
  ],
}, {
  timestamps: true
});

// Indexes for performance optimization
userSchema.index({ email: 1 }, { unique: true }); // Login/auth lookups
userSchema.index({ username: 1 }, { unique: true, sparse: true }); // Profile lookups
userSchema.index({ name: 1 }); // Search by name

const User = mongoose.model("User", userSchema);
export default User;
