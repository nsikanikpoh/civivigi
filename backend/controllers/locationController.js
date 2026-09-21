const asyncHandler = require("../utils/asyncHandler");
const UnsafeLocation = require("../models/UnsafeLocation");
const { getPagination, buildPaginatedResponse } = require("../utils/pagination");

// GET /api/locations/unsafe?city=... — locations in the user's current city
// flagged unsafe due to reported incidents (currently-unsafe only, by default).
const listUnsafeLocations = asyncHandler(async (req, res) => {
  const { city, region, country, includeSafe } = req.query;
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20 });

  const filter = {};
  if (city) filter.city = city;
  if (region) filter.region = region;
  if (country) filter.country = country;
  if (includeSafe !== "true") filter.isSafeNow = false;

  const [items, total] = await Promise.all([
    UnsafeLocation.find(filter)
      .populate("case", "type description status createdAt")
      .sort({ flaggedAt: -1 })
      .skip(skip)
      .limit(limit),
    UnsafeLocation.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ items, total, page, limit }));
});

// PATCH /api/locations/unsafe/:id/mark-safe — Security Official only.
const markLocationSafe = asyncHandler(async (req, res) => {
  const loc = await UnsafeLocation.findById(req.params.id);
  if (!loc) {
    res.status(404);
    throw new Error("Unsafe location not found");
  }
  loc.isSafeNow = true;
  loc.markedSafeBy = req.user._id;
  loc.markedSafeAt = new Date();
  await loc.save();
  res.json({ success: true, location: loc });
});

module.exports = { listUnsafeLocations, markLocationSafe };
