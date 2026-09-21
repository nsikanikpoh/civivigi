const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const State = require("../models/State");
const Province = require("../models/Province");
const Case = require("../models/Case");

// GET /api/states — public. With ?withProvinces=true, nests each state's
// provinces so the frontend can render the whole hierarchy in one call.
const listStates = asyncHandler(async (req, res) => {
  const states = await State.find().sort({ name: 1 }).lean();

  if (req.query.withProvinces !== "true") {
    return res.json({ success: true, data: states });
  }

  const provinces = await Province.find().sort({ name: 1 }).lean();
  const byState = new Map();
  for (const p of provinces) {
    const key = String(p.state);
    if (!byState.has(key)) byState.set(key, []);
    byState.get(key).push(p);
  }
  const data = states.map((s) => ({ ...s, provinces: byState.get(String(s._id)) || [] }));
  res.json({ success: true, data });
});

// POST /api/states — Admin only.
const createState = asyncHandler(async (req, res) => {
  const { name, country } = req.body;
  if (!name) {
    res.status(400);
    throw new Error("name is required");
  }
  const exists = await State.findOne({ name: name.trim() });
  if (exists) {
    res.status(409);
    throw new Error("A state with that name already exists");
  }
  const state = await State.create({ name, country, createdBy: req.user._id });
  res.status(201).json({ success: true, state });
});

// DELETE /api/states/:id — Admin only. Refuses if provinces still reference it.
const deleteState = asyncHandler(async (req, res) => {
  const inUse = await Province.exists({ state: req.params.id });
  if (inUse) {
    res.status(400);
    throw new Error("Cannot delete a state that still has provinces — remove those first");
  }
  const state = await State.findByIdAndDelete(req.params.id);
  if (!state) {
    res.status(404);
    throw new Error("State not found");
  }
  res.json({ success: true, message: "State removed" });
});

// GET /api/provinces?state=<id> — public.
const listProvinces = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.state) filter.state = req.query.state;
  const provinces = await Province.find(filter).populate("state", "name country").sort({ name: 1 });
  res.json({ success: true, data: provinces });
});

// POST /api/provinces — Admin only.
const createProvince = asyncHandler(async (req, res) => {
  const { name, state } = req.body;
  if (!name || !state) {
    res.status(400);
    throw new Error("name and state are required");
  }
  const stateDoc = await State.findById(state);
  if (!stateDoc) {
    res.status(404);
    throw new Error("That state does not exist");
  }
  const exists = await Province.findOne({ state, name: name.trim() });
  if (exists) {
    res.status(409);
    throw new Error("That province already exists in this state");
  }
  const province = await Province.create({ name, state, createdBy: req.user._id });
  res.status(201).json({ success: true, province });
});

// DELETE /api/provinces/:id — Admin only.
const deleteProvince = asyncHandler(async (req, res) => {
  const province = await Province.findByIdAndDelete(req.params.id);
  if (!province) {
    res.status(404);
    throw new Error("Province not found");
  }
  res.json({ success: true, message: "Province removed" });
});

// GET /api/provinces/ranking?state=<id>&limit=10 — public. Ranks provinces
// by number of reported incidents (duplicates excluded, since those were
// removed from the public record).
const rankProvincesByIncidents = asyncHandler(async (req, res) => {
  const match = { status: { $ne: "duplicate" } };
  if (req.query.state) {
    match.state = new mongoose.Types.ObjectId(req.query.state);
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const ranked = await Case.aggregate([
    { $match: match },
    { $group: { _id: "$province", incidentCount: { $sum: 1 } } },
    { $sort: { incidentCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "provinces",
        localField: "_id",
        foreignField: "_id",
        as: "province",
      },
    },
    { $unwind: "$province" },
    {
      $lookup: {
        from: "states",
        localField: "province.state",
        foreignField: "_id",
        as: "province.state",
      },
    },
    { $unwind: "$province.state" },
    {
      $project: {
        _id: 0,
        provinceId: "$province._id",
        provinceName: "$province.name",
        stateId: "$province.state._id",
        stateName: "$province.state.name",
        incidentCount: 1,
      },
    },
  ]);

  res.json({ success: true, data: ranked });
});

module.exports = {
  listStates,
  createState,
  deleteState,
  listProvinces,
  createProvince,
  deleteProvince,
  rankProvincesByIncidents,
};
