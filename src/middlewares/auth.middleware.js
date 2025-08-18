import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")
    
        if(!token){
            throw new ApiError(400 , "Unauthorize request!") 
        }
    
        const decodedInfoFromToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const currentUser = await User.findById(decodedInfoFromToken?._id).select("-password -refreshToken");
    
        if(!currentUser){
            throw new ApiError(401 , "Invalid AccessToken!")
        };
    
        req.user = currentUser;
        next();
    } catch (error) {
        throw new ApiError(401 , error?.message || "Problem with Middleware-Auth!")
    }
})