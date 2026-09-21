const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

// All routes here are Admin-only (see routes/adminRoutes.js).

// POST /api/admin/users — add an Admin or a Security Official.
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, region, country } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("name, email, password and role are required");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error("A user with that email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    region,
    country,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, user: user.toSafeObject() });
});

// GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.region) filter.region = req.query.region;

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: users.map((u) => u.toSafeObject()) });
});

// PATCH /api/admin/users/:id — deactivate/reactivate or update coverage area
const updateUser = asyncHandler(async (req, res) => {
  const { isActive, region, country, phone, name } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (typeof isActive === "boolean") user.isActive = isActive;
  if (region !== undefined) user.region = region;
  if (country !== undefined) user.country = country;
  if (phone !== undefined) user.phone = phone;
  if (name !== undefined) user.name = name;

  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
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

module.exports = { createUser, listUsers, updateUser, deleteUser };
