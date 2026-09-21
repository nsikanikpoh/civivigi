const mongoose = require("mongoose");

// Major headlines / speeches from government, filterable by date.
const headlineSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true },
    body: { type: String, trim: true },
    speaker: { type: String, trim: true }, // e.g. "State Governor"
    sourceUrl: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    publishedAt: { type: Date, required: true, default: Date.now },
    region: { type: String, trim: true },
    country: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

headlineSchema.index({ publishedAt: -1 });

module.exports = mongoose.model("Headline", headlineSchema);
