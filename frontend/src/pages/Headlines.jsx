import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api.js";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = {
  title: "",
  summary: "",
  body: "",
  speaker: "",
  sourceUrl: "",
  publishedAt: "",
  region: "",
  country: "",
};

export default function Headlines() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [headlines, setHeadlines] = useState([]);
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
      const res = await api.get("/headlines", {
        params: { from: from || undefined, to: to || undefined, page, limit: 8 },
      });
      setHeadlines(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [from, to, page]);

  useEffect(() => {
    load();
  }, [load]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || (!form.summary.trim() && !form.body.trim())) {
      setError("Title and a summary or body are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      payload.publishedAt = payload.publishedAt
        ? new Date(payload.publishedAt).toISOString()
        : undefined;
      await api.post("/headlines", payload);
      setForm(emptyForm);
      setFormOpen(false);
      setPage(1);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add headline.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this headline?")) return;
    await api.delete(`/headlines/${id}`);
    load();
  }

  return (
    <div className="page container">
      <div className="dashboard-header">
        <div>
          <h1>📰 Headlines &amp; Government Speeches</h1>
          <p className="muted">Filtered by date range.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setFormOpen((o) => !o)}>
            {formOpen ? "Cancel" : "+ Add Headline"}
          </button>
        )}
      </div>

      {isAdmin && formOpen && (
        <form className="card form" onSubmit={handleSubmit}>
          <h2>New headline</h2>
          <label>
            Title *
            <input value={form.title} onChange={(e) => update("title", e.target.value)} required />
          </label>
          <label>
            Summary
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) => update("summary", e.target.value)}
              placeholder="A short one- or two-sentence summary."
            />
          </label>
          <label>
            Full text / speech (optional)
            <textarea rows={4} value={form.body} onChange={(e) => update("body", e.target.value)} />
          </label>
          <div className="form-row">
            <label>
              Speaker
              <input
                value={form.speaker}
                onChange={(e) => update("speaker", e.target.value)}
                placeholder="e.g. State Governor"
              />
            </label>
            <label>
              Published date
              <input
                type="date"
                value={form.publishedAt}
                onChange={(e) => update("publishedAt", e.target.value)}
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
          <label>
            Source URL (optional)
            <input value={form.sourceUrl} onChange={(e) => update("sourceUrl", e.target.value)} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add headline"}
          </button>
        </form>
      )}

      <div className="filter-row">
        <label className="inline-label">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="inline-label">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : headlines.length === 0 ? (
        <p className="muted">No headlines in this range.</p>
      ) : (
        <div className="headline-list">
          {headlines.map((h) => (
            <div key={h._id} className="card headline-card">
              <div className="headline-date">{new Date(h.publishedAt).toLocaleDateString()}</div>
              <h3>{h.title}</h3>
              {h.speaker && <p className="muted small">— {h.speaker}</p>}
              <p>{h.summary || h.body}</p>
              {h.sourceUrl && (
                <a href={h.sourceUrl} target="_blank" rel="noreferrer" className="muted small">
                  Source ↗
                </a>
              )}
              {isAdmin && (
                <div className="case-card-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => remove(h._id)}>
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
