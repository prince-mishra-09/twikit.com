import getDataUrl from "../utils/urlGenerator.js";
import bcrypt from 'bcrypt'
import cloudinary from 'cloudinary'
import generateToken from "../utils/generateToken.js";
import User from '../models/userModel.js'
import tryCatch from "../utils/tryCatch.js";

const registerUser = tryCatch(async (req, res) => {
    const { name, email, password, gender } = req.body

    const file = req.file;

if (!file) {
  return res.status(400).json({
    message: "Profile image is required",
  });
}


    let user = await User.findOne({ email });

    if (user) {
        return res.status(400).json({
            message: "User already hai",
        });
    }

    const fileUrl = getDataUrl(file)

    const hashPassword = await bcrypt.hash(password, 10)

    const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content)

    user = await User.create({
        name,
        email,
        password: hashPassword,
        gender,
        profilePic: {
            id: myCloud.public_id,
            url: myCloud.secure_url
        }
    })


    generateToken(user._id, res)

    res.status(201).json({
        message: "user registered",
        user,
    })
})

export default registerUser


export const loginUser = tryCatch(async (req, res) => {

    const { email, password } = req.body

    const user = await User.findOne({ email })
    // console.log(req.body);
    // console.log(req.headers["content-type"]);
    // console.log(req.file);

    if (!user) return res.status(404).json({
        message: "wrong credential",
    })

    const comparePassword = await bcrypt.compare(password, user.password)

    if (!comparePassword) {
        return res.status(400).json({
            message: "invalid"
        })
    }

    generateToken(user._id, res);
    res.json({
        message: "user loggedin",
        user,
    })
})

export const logoutUser = tryCatch((req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  res.json({
    message: "logout successfully",
  });
});
