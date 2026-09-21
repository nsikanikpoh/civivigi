const asyncHandler = require("../utils/asyncHandler");
const Case = require("../models/Case");
const UnsafeLocation = require("../models/UnsafeLocation");
const Province = require("../models/Province");
const { CASE_TYPES } = require("../utils/constants");
const { getPagination, buildPaginatedResponse } = require("../utils/pagination");
const { notifyOfficialsOfNewCase, dispatchVerifiedCase } = require("../services/notifyService");

// A Security Official may only manage (verify/mark-duplicate/resolve) a case
// reported in one of their assigned provinces. Admins bypass this entirely.
function assertCanManageCase(req, caseDoc, res) {
  if (req.user.role === "admin") return;
  const assigned = (req.user.provinces || []).some(
    (p) => String(p) === String(caseDoc.province)
  );
  if (!assigned) {
    res.status(403);
    throw new Error("You are not assigned to this case's province");
  }
}

// POST /api/cases — anybody can report, no auth required.
// Picks up the reporter's current location (sent from the browser's
// Geolocation API) and flags it as an unsafe location.
const createCase = asyncHandler(async (req, res) => {
  const {
    type,
    description,
    province,
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
  if (!description || !province) {
    res.status(400);
    throw new Error("description and province are required");
  }

  const provinceDoc = await Province.findById(province);
  if (!provinceDoc) {
    res.status(400);
    throw new Error("That province does not exist");
  }

  const caseDoc = await Case.create({
    type,
    description,
    province: provinceDoc._id,
    state: provinceDoc.state,
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
      province: provinceDoc._id,
      state: provinceDoc.state,
      location: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
      reasonType: type,
    });
  }

  await caseDoc.populate([
    { path: "province", select: "name" },
    { path: "state", select: "name" },
  ]);
  notifyOfficialsOfNewCase(caseDoc).catch((err) =>
    console.error("[case] Failed to notify officials:", err)
  );

  res.status(201).json({ success: true, case: caseDoc });
});

// GET /api/cases?state=&province=&type=&status= — public feed, excludes
// duplicates by default.
const listCases = asyncHandler(async (req, res) => {
  const { state, province, type, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (state) filter.state = state;
  if (province) filter.province = province;
  if (type) filter.type = type;
  filter.status = status || { $ne: "duplicate" };

  const [items, total] = await Promise.all([
    Case.find(filter)
      .populate("province", "name")
      .populate("state", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Case.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ items, total, page, limit }));
});

// GET /api/cases/:id
const getCase = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findById(req.params.id)
    .populate("province", "name")
    .populate("state", "name");
  if (!caseDoc) {
    res.status(404);
    throw new Error("Case not found");
  }
  res.json({ success: true, case: caseDoc });
});

// PATCH /api/cases/:id/verify — Security Official (own province) or Admin.
const verifyCase = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findById(req.params.id);
  if (!caseDoc) {
    res.status(404);
    throw new Error("Case not found");
  }
  assertCanManageCase(req, caseDoc, res);
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
    await caseDoc.populate([
      { path: "province", select: "name" },
      { path: "state", select: "name" },
    ]);
    dispatchResult = await dispatchVerifiedCase(caseDoc);
  }

  res.json({ success: true, case: caseDoc, dispatch: dispatchResult });
});

// PATCH /api/cases/:id/duplicate — Security Official (own province) or Admin.
const markDuplicate = asyncHandler(async (req, res) => {
  const { duplicateOfCase } = req.body;
  const caseDoc = await Case.findById(req.params.id);
  if (!caseDoc) {
    res.status(404);
    throw new Error("Case not found");
  }
  assertCanManageCase(req, caseDoc, res);

  caseDoc.status = "duplicate";
  caseDoc.markedDuplicateBy = req.user._id;
  if (duplicateOfCase) caseDoc.duplicateOfCase = duplicateOfCase;
  await caseDoc.save();

  res.json({ success: true, case: caseDoc });
});

// PATCH /api/cases/:id/resolve — Security Official (own province) or Admin.
const resolveCase = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findById(req.params.id);
  if (!caseDoc) {
    res.status(404);
    throw new Error("Case not found");
  }
  assertCanManageCase(req, caseDoc, res);
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
