const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { createUser, listUsers, updateUser, deleteUser } = require("../controllers/adminController");

const router = express.Router();

router.use(protect, authorize("admin"));

router.route("/users").get(listUsers).post(createUser);
router.route("/users/:id").patch(updateUser).delete(deleteUser);

module.exports = router;
