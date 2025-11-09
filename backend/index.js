import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./database/db.js";
import cloudinary from 'cloudinary'
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js"
import {io,server,app} from "./socket/socket.js"
import User from "./models/userModel.js";
import path from 'path'

dotenv.config();

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
})


const port = process.env.PORT;

app.use(cookieParser())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.send("TWIKIT.COM");
})
import { Chat } from "./models/chatModel.js";
app.get("/api/messages/chats", isAuth, async (req, res) => {
    try {
        const chats = await Chat.find({
            users: req.user._id,
        }).populate({
            path: "users",
            select: "name profilePic",
        })

        chats.forEach((e) => {
            e.users = e.users.filter(
                user => user._id.toString() !== req.user._id.toString()
            )
        })
        res.json(chats)
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
})

app.get("/api/user/all", isAuth, async (req, res) => {
    try {
        const search = req.query.search || ""
    const users = await User.find({
         name: {
        $regex: search,
        $options: "i"
    },
    _id:{$ne:req.user._id},
    }).select("-password");
   
    res.json(users)
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
})
// importing routes
import userRoutes from "./routes/userRoutes.js"
import postRoutes from "./routes/postRoutes.js"

import messageRoutes from "./routes/messageRoutes.js"
import { isAuth } from "./middlewares/isAuth.js";

app.use("/api/user", userRoutes)
app.use("/api/post", postRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes)

// const __dirname = path.resolve()

// app.use(express.static(path.join(__dirname,"/frontend/dist")))

// app.get("*",(req,res)=>{
//     res.sendFile(path.join(__dirname,"frontend","dist","index.html"));
// })
server.listen(port, () => {
    console.log(`Server is running http://localhost:${port}`);
    connectDB()
});

