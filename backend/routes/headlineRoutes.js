const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { listHeadlines, createHeadline, deleteHeadline } = require("../controllers/headlineController");

const router = express.Router();

router.get("/", listHeadlines); // public
router.post("/", protect, authorize("admin"), createHeadline);
router.delete("/:id", protect, authorize("admin"), deleteHeadline);

module.exports = router;
