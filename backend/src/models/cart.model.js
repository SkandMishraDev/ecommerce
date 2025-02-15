import mongoose, { Schema } from "mongoose";

const cartSchema=new Schema({
    product:[{
        product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required:[true,"Product id is required"],
    },
        quantity:{
            type:Number,
            required:[true,"quantity can't be negative"],
            min:0,
            default:1
        }
    }],
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true,"user id is required"]
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0,
      },
})

export const Cart=mongoose.model("Cart",cartSchema)