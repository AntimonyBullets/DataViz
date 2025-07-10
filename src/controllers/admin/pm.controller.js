import { Payment } from "../../models/payment.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const getAllPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.find().populate({
        path: 'paidBy',
        select: 'username' // Only populate the username
    });
    if (!payments) throw new ApiError(404, "No payments found");
    return res.status(200).json(
        new ApiResponse(200, payments, "All payments fetched successfully!")
    );
});

export { getAllPayments };
