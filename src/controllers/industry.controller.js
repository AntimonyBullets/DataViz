import { Industry } from "../models/industry.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllIndustries = asyncHandler(async (req, res) => {
    const industries = await Industry.find({}).sort({ name: 1 });
    return res.status(200).json(new ApiResponse(200, industries, "Industries fetched successfully"));
});

export { getAllIndustries };
