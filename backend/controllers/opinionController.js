const asyncHandler = require("../utils/asyncHandler");
const Opinion = require("../models/Opinion");
const { getPagination, buildPaginatedResponse } = require("../utils/pagination");

// GET /api/opinions — public feed, paginated.
const listOpinions = asyncHandler(async (req, res) => {
  const { region, country } = req.query;
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20 });

  const filter = {};
  if (region) filter.region = region;
  if (country) filter.country = country;

  const [items, total] = await Promise.all([
    Opinion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Opinion.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ items, total, page, limit }));
});

// POST /api/opinions — anybody can post, no auth.
const createOpinion = asyncHandler(async (req, res) => {
  const { authorName, title, body, region, country } = req.body;
  if (!body) {
    res.status(400);
    throw new Error("body is required");
  }
  const opinion = await Opinion.create({ authorName, title, body, region, country });
  res.status(201).json({ success: true, opinion });
});

// PATCH /api/opinions/:id/upvote — public, lightweight engagement.
const upvoteOpinion = asyncHandler(async (req, res) => {
  const opinion = await Opinion.findByIdAndUpdate(
    req.params.id,
    { $inc: { upvotes: 1 } },
    { new: true }
  );
  if (!opinion) {
    res.status(404);
    throw new Error("Opinion not found");
  }
  res.json({ success: true, opinion });
});

module.exports = { listOpinions, createOpinion, upvoteOpinion };
