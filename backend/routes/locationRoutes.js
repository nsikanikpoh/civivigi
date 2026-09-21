const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { listUnsafeLocations, markLocationSafe } = require("../controllers/locationController");

const router = express.Router();

router.get("/unsafe", listUnsafeLocations); // public
router.patch(
  "/unsafe/:id/mark-safe",
  protect,
  authorize("security_official", "admin"),
  markLocationSafe
);

module.exports = router;
