const mongoose = require("mongoose");

// A WhatsApp group subscribing to verified-case feeds for a given State, or
// for one specific Province within it (province left unset = whole state).
const whatsAppSubscriptionSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true, trim: true },
    // The group's WhatsApp identifier — for Twilio this is usually the
    // group's own WhatsApp number/JID; kept generic for the POC.
    groupWhatsAppId: { type: String, required: true, trim: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: true },
    province: { type: mongoose.Schema.Types.ObjectId, ref: "Province" }, // optional
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

whatsAppSubscriptionSchema.index({ state: 1, province: 1, isActive: 1 });

module.exports = mongoose.model("WhatsAppSubscription", whatsAppSubscriptionSchema);
