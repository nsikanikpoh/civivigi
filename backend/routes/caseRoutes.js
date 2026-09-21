const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createCase,
  listCases,
  getCase,
  verifyCase,
  markDuplicate,
  resolveCase,
} = require("../controllers/caseController");

const router = express.Router();

// Public — anybody can report or browse the feed, no auth.
router.get("/", listCases);
router.post("/", createCase);
router.get("/:id", getCase);

// Security Official / Admin only.
router.patch("/:id/verify", protect, authorize("security_official", "admin"), verifyCase);
router.patch("/:id/duplicate", protect, authorize("security_official", "admin"), markDuplicate);
router.patch("/:id/resolve", protect, authorize("security_official", "admin"), resolveCase);

module.exports = router;
