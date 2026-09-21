const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  listStates,
  createState,
  deleteState,
  listProvinces,
  createProvince,
  deleteProvince,
  rankProvincesByIncidents,
} = require("../controllers/geoController");

const router = express.Router();

// States and provinces are readable by anyone (the app shows the whole
// hierarchy publicly), but only an Admin can add or remove one.
router.get("/states", listStates);
router.post("/states", protect, authorize("admin"), createState);
router.delete("/states/:id", protect, authorize("admin"), deleteState);

// IMPORTANT: /provinces/ranking must be registered before /provinces/:id-style
// routes would be, so "ranking" is never swallowed as an id. There is no such
// :id route here today, but the order is kept deliberate for when one is added.
router.get("/provinces/ranking", rankProvincesByIncidents);
router.get("/provinces", listProvinces);
router.post("/provinces", protect, authorize("admin"), createProvince);
router.delete("/provinces/:id", protect, authorize("admin"), deleteProvince);

module.exports = router;
