import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  plan: {
    type: String,
    required: true,
    enum: ["Free", "Premium"],
  },

  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  amount: {
    type: Number,
    required: true,
    min: 0,
  },

  paymentMethod: {
    type: String,
    required: true,
  }, 

  paymentId :{
    type: String,
    required: true
  },

}, { timestamps: true });

export const Payment = mongoose.model("Payment", paymentSchema);