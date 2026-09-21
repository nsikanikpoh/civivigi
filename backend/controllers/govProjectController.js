const asyncHandler = require("../utils/asyncHandler");
const GovProject = require("../models/GovProject");
const { getPagination, buildPaginatedResponse } = require("../utils/pagination");

// GET /api/gov-projects?severity=high — paginated, filterable by severity.
const listGovProjects = asyncHandler(async (req, res) => {
  const { severity, region, country } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (severity) filter.severity = severity;
  if (region) filter.region = region;
  if (country) filter.country = country;

  const [items, total] = await Promise.all([
    GovProject.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    GovProject.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ items, total, page, limit }));
});

// POST /api/gov-projects — Admin only.
const createGovProject = asyncHandler(async (req, res) => {
  const project = await GovProject.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, project });
});

// PATCH /api/gov-projects/:id — Admin only.
const updateGovProject = asyncHandler(async (req, res) => {
  const project = await GovProject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  res.json({ success: true, project });
});

// DELETE /api/gov-projects/:id — Admin only.
const deleteGovProject = asyncHandler(async (req, res) => {
  const project = await GovProject.findByIdAndDelete(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  res.json({ success: true, message: "Project deleted" });
});

module.exports = { listGovProjects, createGovProject, updateGovProject, deleteGovProject };
