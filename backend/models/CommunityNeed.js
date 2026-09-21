const mongoose = require("mongoose");
const { SEVERITY_LEVELS, COMMUNITY_NEED_STATUSES } = require("../utils/constants");

// Major community needs, tracked by severity and lifecycle status.
const communityNeedSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    severity: { type: String, enum: SEVERITY_LEVELS, required: true },
    status: { type: String, enum: COMMUNITY_NEED_STATUSES, default: "open" },
    region: { type: String, trim: true },
    country: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

communityNeedSchema.index({ severity: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("CommunityNeed", communityNeedSchema);
