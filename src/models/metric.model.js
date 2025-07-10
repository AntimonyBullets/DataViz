import mongoose from "mongoose";

const metricSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  description: {
    type: String,
    default: "",
    trim: true,
  },

  industry: {
    type: String,
    default: "",
    trim: true,
  },

  unit: {
    type: String,
    default: "",
    trim: true,
  },

  source: {
    type: String,
    default: "",
    trim: true,
  },

  status: {
    type: Boolean,
    default: true, // true = active, false = inactive
  },

  type: {
    type: String,
    enum: ["live", "manual"],
    required: true,
  },

  indicatorCode: {
    type: String,
    required: function () {
      return this.type === "live";
    },
    trim: true,
  },

}, { timestamps: true });

export const Metric = mongoose.model("Metric", metricSchema);