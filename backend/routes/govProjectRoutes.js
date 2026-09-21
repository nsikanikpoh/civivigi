const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  listGovProjects,
  createGovProject,
  updateGovProject,
  deleteGovProject,
} = require("../controllers/govProjectController");

const router = express.Router();

router.get("/", listGovProjects); // public
router.post("/", protect, authorize("admin"), createGovProject);
router.patch("/:id", protect, authorize("admin"), updateGovProject);
router.delete("/:id", protect, authorize("admin"), deleteGovProject);

module.exports = router;
