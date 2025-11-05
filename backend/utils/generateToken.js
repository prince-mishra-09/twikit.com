import jwt from 'jsonwebtoken'

const generateToken = (id,res)=>{

     if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set in environment");
  }
    const token = jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:"15d",
    });

    res.cookie("token",token,{
        maxAge:15*24*60*60*1000,
        httpOnly: true,
        sameSite: "strict",
    });
}

export default generateToken;