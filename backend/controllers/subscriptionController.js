const asyncHandler = require("../utils/asyncHandler");
const WhatsAppSubscription = require("../models/WhatsAppSubscription");
const State = require("../models/State");
const Province = require("../models/Province");

// POST /api/subscriptions — a WhatsApp group subscribes to a State's feed,
// or to one specific Province within it (omit province for the whole state). Public.
const createSubscription = asyncHandler(async (req, res) => {
  const { groupName, groupWhatsAppId, state, province } = req.body;
  if (!groupName || !groupWhatsAppId || !state) {
    res.status(400);
    throw new Error("groupName, groupWhatsAppId and state are required");
  }

  const stateDoc = await State.findById(state);
  if (!stateDoc) {
    res.status(400);
    throw new Error("That state does not exist");
  }
  if (province) {
    const provinceDoc = await Province.findById(province);
    if (!provinceDoc || String(provinceDoc.state) !== String(state)) {
      res.status(400);
      throw new Error("That province does not exist in the given state");
    }
  }

  const sub = await WhatsAppSubscription.create({
    groupName,
    groupWhatsAppId,
    state,
    province: province || undefined,
  });
  res.status(201).json({ success: true, subscription: sub });
});

// GET /api/subscriptions — Admin/Security Official view.
const listSubscriptions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.state) filter.state = req.query.state;
  if (req.query.province) filter.province = req.query.province;

  const subs = await WhatsAppSubscription.find(filter)
    .populate("state", "name")
    .populate("province", "name")
    .sort({ createdAt: -1 });
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
