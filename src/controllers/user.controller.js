import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
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

const register=asyncHandler(async (req,res) => {
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
// if(coverImageLocalPath){
//     coverImage=await uploadOnCloudinary(coverImageLocalPath)
// }else{
//     coverImage=null;
// }

    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar file");
    }

    const user =await User.create({
        fullName:fullName.toLowerCase(),
        email:email.toLowerCase(),
        password,
        avatar:avatar.url,
        converImage:coverImage?.url ||"",
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

const loginUser=asyncHandler(async (req,res) => {
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

const logoutUser = asyncHandler(async(req, res) => {
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

const refreshAccessToken=asyncHandler(async (req,res) => {
    const token=req.cookies?.refreshToken || req.headers.authorization?.split(" ")[1];
     try {
        const decoded=jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECERT
        )
        if(!decoded||!decoded._id){
            throw new ApiError(400,"Invalid refresh token")
        }
        const user=await User.findById(decoded._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }

        if(token!=user.refreshToken){
            throw new ApiError(401,"Refresh token is expired  or used")
        }

        const {newrefreshToken,accessToken}=await generateAcessAndRefreshToken(user._id)

        const options={
            httpOnly:true,
            secure:true
        }

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(200,
                {accessToken,refreshToken:newrefreshToken},
                "Access token refreshed"
            )
        )
     } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
     }
})

const changeCurrentPassword=asyncHandler(async (req,res) => {
    const {oldPassword,newPassword}=req.body
    
    const user=await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(400,"unable to fetch user details")
    }

    const validatePassword=await user.isPasswordCorrect(oldPassword)

    if(!validatePassword){
        throw new ApiError(400,"Your Password is incorrect")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Password changed Successfully")
    )
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails=asyncHandler(async (req,res) => {
    const {fullName, email} = req.body

    if(!fullName && !email){
        throw new ApiError(400,"Fill atleast one field")
    }
    const updateFields={}
    if(fullName) updateFields.fullName=fullName
    if(email) updateFields.email=email
    const user=User.findByIdAndUpdate(req.user._id,
        {
            $set:updateFields
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Account details updated")
    )

})

const updateUserAvatar=asyncHandler(async (req,res) => {
    const {avatarLocalPath}=req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
      //TODO: delete old image - assignment


      const user = await User.findById(req.user?._id);

      if (!user) {
          throw new ApiError(404, "User not found");
      }
  
      // Extract public ID and delete the old image if it exists
      if (user.coverImage) {
          const publicId = user.coverImage.split('/').pop().split('.')[0]; // Extract public ID
          await cloudinary.uploader.destroy(publicId); // Delete from Cloudinary
      }  

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")   
    }

    const updatedUser=User.findByIdAndUpdate(req.user,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new :true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200,updatedUser,"Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Extract public ID and delete the old image if it exists
    if (user.coverImage) {
        const publicId = user.coverImage.split('/').pop().split('.')[0]; // Extract public ID
        await cloudinary.uploader.destroy(publicId); // Delete from Cloudinary
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on CoverImage")
        
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedUser, "Cover image updated successfully")
    )
})

const orderHistroy = asyncHandler(async (req,res) => {
    
})

export {
    register,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}