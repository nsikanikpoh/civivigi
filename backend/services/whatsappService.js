// WhatsApp messaging + voice-call integration (Twilio WhatsApp API).
//
// This is env-var-driven: with TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN unset,
// every function falls back to a console-log stub so the POC runs end to
// end without a real Twilio account. Swap in real credentials and it starts
// sending for real with no code changes.

const isConfigured = Boolean(
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
);

let twilioClient = null;
if (isConfigured) {
  const twilio = require("twilio");
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Sends a plain WhatsApp text message.
 * @param {string} to - E.164 phone number or WhatsApp group id, e.g. "+2348012345678"
 * @param {string} body - message text
 */
async function sendWhatsAppMessage(to, body) {
  if (!isConfigured) {
    console.log(`[whatsapp:MOCK] -> ${to}\n${body}\n`);
    return { mocked: true, to, body };
  }

  const message = await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${to.replace("whatsapp:", "")}`,
    body,
  });
  return { mocked: false, sid: message.sid, to, body };
}

/**
 * Triggers an outbound WhatsApp call that rings the recipient; if picked up,
 * the same message text is read aloud via TwiML <Say>.
 * @param {string} to - E.164 phone number
 * @param {string} message - text to be read aloud on pickup
 */
async function triggerWhatsAppCall(to, message) {
  if (!isConfigured) {
    console.log(`[whatsapp-call:MOCK] ringing ${to} — on pickup would say:\n"${message}"\n`);
    return { mocked: true, to, message };
  }

  // Twilio's WhatsApp calling channel is still limited-availability; this
  // uses Twilio Voice as the underlying "ring + read aloud" mechanism, which
  // is the same call pattern requested (ring, and if picked up, read the
  // message). If/when WhatsApp Calling API is enabled on the account, swap
  // the `to`/`from` here for the WhatsApp channel equivalents.
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="Polly.Joanna">${escapeXml(message)}</Say></Response>`;

  const call = await twilioClient.calls.create({
    to,
    from: process.env.TWILIO_VOICE_FROM,
    twiml,
  });
  return { mocked: false, sid: call.sid, to };
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends a verified-case alert to every active WhatsApp group subscribed to
 * the case's region/country.
 * @param {import("../models/WhatsAppSubscription")[]} subscriptions
 * @param {import("../models/Case")} caseDoc
 */
async function broadcastCaseToSubscriptions(subscriptions, caseDoc) {
  const body = formatCaseAlert(caseDoc);
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendWhatsAppMessage(sub.groupWhatsAppId, body))
  );
  return results;
}

function formatCaseAlert(caseDoc) {
  return (
    `🚨 CiviVigi Verified Alert 🚨\n` +
    `Type: ${caseDoc.type}\n` +
    `Location: ${[caseDoc.city, caseDoc.region, caseDoc.country].filter(Boolean).join(", ")}\n` +
    `Details: ${caseDoc.description}\n` +
    `Reported via: ${caseDoc.reporter?.channel || "web"}\n` +
    `Case ID: ${caseDoc._id}`
  );
}

module.exports = {
  isConfigured,
  sendWhatsAppMessage,
  triggerWhatsAppCall,
  broadcastCaseToSubscriptions,
  formatCaseAlert,
};
