import mongoose from "mongoose";

const metricDataSchema = new mongoose.Schema({
  metricName: {
    type: String,
    required: true,
    trim: true,
  },

  country: {
    type: String,
    required: true,
    trim: true,
  },

  value: {
    type: Number,
    required: true,
  },

  year: {
    type: Number,
    required: true,
  },

  industry: {
    type: String,
    default: "",
    trim: true,
  }

}, {timestamps: true});

metricDataSchema.index({ metricName: 1, industry: 1, country: 1, year: 1 }, { unique: true });

export const MetricData = mongoose.model("MetricData", metricDataSchema);