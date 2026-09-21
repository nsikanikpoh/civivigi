const asyncHandler = require("../utils/asyncHandler");
const { handleUssdRequest } = require("../services/ussdService");

// POST /api/ussd — the telecom gateway webhook. Accepts the common
// Africa's-Talking-style payload shape { sessionId, phoneNumber, text } and
// responds with plain text prefixed CON (continue) / END (terminate), which
// is what most USSD gateways expect back.
const ussdWebhook = asyncHandler(async (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;
  if (!sessionId || !phoneNumber) {
    res.status(400);
    throw new Error("sessionId and phoneNumber are required");
  }

  const response = await handleUssdRequest({ sessionId, phoneNumber, text });
  res.set("Content-Type", "text/plain");
  res.send(response);
});

module.exports = { ussdWebhook };
