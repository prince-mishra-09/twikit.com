import mongoose from "mongoose";


export const connectDB = async ()=>{
    try {
        mongoose.connect(process.env.MONGO_CONNECTION,{
            dbName:"twikitcom"
        })

        console.log("Connected to db")
    } catch (error) {
        console.log(error)
    }
}