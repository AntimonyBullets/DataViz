import { Metric } from "../../models/metric.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const addMetric = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        industry = "", // default to empty string if not provided
        unit,
        source,
        type = "manual", // default to "manual" if not provided
        indicatorCode
    } = req.body;

    // Check if name is provided as it's required
    if (!name) {
        throw new ApiError(400, "Metric name is required");
    }

    // Check for duplicate based on name and industry combination
    const existingMetric = await Metric.findOne({
        name,
        industry: industry || "" // if industry is undefined/null, check for empty string
    });

    if (existingMetric) {
        throw new ApiError(
            409, 
            industry 
                ? `Metric '${name}' already exists for industry '${industry}'`
                : `General metric '${name}' already exists`
        );
    }

    // Validate type if provided
    if (type && !["live", "manual"].includes(type)) {
        throw new ApiError(400, "Type must be either 'live' or 'manual'");
    }

    // If type is live, indicatorCode is required
    if (type === "live" && !indicatorCode) {
        throw new ApiError(400, "Indicator code is required for live metrics");
    }

    // If type is manual, ensure indicatorCode is not included
    let finalIndicatorCode = indicatorCode;
    if (type === "manual" && indicatorCode) {
        finalIndicatorCode = undefined;
    }

    // Create metric object with default values
    const metricData = {
        name,
        description: description || "",
        industry: industry || "", // ensure empty string if not provided
        unit: unit || "",
        source: source || "",
        status: true, // default to active
        type,
        ...(finalIndicatorCode && { indicatorCode: finalIndicatorCode }) // only include if provided
    };

    // Create new metric
    const metric = await Metric.create(metricData);

    // Return success response
    return res.status(201).json(
        new ApiResponse(
            201,
            metric,
            industry 
                ? `Metric '${name}' created successfully for industry '${industry}'`
                : `General metric '${name}' created successfully`
        )
    );
});

// Fetch all metrics (excluding indicatorCode)
const getAllMetrics = asyncHandler(async (req, res) => {
    const metrics = await Metric.find();
    if (!metrics) throw new ApiError(404, "No metrics found");
    return res.status(200).json(
        new ApiResponse(200, metrics, "All metrics fetched successfully!")
    );
});

// Delete a metric by ID
const deleteMetric = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Metric ID is required");
    
    const deleted = await Metric.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "Metric not found");

    return res.status(200).json(
        new ApiResponse(200, deleted, `Metric '${deleted.name}' deleted successfully!`)
    );
});

// Edit a metric by ID (type can now be edited)
const editMetric = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Metric ID is required");

    let { type, ...updateFields } = req.body;

    // If type is being changed to 'live', indicatorCode must be provided
    if (type === "live") {
        if (!('indicatorCode' in updateFields) && !req.body.indicatorCode) {
            throw new ApiError(400, "Indicator code is required when changing type to 'live'");
        }
        updateFields.indicatorCode = req.body.indicatorCode;
        updateFields.type = "live";
    } else if (type === "manual") {
        updateFields.type = "manual";
        // Remove indicatorCode if present
        if ('indicatorCode' in updateFields) delete updateFields.indicatorCode;
    }
    // If type is not being changed, just update other fields

    // Remove indicatorCode if not provided (to avoid setting it to undefined)
    if (updateFields.indicatorCode === undefined) {
        delete updateFields.indicatorCode;
    }

    const updated = await Metric.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true }
    );
    if (!updated) throw new ApiError(404, "Metric not found");

    return res.status(200).json(
        new ApiResponse(200, updated, `Metric '${updated.name}' updated successfully!`)
    );
});

// Change the status of a metric by ID
const changeMetricStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!id) throw new ApiError(400, "Metric ID is required");
    if (typeof status !== "boolean") throw new ApiError(400, "Status must be a boolean");

    const updated = await Metric.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
    );
    if (!updated) throw new ApiError(404, "Metric not found");

    return res.status(200).json(
        new ApiResponse(200, updated, `Metric status updated to ${status ? 'active' : 'inactive'} successfully!`)
    );
});

export { addMetric, getAllMetrics, deleteMetric, editMetric, changeMetricStatus };