const asyncHandler = require("../utils/asyncHandler");
const CommunityNeed = require("../models/CommunityNeed");
const { getPagination, buildPaginatedResponse } = require("../utils/pagination");

// GET /api/community-needs?severity=high&status=open — paginated, filterable.
const listCommunityNeeds = asyncHandler(async (req, res) => {
  const { severity, status, region, country } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (severity) filter.severity = severity;
  if (status) filter.status = status;
  if (region) filter.region = region;
  if (country) filter.country = country;

  const [items, total] = await Promise.all([
    CommunityNeed.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CommunityNeed.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ items, total, page, limit }));
});

// POST /api/community-needs — Admin only.
const createCommunityNeed = asyncHandler(async (req, res) => {
  const need = await CommunityNeed.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, need });
});

// PATCH /api/community-needs/:id — Admin only (e.g. move status open -> solved).
const updateCommunityNeed = asyncHandler(async (req, res) => {
  const need = await CommunityNeed.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!need) {
    res.status(404);
    throw new Error("Community need not found");
  }
  res.json({ success: true, need });
});

// DELETE /api/community-needs/:id — Admin only.
const deleteCommunityNeed = asyncHandler(async (req, res) => {
  const need = await CommunityNeed.findByIdAndDelete(req.params.id);
  if (!need) {
    res.status(404);
    throw new Error("Community need not found");
  }
  res.json({ success: true, message: "Community need deleted" });
});

module.exports = {
  listCommunityNeeds,
  createCommunityNeed,
  updateCommunityNeed,
  deleteCommunityNeed,
};
