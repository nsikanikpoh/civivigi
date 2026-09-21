const express = require("express");
const { ussdWebhook } = require("../controllers/ussdController");

const router = express.Router();

// Telecom gateway webhook — not for browser use.
router.post("/", ussdWebhook);

module.exports = router;
