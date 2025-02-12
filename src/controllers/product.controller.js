import mongoose from "mongoose";
import { Product } from "../models/product.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";

export const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, brand, stock } = req.body;

    const hasEmptyField = [name, description, category, brand].some(item => !item?.trim())

    if (hasEmptyField) {
        throw new ApiError(400, "All fields are required");
    }

    if (price < 0 || price === undefined ) {
        throw new ApiError(400, "Price cannot be negative");
    }
    if (stock < 0 || stock === undefined) {
        throw new ApiError(400, "Stock cannot be negative");
    }

    const imageLocalPath = (req.files?.images || []).map((file) => file.path);
    
    if(imageLocalPath.length === 0){
        throw new ApiError(400,"At least one product image is required")
    }

    const uploadedImages = await Promise.all(
        imageLocalPath.map((file) => uploadOnCloudinary(file))
    );
    const imageUrls = uploadedImages.map(img => img.url);
    
    if (!uploadedImages.every(img => img.url)) {
        throw new ApiError(400, "Error while uploading some product images");
    }
       
    const product = await Product.create({
        name : name.toLowerCase(),
        description,
        price,
        category,
        brand,
        stock,
        images:imageUrls,
        owner: req.user._id,  // Product creator
    });
                                    
    const createdProduct = await Product.findById(product._id).populate("owner", "name email");

    if (!createdProduct) {
        throw new ApiError(500, "Something went wrong while creating the product");
    }

    return res.status(201).json(
        new ApiResponse(201, createdProduct, "Product created successfully")
    );
 
})

export const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId).populate("owner", "name email");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(new ApiResponse(200, product, "Product details fetched successfully"));
});

export const getAllProducts = asyncHandler(async (req,res) => {
    let { category, brand, minPrice, maxPrice, sort, page, limit } = req.query;

    let query = {};

    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (minPrice) query.price = { ...query.price, $gte: minPrice };
    if (maxPrice) query.price = { ...query.price, $lte: maxPrice };
})

export const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { name, description, price, category, brand, stock } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (!product.owner.equals(req.user._id)) {
        throw new ApiError(403, "Unauthorized to update this product");
    }

    if (price !== undefined && price < 0) {
        throw new ApiError(400, "Price cannot be negative");
    }
    if (stock !== undefined && stock < 0) {
        throw new ApiError(400, "Stock cannot be negative");
    }

    const updatedFields = {};

    if (name) {
        updatedFields.name = name.toLowerCase();
    }
    if (description) {
        updatedFields.description = description;
    }
    if (price !== undefined) {
        updatedFields.price = price;
    }
    if (category) {
        updatedFields.category = category;
    }
    if (brand) {
        updatedFields.brand = brand;
    }
    if (stock !== undefined) {
        updatedFields.stock = stock;
    }
    
    if (req.files?.images) {
        const imageLocalPaths = req.files.images.map(file => file.path);
        const uploadedImages = await Promise.all(imageLocalPaths.map(file=>uploadOnCloudinary(file)));
        updatedFields.images = uploadedImages.map(img => img.url);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $set: updatedFields },
        { new: true, runValidators: true }
    ).populate("owner", "name email");

    if (!updatedProduct) {
        throw new ApiError(500, "Something went wrong while updating the product");
    }

    return res.status(200).json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});

export const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this product");
    }

    await product.deleteOne();

    return res.status(200).json(new ApiResponse(200, null, "Product deleted successfully"));
});