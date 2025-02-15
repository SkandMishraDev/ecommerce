import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler";

// ✅ Create a new review
export const createReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    if (!productId || !rating) {
        throw new ApiError(400, "Product ID and rating are required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const existingReview = await Review.findOne({ product: productId, user: req.user._id });
    if (existingReview) {
        throw new ApiError(400, "You have already reviewed this product");
    }

    const review = await Review.create({
        product: productId,
        rating,
        comment,
        user: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, review, "Review added successfully"));
});

export const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    const review = await Review.findOneAndDelete({ _id: reviewId, user: req.user._id });

    if (!review) {
        throw new ApiError(404, "Review not found or unauthorized");
    }

    return res.status(200).json(new ApiResponse(200, null, "Review deleted successfully"));
});

export const updateReview = asyncHandler(async (req,res) => {
    const {reviewId,productId} = req.params;
    const {rating,comment}=req.body;

    if(!reviewId || !productId){
        throw new ApiError(400,"Review and product ID are required")
    }

    const review = Review.findOne({product:productId,_id:reviewId,user:req.user._id})

    if (!review) {
        throw new ApiError(404, "Review not found or unauthorized");
    }

    const updateFields={}
    if(rating) update.rating=rating;
    if(comment) update.comment=comment;

    const updateReview=await Review.findByIdAndUpdate(review._id,
        {
            $set:updateFields
        },{
            new:true
        }
    )
    return res.status(200).json(new ApiResponse(200,updateReview,"Review updated successfully"))
})

export const getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId }).populate("user", "name email");

    return res.status(200).json(new ApiResponse(200, reviews, "Product reviews fetched successfully"));
});