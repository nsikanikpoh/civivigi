const mongoose = require("mongoose");
const {
  CASE_TYPES,
  CASE_STATUSES,
  REPORT_CHANNELS,
} = require("../utils/constants");

// A single reported incident. Anybody can create one (no auth), scoped by
// province (state's own admin-managed hierarchy), and moved through the
// verification workflow by the Security Officials assigned to that province.
const caseSchema = new mongoose.Schema(
  {
    type: { type: String, enum: CASE_TYPES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },

    province: { type: mongoose.Schema.Types.ObjectId, ref: "Province", required: true },
    // Denormalized from province.state at creation time so state-level
    // filtering/ranking never needs a second hop through Province.
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: true },

    location: {
      // GeoJSON point captured from the reporter's device (or approximate
      // location entered manually over USSD).
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: undefined,
      },
      label: { type: String, trim: true }, // human readable address, if known
    },

    status: { type: String, enum: CASE_STATUSES, default: "pending" },

    reporter: {
      // Optional contact info — reporting works with none of this filled in.
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      channel: { type: String, enum: REPORT_CHANNELS, default: "web" },
    },

    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },

    markedDuplicateBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    duplicateOfCase: { type: mongoose.Schema.Types.ObjectId, ref: "Case" },

    // Set true the moment this case is forwarded to WhatsApp/social — lets us
    // avoid re-publishing on repeated verification attempts.
    dispatched: { type: Boolean, default: false },
  },
  { timestamps: true }
);

caseSchema.index({ province: 1, status: 1 });
caseSchema.index({ state: 1, status: 1 });
caseSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Case", caseSchema);
