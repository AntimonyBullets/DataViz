import { Admin } from "../models/admin.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const adminAuth = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
    
        if(!token){
            throw new ApiError(401, "Unauthorized request!");
        };
    
        const decodedToken = jwt.verify(token, process.env.ADMIN_ACCESS_TOKEN_SECRET);
    
        const admin = await Admin.findById(decodedToken?._id).select("-password");
    
        if(!admin) throw new ApiError(401, "Invalid access token");
    
        req.admin = admin;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
})