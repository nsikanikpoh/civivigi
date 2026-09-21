const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createSubscription,
  listSubscriptions,
  deleteSubscription,
} = require("../controllers/subscriptionController");

const router = express.Router();

router.post("/", createSubscription); // public — any WhatsApp group can subscribe
router.get("/", protect, authorize("security_official", "admin"), listSubscriptions);
router.delete("/:id", protect, authorize("admin"), deleteSubscription);

module.exports = router;
