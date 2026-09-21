import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api.js";
import Pagination from "../components/Pagination.jsx";
import SeverityBadge from "../components/SeverityBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const SEVERITIES = ["high", "medium", "low"];

const emptyForm = {
  title: "",
  description: "",
  severity: "medium",
  region: "",
  country: "",
  budget: "",
};

export default function GovProjects() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [severity, setSeverity] = useState("");
  const [projects, setProjects] = useState([]);
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
      const res = await api.get("/gov-projects", {
        params: { severity: severity || undefined, page, limit: 9 },
      });
      setProjects(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [severity, page]);

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
      const payload = { ...form };
      payload.budget = payload.budget ? Number(payload.budget) : undefined;
      await api.post("/gov-projects", payload);
      setForm(emptyForm);
      setFormOpen(false);
      setPage(1);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add project.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this project?")) return;
    await api.delete(`/gov-projects/${id}`);
    load();
  }

  return (
    <div className="page container">
      <div className="dashboard-header">
        <div>
          <h1>🏗️ Government Projects</h1>
          <p className="muted">High-impact projects, filterable by severity of impact.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setFormOpen((o) => !o)}>
            {formOpen ? "Cancel" : "+ Add Project"}
          </button>
        )}
      </div>

      {isAdmin && formOpen && (
        <form className="card form" onSubmit={handleSubmit}>
          <h2>New government project</h2>
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
              Budget (optional)
              <input
                type="number"
                min="0"
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
              />
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
            {submitting ? "Adding…" : "Add project"}
          </button>
        </form>
      )}

      <div className="filter-row">
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

      {loading ? (
        <p>Loading…</p>
      ) : projects.length === 0 ? (
        <p className="muted">No projects found.</p>
      ) : (
        <div className="case-grid">
          {projects.map((p) => (
            <div key={p._id} className="card">
              <div className="case-card-header">
                <strong>{p.title}</strong>
                <SeverityBadge severity={p.severity} />
              </div>
              <p>{p.description}</p>
              <p className="muted small">
                {[p.region, p.country].filter(Boolean).join(", ")}
                {p.budget ? ` · Budget: ${Number(p.budget).toLocaleString()}` : ""}
              </p>
              {isAdmin && (
                <button className="btn btn-outline btn-sm" onClick={() => remove(p._id)}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
