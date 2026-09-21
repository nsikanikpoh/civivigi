const mongoose = require("mongoose");

// Tracks a caller's progress through the USSD menu between requests, since
// telecom USSD gateways call our webhook once per keypress (stateless HTTP).
const ussdSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    stage: {
      type: String,
      enum: ["MAIN_MENU", "AWAIT_TYPE", "AWAIT_STATE", "AWAIT_PROVINCE", "AWAIT_DESCRIPTION", "DONE"],
      default: "MAIN_MENU",
    },
    data: {
      type: { type: String },
      stateId: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
      provinceId: { type: mongoose.Schema.Types.ObjectId, ref: "Province" },
      description: { type: String },
    },
  },
  { timestamps: true }
);

// Auto-expire idle sessions so the collection doesn't grow unbounded.
ussdSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 30 });

module.exports = mongoose.model("UssdSession", ussdSessionSchema);
