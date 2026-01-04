import jwt from "jsonwebtoken";

const generateToken = (id, res) => {
  const token = jwt.sign({ _id: id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "none",   // ✅ VERY IMPORTANT
    secure: true,     // ✅ localhost ke liye FALSE
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export default generateToken;
