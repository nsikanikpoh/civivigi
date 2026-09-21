import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api.js";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "security_official",
  phone: "",
  region: "",
  country: "",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get("/admin/users");
    setUsers(res.data.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
          <div className="form-row">
            <label>
              Region covered
              <input value={form.region} onChange={(e) => update("region", e.target.value)} />
            </label>
            <label>
              Country covered
              <input value={form.country} onChange={(e) => update("country", e.target.value)} />
            </label>
          </div>
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
                <th>Coverage</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    {u.name}
                    <div className="muted small">{u.email}</div>
                  </td>
                  <td>{u.role.replace("_", " ")}</td>
                  <td>
                    {u.region}, {u.country}
                  </td>
                  <td>{u.isActive ? "Active" : "Inactive"}</td>
                  <td className="table-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => toggleActive(u)}>
                      {u.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => remove(u)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
