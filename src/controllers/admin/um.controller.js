import { User } from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    if (!users) throw new ApiError(404, "No users found");
    return res.status(200).json(new ApiResponse(200, users, "All users fetched successfully!"));
});

// Change the status of a user by ID
const changeUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!id) throw new ApiError(400, "User ID is required");
    if (typeof status !== "boolean") throw new ApiError(400, "Status must be a boolean");

    const updated = await User.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
    ).select("-password");
    if (!updated) throw new ApiError(404, "User not found");

    return res.status(200).json(
        new ApiResponse(200, updated, `User status updated to ${status ? 'active' : 'inactive'} successfully!`)
    );
});

// Delete a user by ID
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "User ID is required");
    const deleted = await User.findByIdAndDelete(id).select("-password");
    if (!deleted) throw new ApiError(404, "User not found");
    return res.status(200).json(
        new ApiResponse(200, deleted, `User '${deleted.username || deleted.email || deleted._id}' deleted successfully!`)
    );
});

export { getAllUsers, changeUserStatus, deleteUser };
