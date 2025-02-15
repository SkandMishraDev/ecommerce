const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  category: {
    type: String,
    enum:["electronics","fashion","grocery"],
    required: [true, 'Product category is required'],
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
  },
  stock: {
    type: Number,
    required: [true, 'Stock count is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  images: [
    {
      type: String,  //cloudinary
      required: [true, 'Product image URL is required'],
    },
  ],
  owner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  }
})

export const Product=mongoose.model("Product",productSchema)
