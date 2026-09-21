const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
  addOfficialProvince,
  removeOfficialProvince,
  moveOfficialProvince,
} = require("../controllers/adminController");

const router = express.Router();

router.use(protect, authorize("admin"));

router.route("/users").get(listUsers).post(createUser);
router.route("/users/:id").patch(updateUser).delete(deleteUser);

router.post("/users/:id/provinces", addOfficialProvince);
router.delete("/users/:id/provinces/:provinceId", removeOfficialProvince);
router.patch("/users/:id/move-province", moveOfficialProvince);

module.exports = router;
