// Orchestrates everything that should happen the moment a case is reported
// (notify officials) and the moment it is verified (broadcast to WhatsApp
// groups + social media).

const User = require("../models/User");
const WhatsAppSubscription = require("../models/WhatsAppSubscription");
const {
  sendWhatsAppMessage,
  triggerWhatsAppCall,
  broadcastCaseToSubscriptions,
  formatCaseAlert,
} = require("./whatsappService");
const { publishVerifiedCase } = require("./socialMediaService");

/**
 * On every new report: find Security Officials assigned to that case's
 * province and (a) WhatsApp-message them, (b) trigger a WhatsApp/voice
 * call that reads the same message aloud if picked up.
 */
async function notifyOfficialsOfNewCase(caseDoc) {
  // `province`/`state` may already be populated (for message formatting) —
  // always resolve down to a plain id before using them in a query filter.
  const provinceId = caseDoc.province?._id || caseDoc.province;
  const officials = await User.find({
    role: "security_official",
    isActive: true,
    provinces: provinceId,
  });

  if (officials.length === 0) {
    console.warn(
      `[notify] No active Security Official assigned to province ${provinceId}. ` +
        `Case ${caseDoc._id} was still recorded and is visible to all officials in the dashboard.`
    );
    return { officialsNotified: 0 };
  }

  const message = formatCaseAlert(caseDoc);

  const outcomes = await Promise.allSettled(
    officials.map(async (official) => {
      const results = { officialId: official._id };
      if (official.phone) {
        results.message = await sendWhatsAppMessage(official.phone, message);
        results.call = await triggerWhatsAppCall(official.phone, message);
      } else {
        console.warn(`[notify] Official ${official.email} has no phone on file — skipped.`);
      }
      return results;
    })
  );

  return { officialsNotified: officials.length, outcomes };
}

/**
 * On verification: forward the case to every WhatsApp group subscribed to
 * this case's province, or to the whole state it belongs to (a subscription
 * with no `province` set covers every province in that state), then publish
 * it to Twitter/Facebook/Instagram.
 */
async function dispatchVerifiedCase(caseDoc) {
  const stateId = caseDoc.state?._id || caseDoc.state;
  const provinceId = caseDoc.province?._id || caseDoc.province;
  const subscriptions = await WhatsAppSubscription.find({
    state: stateId,
    $or: [{ province: provinceId }, { province: { $exists: false } }, { province: null }],
    isActive: true,
  });

  const whatsappResults = await broadcastCaseToSubscriptions(subscriptions, caseDoc);
  const socialResults = await publishVerifiedCase(caseDoc);

  return {
    subscriptionsNotified: subscriptions.length,
    whatsappResults,
    socialResults,
  };
}

module.exports = { notifyOfficialsOfNewCase, dispatchVerifiedCase };
