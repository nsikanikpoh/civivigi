import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api.js";
import Pagination from "../components/Pagination.jsx";
import SeverityBadge from "../components/SeverityBadge.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const SEVERITIES = ["high", "medium", "low"];
const STATUSES = ["open", "closed", "solved"];

const emptyForm = {
  title: "",
  description: "",
  severity: "medium",
  status: "open",
  region: "",
  country: "",
};

export default function CommunityNeeds() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [needs, setNeeds] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/community-needs", {
        params: { severity: severity || undefined, status: status || undefined, page, limit: 9 },
      });
      setNeeds(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [severity, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/community-needs", form);
      setForm(emptyForm);
      setFormOpen(false);
      setPage(1);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add community need.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this community need?")) return;
    await api.delete(`/community-needs/${id}`);
    load();
  }

  async function changeStatus(id, newStatus) {
    await api.patch(`/community-needs/${id}`, { status: newStatus });
    load();
  }

  return (
    <div className="page container">
      <div className="dashboard-header">
        <div>
          <h1>📋 Community Needs</h1>
          <p className="muted">Major needs raised by the community, tracked through to resolution.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setFormOpen((o) => !o)}>
            {formOpen ? "Cancel" : "+ Add Need"}
          </button>
        )}
      </div>

      {isAdmin && formOpen && (
        <form className="card form" onSubmit={handleSubmit}>
          <h2>New community need</h2>
          <label>
            Title *
            <input value={form.title} onChange={(e) => update("title", e.target.value)} required />
          </label>
          <label>
            Description *
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              required
            />
          </label>
          <div className="form-row">
            <label>
              Severity *
              <select value={form.severity} onChange={(e) => update("severity", e.target.value)}>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status *
              <select value={form.status} onChange={(e) => update("status", e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Region
              <input value={form.region} onChange={(e) => update("region", e.target.value)} />
            </label>
            <label>
              Country
              <input value={form.country} onChange={(e) => update("country", e.target.value)} />
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add need"}
          </button>
        </form>
      )}

      <div className="filter-row">
        <span className="filter-label">Severity:</span>
        <button
          className={`chip-filter ${severity === "" ? "active" : ""}`}
          onClick={() => {
            setSeverity("");
            setPage(1);
          }}
        >
          All
        </button>
        {SEVERITIES.map((s) => (
          <button
            key={s}
            className={`chip-filter ${severity === s ? "active" : ""}`}
            onClick={() => {
              setSeverity(s);
              setPage(1);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <span className="filter-label">Status:</span>
        <button
          className={`chip-filter ${status === "" ? "active" : ""}`}
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`chip-filter ${status === s ? "active" : ""}`}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : needs.length === 0 ? (
        <p className="muted">No community needs found.</p>
      ) : (
        <div className="case-grid">
          {needs.map((n) => (
            <div key={n._id} className="card">
              <div className="case-card-header">
                <strong>{n.title}</strong>
                <div className="badge-group">
                  <SeverityBadge severity={n.severity} />
                  <StatusBadge status={n.status} />
                </div>
              </div>
              <p>{n.description}</p>
              <p className="muted small">{[n.region, n.country].filter(Boolean).join(", ")}</p>
              {isAdmin && (
                <div className="case-card-actions">
                  {STATUSES.filter((s) => s !== n.status).map((s) => (
                    <button
                      key={s}
                      className="btn btn-outline btn-sm"
                      onClick={() => changeStatus(n._id, s)}
                    >
                      Mark {s}
                    </button>
                  ))}
                  <button className="btn btn-outline btn-sm" onClick={() => remove(n._id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
