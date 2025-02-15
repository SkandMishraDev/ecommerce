import { Cart } from "../models/cart.model";
import { Product } from "../models/product.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import {asyncHandler} from "../utils/AsyncHandler";

export const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || quantity < 1) {
        throw new ApiError(400, "Valid product ID and quantity are required.");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found.");
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            product: [{ product: productId, quantity }],
            totalPrice: product.price * quantity
        });
    } else {
        const productIndex = cart.product.findIndex(item => item.product.toString() === productId);

        if (productIndex > -1) {
            cart.product[productIndex].quantity += quantity;
        } else {
            cart.product.push({ product: productId, quantity });
        }

        cart.totalPrice = cart.product.reduce((total, item) => total + (item.quantity * product.price), 0);
        await cart.save();
    }

    return res.status(200).json(new ApiResponse(200, cart, "Product added to cart successfully."));
});

export const getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate("product.product", "name price images");

    if (!cart) {
        throw new ApiError(404, "Cart is empty.");
    }

    return res.status(200).json(new ApiResponse(200, cart, "Cart retrieved successfully."));
});

export const updateCartItem = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || quantity < 1) {
        throw new ApiError(400, "Valid product ID and quantity are required.");
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        throw new ApiError(404, "Cart not found.");
    }

    const productIndex = cart.product.findIndex(item => item.product.toString() === productId);

    if (productIndex === -1) {
        throw new ApiError(404, "Product not found in cart.");
    }

    cart.product[productIndex].quantity = quantity;

    cart.totalPrice = cart.product.reduce((total, item) => total + (item.quantity * item.product.price), 0);
    
    await cart.save();

    return res.status(200).json(new ApiResponse(200, cart, "Cart updated successfully."));
});

export const removeCartItem = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        throw new ApiError(404, "Cart not found.");
    }

    cart.product = cart.product.filter(item => item.product.toString() !== productId);

    cart.totalPrice = cart.product.reduce((total, item) => total + (item.quantity * item.product.price), 0);
    
    await cart.save();

    return res.status(200).json(new ApiResponse(200, cart, "Product removed from cart successfully."));
});

export const clearCart = asyncHandler(async (req, res) => {
    await Cart.findOneAndDelete({ user: req.user._id });

    return res.status(200).json(new ApiResponse(200, {}, "Cart cleared successfully."));
});
