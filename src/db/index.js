import mongoose from "mongoose";

const dbConnect=async () => {
    try {
        await mongoose.connect(`${process.env.MONGOOSE_URI}/${process.env.DB_NAME}`)
        console.log(`DB connected`)
    } catch (error) {
        console.log("DB connection failed",error)
    }
}

export default dbConnect;