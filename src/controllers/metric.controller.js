import { Metric } from "../models/metric.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getMetrics = asyncHandler(async (req, res) => {
    const { industry } = req.query;
    const user = req.user; // Set by auth middleware

    // If user is free and trying to access industry-specific metrics
    if (user.type === "free" && industry) {
        throw new ApiError(
            403, 
            "Industry-specific metrics are only available to premium users. Please upgrade to access these metrics."
        );
    }

    let query = {};
    // Only add industry filter if:
    // 1. User is premium and industry is specified, OR
    // 2. No industry is specified (for general metrics)
    if (user.type === "premium" && industry) {
        query.industry = industry;
    } else {
        // For free users or when no industry specified, show only general metrics
        query.industry = "";
    }

    const metrics = await Metric.find(query)
        .select("-__v") // Exclude version key
        .sort({ name: 1 }); // Sort by name in ascending order

    if (!metrics || metrics.length === 0) {
        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                user.type === "premium" && industry 
                    ? `No metrics found for industry: ${industry}`
                    : "No general metrics found"
            )
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            metrics,
            user.type === "premium" && industry 
                ? `Metrics fetched successfully for industry: ${industry}`
                : "General metrics fetched successfully"
        )
    );
});

const getMetricById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new ApiError(400, "Metric id is required.");
    }
    const metric = await Metric.findById(id).select("-__v");
    if (!metric) {
        throw new ApiError(404, "Metric not found.");
    }

    if(metric.status === false) {
        throw new ApiError(503, "Metric is inactive.");
    }

    return res.status(200).json(
        new ApiResponse(200, metric, "Metric details fetched successfully.")
    );
});

export { getMetrics, getMetricById };