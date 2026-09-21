const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  listCommunityNeeds,
  createCommunityNeed,
  updateCommunityNeed,
  deleteCommunityNeed,
} = require("../controllers/communityNeedController");

const router = express.Router();

router.get("/", listCommunityNeeds); // public
router.post("/", protect, authorize("admin"), createCommunityNeed);
router.patch("/:id", protect, authorize("admin", "security_official"), updateCommunityNeed);
router.delete("/:id", protect, authorize("admin"), deleteCommunityNeed);

module.exports = router;
