import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asynHandler } from "../utils/AsyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";

const generateAcessAndRefreshToken=async (userId) => {
    try {
        const user=await User.findById(userId)
        const refreshToken=user.generateRefreshToken()
        const accessToken=user.generateAcessToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {refreshToken,accessToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }   
}

const register=asynHandler(async (req,res) => {
    const {fullName,email,password}=req.body
    
    const hasEmptyField = [fullName, email, password].some(item => item.trim() === "");

    if (hasEmptyField) {
        throw new ApiError(400,"All fields are required");
    }

    const existedUser = await User.findOne({email})

    if(existedUser){
        throw new ApiError(409,"User with this email already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Upload files to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar file");
    }

    const user =await User.create({
        fullName:fullName.toLowerCase(),
        email:email.toLowerCase(),
        password,
        avatar:avatar.url,
        converImage:coverImage?.url ||""
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser,"User registered successfully")
    )
})

const loginUser=asynHandler(async (req,res) => {
    const {email,password}=req.body

    if(email || password){
        throw new ApiError(400,"Email and password both are required")
    }

    const user=await User.findOne({email})

    if(!user){
        throw new ApiError(400,"User with this email ID not found")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400,"Passowrd is invalid")
    }

    const {accessToken,refreshToken}= generateAcessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,loggedInUser,"User logged In successfully")
    )
})

const logoutUser = asynHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})