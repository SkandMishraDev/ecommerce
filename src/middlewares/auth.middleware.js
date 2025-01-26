import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const verifyJWT=asyncHandler(async (req,res,next) => {
    const token =req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    // in some cases cookies might not contain token eg mobile application
    if(!token){
        throw new ApiError(401,"Token not available")
    }

    const decoded=jwt.verify(token,process.env.Access_Token_Secret);

    if(!decoded||!decoded._id){
        throw new ApiError(401,"Invalid token")
    }
    const user=await User.findById(decoded._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    req.user=user;  
    // By setting req.user = user, you're attaching the user object to the req (request) object.
    // This allows you to use req.user in later parts of the request lifecycle to access the user's data, such as their ID, roles, or permissions.
 
    next();
    //Insert try and catch block in jwt.verify because token can be expired
})