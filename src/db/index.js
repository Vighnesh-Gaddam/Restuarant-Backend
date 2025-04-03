import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // console.log(`MongoDB Connected!!! DB:${connectionInstance}`)
        console.log("MongoDB Connected!!! DB:", connectionInstance.connection.host)
    } catch (error) {
        console.log("MongoDB Connection error ", error);
        process.exit(1)
    }
}

export default connectDB;