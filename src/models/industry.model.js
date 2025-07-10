import mongoose from "mongoose";

const industrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
}, {timestamps: true});

export const Industry = mongoose.model('Industry', industrySchema);