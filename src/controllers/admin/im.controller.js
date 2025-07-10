import { Industry } from "../../models/industry.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const addIndustry = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
        throw new ApiError(400, "Industry name is required");
    }
    // Check for duplicate
    const existing = await Industry.findOne({ name: name.trim() });
    if (existing) {
        throw new ApiError(409, "Industry with this name already exists");
    }
    
    const industry = await Industry.create({ name: name.trim() });
    return res.status(201).json(new ApiResponse(201, industry, "Industry created successfully"));
});

// Fetch all industries
const getAllIndustries = asyncHandler(async (req, res) => {
    const industries = await Industry.find();
    if (!industries) throw new ApiError(404, "No industries found");
    return res.status(200).json(new ApiResponse(200, industries, "All industries fetched successfully!"));
});

// Delete an industry by ID
const deleteIndustry = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Industry ID is required");

    const deleted = await Industry.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "Industry not found");
    
    return res.status(200).json(
        new ApiResponse(200, deleted, `Industry '${deleted.name}' deleted successfully!`)
    );
});

export { addIndustry, getAllIndustries, deleteIndustry };
