const asyncHandler = require("../utils/asyncHandler");
const Headline = require("../models/Headline");
const { getPagination, buildPaginatedResponse } = require("../utils/pagination");

// GET /api/headlines?from=2026-01-01&to=2026-03-01 — paginated, filtered by date.
const listHeadlines = asyncHandler(async (req, res) => {
  const { from, to, region, country } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (region) filter.region = region;
  if (country) filter.country = country;
  if (from || to) {
    filter.publishedAt = {};
    if (from) filter.publishedAt.$gte = new Date(from);
    if (to) filter.publishedAt.$lte = new Date(to);
  }

  const [items, total] = await Promise.all([
    Headline.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit),
    Headline.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ items, total, page, limit }));
});

// POST /api/headlines — Admin only.
const createHeadline = asyncHandler(async (req, res) => {
  const headline = await Headline.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, headline });
});

// DELETE /api/headlines/:id — Admin only.
const deleteHeadline = asyncHandler(async (req, res) => {
  const headline = await Headline.findByIdAndDelete(req.params.id);
  if (!headline) {
    res.status(404);
    throw new Error("Headline not found");
  }
  res.json({ success: true, message: "Headline deleted" });
});

module.exports = { listHeadlines, createHeadline, deleteHeadline };
