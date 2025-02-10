import mongoose, { Schema } from "mongoose";

const reviewSchema= new Schema({
    comment:{
        type:String
    },
    rating:{
        type:Number,
        required:true,
        min:1,
        max:5
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required:true
    }
},{timestamps:true})

export const Review=mongoose.model("Review",reviewSchema)