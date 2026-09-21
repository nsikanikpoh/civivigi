const mongoose = require("mongoose");

// Created automatically whenever a Case is reported with a location; a
// Security Official can flip `isSafeNow` back to true once the area is
// cleared, allowing normal movement to resume.
const unsafeLocationSchema = new mongoose.Schema(
  {
    case: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true },
    label: { type: String, trim: true },
    city: { type: String, trim: true },
    region: { type: String, trim: true },
    country: { type: String, trim: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    reasonType: { type: String, trim: true }, // mirrors Case.type at creation time
    flaggedAt: { type: Date, default: Date.now },
    isSafeNow: { type: Boolean, default: false },
    markedSafeBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    markedSafeAt: { type: Date },
  },
  { timestamps: true }
);

unsafeLocationSchema.index({ location: "2dsphere" });
unsafeLocationSchema.index({ city: 1, isSafeNow: 1 });

module.exports = mongoose.model("UnsafeLocation", unsafeLocationSchema);
