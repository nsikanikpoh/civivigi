import React from "react";
import StatusBadge from "./StatusBadge.jsx";

const typeIcons = {
  Robbery: "💰",
  Kidnapping: "⛓️",
  Violence: "🩸",
  Abuse: "🚫",
  Threat: "⚠️",
};

export default function CaseCard({ caseItem, actions }) {
  return (
    <div className="card case-card">
      <div className="case-card-header">
        <span className="case-type">
          {typeIcons[caseItem.type] || "❗"} {caseItem.type}
        </span>
        <StatusBadge status={caseItem.status} />
      </div>
      <p className="case-description">{caseItem.description}</p>
      <div className="case-meta">
        <span>
          📍 {[caseItem.province?.name, caseItem.state?.name].filter(Boolean).join(", ")}
        </span>
        <span>🕒 {new Date(caseItem.createdAt).toLocaleString()}</span>
      </div>
      {actions && <div className="case-card-actions">{actions}</div>}
    </div>
  );
}
