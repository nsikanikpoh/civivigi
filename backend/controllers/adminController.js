const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const Province = require("../models/Province");

// All routes here are Admin-only (see routes/adminRoutes.js).

// POST /api/admin/users — add an Admin or a Security Official. A Security
// Official can be given one or more provinces at creation time.
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, provinces } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("name, email, password and role are required");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error("A user with that email already exists");
  }

  let provinceIds = [];
  if (Array.isArray(provinces) && provinces.length > 0) {
    provinceIds = await validateProvinceIds(provinces, res);
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    provinces: provinceIds,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, user: await user.populate("provinces", "name state") });
});

// GET /api/admin/users?role=&province=
const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.province) filter.provinces = req.query.province;

  const users = await User.find(filter)
    .populate("provinces", "name state")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: users.map((u) => u.toSafeObject()) });
});

// PATCH /api/admin/users/:id — deactivate/reactivate, rename, or replace the
// whole provinces list outright.
const updateUser = asyncHandler(async (req, res) => {
  const { isActive, phone, name, provinces } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (typeof isActive === "boolean") user.isActive = isActive;
  if (phone !== undefined) user.phone = phone;
  if (name !== undefined) user.name = name;
  if (Array.isArray(provinces)) user.provinces = await validateProvinceIds(provinces, res);

  await user.save();
  res.json({ success: true, user: await user.populate("provinces", "name state") });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, message: "User removed" });
});

// POST /api/admin/users/:id/provinces — add a Security Official to one more province.
const addOfficialProvince = asyncHandler(async (req, res) => {
  const { provinceId } = req.body;
  const [province, user] = await Promise.all([
    Province.findById(provinceId),
    User.findById(req.params.id),
  ]);
  if (!province) {
    res.status(404);
    throw new Error("Province not found");
  }
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const already = user.provinces.some((p) => String(p) === String(provinceId));
  if (!already) {
    user.provinces.push(provinceId);
    await user.save();
  }
  res.json({ success: true, user: await user.populate("provinces", "name state") });
});

// DELETE /api/admin/users/:id/provinces/:provinceId — remove one assignment.
const removeOfficialProvince = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.provinces = user.provinces.filter((p) => String(p) !== String(req.params.provinceId));
  await user.save();
  res.json({ success: true, user: await user.populate("provinces", "name state") });
});

// PATCH /api/admin/users/:id/move-province — move a Security Official from
// one province to another in a single, explicit operation.
const moveOfficialProvince = asyncHandler(async (req, res) => {
  const { fromProvinceId, toProvinceId } = req.body;
  if (!toProvinceId) {
    res.status(400);
    throw new Error("toProvinceId is required");
  }

  const [toProvince, user] = await Promise.all([
    Province.findById(toProvinceId),
    User.findById(req.params.id),
  ]);
  if (!toProvince) {
    res.status(404);
    throw new Error("Destination province not found");
  }
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (fromProvinceId && !user.provinces.some((p) => String(p) === String(fromProvinceId))) {
    res.status(400);
    throw new Error("That official is not currently assigned to the source province");
  }

  if (fromProvinceId) {
    user.provinces = user.provinces.filter((p) => String(p) !== String(fromProvinceId));
  }
  if (!user.provinces.some((p) => String(p) === String(toProvinceId))) {
    user.provinces.push(toProvinceId);
  }
  await user.save();

  res.json({ success: true, user: await user.populate("provinces", "name state") });
});

// Shared helper: confirms every id in a list is a real Province before it's
// saved onto a user, so a typo doesn't silently create a dead assignment.
async function validateProvinceIds(ids, res) {
  const unique = [...new Set(ids.map(String))];
  const found = await Province.find({ _id: { $in: unique } }).select("_id");
  if (found.length !== unique.length) {
    res.status(400);
    throw new Error("One or more provinces do not exist");
  }
  return unique;
}

module.exports = {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
  addOfficialProvince,
  removeOfficialProvince,
  moveOfficialProvince,
};
