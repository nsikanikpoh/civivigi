const asyncHandler = require("../utils/asyncHandler");
const WhatsAppSubscription = require("../models/WhatsAppSubscription");

// POST /api/subscriptions — a WhatsApp group subscribes to a region/country feed. Public.
const createSubscription = asyncHandler(async (req, res) => {
  const { groupName, groupWhatsAppId, region, country } = req.body;
  if (!groupName || !groupWhatsAppId || !region || !country) {
    res.status(400);
    throw new Error("groupName, groupWhatsAppId, region and country are required");
  }

  const sub = await WhatsAppSubscription.create({ groupName, groupWhatsAppId, region, country });
  res.status(201).json({ success: true, subscription: sub });
});

// GET /api/subscriptions — Admin/Security Official view.
const listSubscriptions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.region) filter.region = req.query.region;
  if (req.query.country) filter.country = req.query.country;

  const subs = await WhatsAppSubscription.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: subs });
});

// DELETE /api/subscriptions/:id — unsubscribe.
const deleteSubscription = asyncHandler(async (req, res) => {
  const sub = await WhatsAppSubscription.findByIdAndDelete(req.params.id);
  if (!sub) {
    res.status(404);
    throw new Error("Subscription not found");
  }
  res.json({ success: true, message: "Unsubscribed" });
});

module.exports = { createSubscription, listSubscriptions, deleteSubscription };
