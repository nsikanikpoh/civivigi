const mongoose = require("mongoose");

// A top-level geographic scope, added only by an Admin. Provinces belong to
// a State; Cases, Security Officials and WhatsApp subscriptions are scoped
// down at the Province level, with the State kept denormalized on each for
// fast "by state" filtering and rollups.
const stateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    country: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("State", stateSchema);
