const mongoose = require("mongoose");
const { SEVERITY_LEVELS } = require("../utils/constants");

// Government projects with major community impact, browsable by severity.
const govProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    severity: { type: String, enum: SEVERITY_LEVELS, required: true },
    region: { type: String, trim: true },
    country: { type: String, trim: true },
    budget: { type: Number },
    startDate: { type: Date },
    completionDate: { type: Date },
    imageUrl: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

govProjectSchema.index({ severity: 1, createdAt: -1 });

module.exports = mongoose.model("GovProject", govProjectSchema);
