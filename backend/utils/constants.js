// Shared enums / constants used across models, controllers and the USSD flow.

const CASE_TYPES = ["Robbery", "Kidnapping", "Violence", "Abuse", "Threat"];

// USSD menu maps a digit choice directly to a case type.
const USSD_CASE_TYPE_MENU = {
  "1": "Robbery",
  "2": "Kidnapping",
  "3": "Violence",
  "4": "Abuse",
  "5": "Threat",
};

const CASE_STATUSES = [
  "pending", // just reported, awaiting verification
  "verified", // confirmed by a Security Official
  "duplicate", // marked duplicate -> effectively removed from public feed
  "resolved", // handled/closed
];

const USER_ROLES = ["admin", "security_official"];

const SEVERITY_LEVELS = ["high", "medium", "low"];

const COMMUNITY_NEED_STATUSES = ["open", "closed", "solved"];

const REPORT_CHANNELS = ["web", "ussd"];

module.exports = {
  CASE_TYPES,
  USSD_CASE_TYPE_MENU,
  CASE_STATUSES,
  USER_ROLES,
  SEVERITY_LEVELS,
  COMMUNITY_NEED_STATUSES,
  REPORT_CHANNELS,
};
