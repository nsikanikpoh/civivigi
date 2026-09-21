// Classic numeric-menu USSD flow for reporting an incident, framework-
// agnostic (works with Africa's Talking-style POST webhooks: `text`
// accumulates every digit the caller has entered so far, separated by `*`).
//
// Menu:
//   Welcome to CiviVigi
//   1. Robbery
//   2. Kidnapping
//   3. Violence
//   4. Abuse
//   5. Threat
// -> enter region -> enter country -> enter short description -> confirm & submit

const UssdSession = require("../models/UssdSession");
const Case = require("../models/Case");
const { USSD_CASE_TYPE_MENU } = require("../utils/constants");
const { notifyOfficialsOfNewCase } = require("./notifyService");

const MAIN_MENU_TEXT =
  "CON Welcome to CiviVigi\nReport an incident:\n1. Robbery\n2. Kidnapping\n3. Violence\n4. Abuse\n5. Threat";

/**
 * Handles one webhook hit from the telecom USSD gateway.
 * @param {{ sessionId: string, phoneNumber: string, text: string }} params
 * @returns {Promise<string>} a USSD response string, prefixed CON (continue) or END (terminate)
 */
async function handleUssdRequest({ sessionId, phoneNumber, text }) {
  const steps = (text || "").split("*").filter(Boolean);

  let session = await UssdSession.findOne({ sessionId });
  if (!session) {
    session = await UssdSession.create({ sessionId, phoneNumber, stage: "MAIN_MENU", data: {} });
  }

  // Nothing entered yet -> show the main menu.
  if (steps.length === 0) {
    return MAIN_MENU_TEXT;
  }

  const lastInput = steps[steps.length - 1];

  switch (session.stage) {
    case "MAIN_MENU": {
      const type = USSD_CASE_TYPE_MENU[lastInput];
      if (!type) {
        return "CON Invalid option.\n" + MAIN_MENU_TEXT.replace("CON Welcome to CiviVigi\n", "");
      }
      session.data.type = type;
      session.stage = "AWAIT_REGION";
      await session.save();
      return `CON You selected ${type}.\nEnter your state/region:`;
    }

    case "AWAIT_REGION": {
      session.data.region = lastInput.trim();
      session.stage = "AWAIT_COUNTRY";
      await session.save();
      return "CON Enter your country:";
    }

    case "AWAIT_COUNTRY": {
      session.data.country = lastInput.trim();
      session.stage = "AWAIT_DESCRIPTION";
      await session.save();
      return "CON Briefly describe what happened:";
    }

    case "AWAIT_DESCRIPTION": {
      session.data.description = lastInput.trim();
      session.stage = "DONE";
      await session.save();

      const caseDoc = await Case.create({
        type: session.data.type,
        description: session.data.description,
        region: session.data.region,
        country: session.data.country,
        reporter: { phone: phoneNumber, channel: "ussd" },
      });

      notifyOfficialsOfNewCase(caseDoc).catch((err) =>
        console.error("[ussd] Failed to notify officials:", err)
      );

      return `END Thank you. Your ${caseDoc.type} report has been submitted.\nReference: ${caseDoc._id.toString().slice(-6).toUpperCase()}\nSecurity officials in your area have been alerted.`;
    }

    default:
      return "END Session expired. Please dial again to submit your report.";
  }
}

module.exports = { handleUssdRequest, MAIN_MENU_TEXT };
