const asyncHandler = require("../utils/asyncHandler");
const Case = require("../models/Case");
const UnsafeLocation = require("../models/UnsafeLocation");
const { CASE_TYPES } = require("../utils/constants");
const { getPagination, buildPaginatedResponse } = require("../utils/pagination");
const { notifyOfficialsOfNewCase, dispatchVerifiedCase } = require("../services/notifyService");

// POST /api/cases — anybody can report, no auth required.
// Picks up the reporter's current location (sent from the browser's
// Geolocation API) and flags it as an unsafe location.
const createCase = asyncHandler(async (req, res) => {
  const {
    type,
    description,
    region,
    country,
    city,
    latitude,
    longitude,
    locationLabel,
    reporterName,
    reporterPhone,
  } = req.body;

  if (!type || !CASE_TYPES.includes(type)) {
    res.status(400);
    throw new Error(`type must be one of: ${CASE_TYPES.join(", ")}`);
  }
  if (!description || !region || !country) {
    res.status(400);
    throw new Error("description, region and country are required");
  }

  const caseDoc = await Case.create({
    type,
    description,
    region,
    country,
    city,
    location:
      latitude != null && longitude != null
        ? {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
            label: locationLabel,
          }
        : undefined,
    reporter: { name: reporterName, phone: reporterPhone, channel: "web" },
  });

  // Flag the reporter's current location as unsafe immediately — this does
  // not wait for verification, since the point of the feature is an early
  // warning while the report is still pending review.
  if (latitude != null && longitude != null) {
    await UnsafeLocation.create({
      case: caseDoc._id,
      label: locationLabel,
      city,
      region,
      country,
      location: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
      reasonType: type,
    });
  }

  notifyOfficialsOfNewCase(caseDoc).catch((err) =>
    console.error("[case] Failed to notify officials:", err)
  );

  res.status(201).json({ success: true, case: caseDoc });
});

// GET /api/cases — public feed, excludes duplicates by default.
const listCases = asyncHandler(async (req, res) => {
  const { region, country, city, type, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (region) filter.region = region;
  if (country) filter.country = country;
  if (city) filter.city = city;
  if (type) filter.type = type;
  filter.status = status || { $ne: "duplicate" };

  const [items, total] = await Promise.all([
    Case.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Case.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ items, total, page, limit }));
});

// GET /api/cases/:id
const getCase = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findById(req.params.id);
  if (!caseDoc) {
    res.status(404);
    throw new Error("Case not found");
  }
  res.json({ success: true, case: caseDoc });
});

// PATCH /api/cases/:id/verify — Security Official only.
const verifyCase = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findById(req.params.id);
  if (!caseDoc) {
    res.status(404);
    throw new Error("Case not found");
  }
  if (caseDoc.status === "duplicate") {
    res.status(400);
    throw new Error("A duplicate case cannot be verified");
  }

  caseDoc.status = "verified";
  caseDoc.verifiedBy = req.user._id;
  caseDoc.verifiedAt = new Date();
  await caseDoc.save();

  let dispatchResult = null;
  if (!caseDoc.dispatched) {
    caseDoc.dispatched = true;
    await caseDoc.save();
    dispatchResult = await dispatchVerifiedCase(caseDoc);
  }

  res.json({ success: true, case: caseDoc, dispatch: dispatchResult });
});

// PATCH /api/cases/:id/duplicate — Security Official marks + removes from public feed.
const markDuplicate = asyncHandler(async (req, res) => {
  const { duplicateOfCase } = req.body;
  const caseDoc = await Case.findById(req.params.id);
  if (!caseDoc) {
    res.status(404);
    throw new Error("Case not found");
  }

  caseDoc.status = "duplicate";
  caseDoc.markedDuplicateBy = req.user._id;
  if (duplicateOfCase) caseDoc.duplicateOfCase = duplicateOfCase;
  await caseDoc.save();

  res.json({ success: true, case: caseDoc });
});

// PATCH /api/cases/:id/resolve — Security Official closes out a case.
const resolveCase = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findById(req.params.id);
  if (!caseDoc) {
    res.status(404);
    throw new Error("Case not found");
  }
  caseDoc.status = "resolved";
  await caseDoc.save();
  res.json({ success: true, case: caseDoc });
});

module.exports = {
  createCase,
  listCases,
  getCase,
  verifyCase,
  markDuplicate,
  resolveCase,
};
