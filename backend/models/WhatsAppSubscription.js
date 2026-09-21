const mongoose = require("mongoose");

// A WhatsApp group subscribing to verified-case feeds for a given
// state/region + country.
const whatsAppSubscriptionSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true, trim: true },
    // The group's WhatsApp identifier — for Twilio this is usually the
    // group's own WhatsApp number/JID; kept generic for the POC.
    groupWhatsAppId: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

whatsAppSubscriptionSchema.index({ region: 1, country: 1, isActive: 1 });

module.exports = mongoose.model("WhatsAppSubscription", whatsAppSubscriptionSchema);
