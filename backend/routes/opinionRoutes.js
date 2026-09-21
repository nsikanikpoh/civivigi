const express = require("express");
const { listOpinions, createOpinion, upvoteOpinion } = require("../controllers/opinionController");

const router = express.Router();

// Fully public — anybody can air an opinion.
router.get("/", listOpinions);
router.post("/", createOpinion);
router.patch("/:id/upvote", upvoteOpinion);

module.exports = router;
