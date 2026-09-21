import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api.js";
import Pagination from "../components/Pagination.jsx";

export default function Opinions() {
  const [opinions, setOpinions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ authorName: "", title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/opinions", { params: { page, limit: 10 } });
      setOpinions(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.body.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/opinions", form);
      setForm({ authorName: "", title: "", body: "" });
      setPage(1);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function upvote(id) {
    await api.patch(`/opinions/${id}/upvote`);
    load();
  }

  return (
    <div className="page container">
      <h1>💬 Community Opinions &amp; Ideas</h1>
      <p className="muted">Share your ideas on community development and innovation.</p>

      <form className="card form opinion-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            Your name (optional)
            <input
              value={form.authorName}
              onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
            />
          </label>
          <label>
            Title (optional)
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
        </div>
        <label>
          Your opinion / idea *
          <textarea
            rows={3}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="What would make your community better?"
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Posting…" : "Post"}
        </button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="opinion-list">
          {opinions.map((o) => (
            <div key={o._id} className="card opinion-card">
              {o.title && <h3>{o.title}</h3>}
              <p>{o.body}</p>
              <div className="case-meta">
                <span>— {o.authorName || "Anonymous"}</span>
                <button className="btn btn-outline btn-sm" onClick={() => upvote(o._id)}>
                  👍 {o.upvotes}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
