import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api.js";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "security_official",
  phone: "",
  provinces: [],
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [states, setStates] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Per-row "move province" pickers: { [userId]: { from, to } }
  const [moveDrafts, setMoveDrafts] = useState({});

  const load = useCallback(async () => {
    const res = await api.get("/admin/users");
    setUsers(res.data.data);
  }, []);

  useEffect(() => {
    load();
    api.get("/states", { params: { withProvinces: true } }).then((res) => setStates(res.data.data));
  }, [load]);

  const allProvinces = states.flatMap((s) => (s.provinces || []).map((p) => ({ ...p, stateName: s.name })));

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleFormProvince(id) {
    setForm((f) => ({
      ...f,
      provinces: f.provinces.includes(id)
        ? f.provinces.filter((p) => p !== id)
        : [...f.provinces, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/admin/users", form);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add user");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(u) {
    await api.patch(`/admin/users/${u._id}`, { isActive: !u.isActive });
    load();
  }

  async function remove(u) {
    if (!confirm(`Remove ${u.name}?`)) return;
    await api.delete(`/admin/users/${u._id}`);
    load();
  }

  async function removeProvince(u, provinceId) {
    await api.delete(`/admin/users/${u._id}/provinces/${provinceId}`);
    load();
  }

  function setMoveDraft(userId, field, value) {
    setMoveDrafts((d) => ({ ...d, [userId]: { ...d[userId], [field]: value } }));
  }

  async function moveProvince(u) {
    const draft = moveDrafts[u._id] || {};
    if (!draft.to) return;
    await api.patch(`/admin/users/${u._id}/move-province`, {
      fromProvinceId: draft.from || undefined,
      toProvinceId: draft.to,
    });
    setMoveDrafts((d) => ({ ...d, [u._id]: {} }));
    load();
  }

  return (
    <div className="page container">
      <h1>Manage Security Officials &amp; Admins</h1>

      <div className="two-col">
        <form className="card form" onSubmit={handleSubmit}>
          <h2>Add user</h2>
          <label>
            Full name
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>
          <label>
            Temporary password
            <input
              type="text"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => update("role", e.target.value)}>
              <option value="security_official">Security Official</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            WhatsApp phone (E.164, e.g. +234...)
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </label>

          {form.role === "security_official" && (
            <div className="form-group">
              <span className="label-like">Provinces covered</span>
              <div className="checkbox-list">
                {states.map((s) => (
                  <div key={s._id}>
                    <strong className="muted small">{s.name}</strong>
                    {(s.provinces || []).map((p) => (
                      <label key={p._id} className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={form.provinces.includes(p._id)}
                          onChange={() => toggleFormProvince(p._id)}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                ))}
                {states.length === 0 && (
                  <p className="muted small">No states/provinces added yet — add them on the Provinces page first.</p>
                )}
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add user"}
          </button>
        </form>

        <div className="card">
          <h2>Existing users</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Provinces</th>
                <th>Status</th>
                <th>Move province</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const draft = moveDrafts[u._id] || {};
                return (
                  <tr key={u._id}>
                    <td>
                      {u.name}
                      <div className="muted small">{u.email}</div>
                    </td>
                    <td>{u.role.replace("_", " ")}</td>
                    <td>
                      {(u.provinces || []).length === 0 ? (
                        <span className="muted small">None</span>
                      ) : (
                        (u.provinces || []).map((p) => (
                          <span key={p._id} className="badge badge-province">
                            {p.name}
                            <button
                              type="button"
                              className="badge-remove"
                              title="Remove from this province"
                              onClick={() => removeProvince(u, p._id)}
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </td>
                    <td>{u.isActive ? "Active" : "Inactive"}</td>
                    <td>
                      {u.role === "security_official" && (
                        <div className="move-province-row">
                          <select
                            value={draft.from || ""}
                            onChange={(e) => setMoveDraft(u._id, "from", e.target.value)}
                          >
                            <option value="">From (optional)…</option>
                            {(u.provinces || []).map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={draft.to || ""}
                            onChange={(e) => setMoveDraft(u._id, "to", e.target.value)}
                          >
                            <option value="">To…</option>
                            {allProvinces.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} ({p.stateName})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={!draft.to}
                            onClick={() => moveProvince(u)}
                          >
                            Move
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="table-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => toggleActive(u)}>
                        {u.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => remove(u)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
