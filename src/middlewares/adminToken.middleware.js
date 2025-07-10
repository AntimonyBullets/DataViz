import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const adminToken = asyncHandler(async (req, _, next) => {
    const adminToken = req.header("Authorization")?.replace("Bearer ", "");

    if(!adminToken) throw new ApiError(401, "Unauthorized request!");

    if(adminToken !== process.env.ADMIN_TOKEN_SECRET) throw new ApiError(401, "Unauthorized request!");
    next();
});