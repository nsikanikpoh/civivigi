import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api.js";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function UnsafeLocations() {
  const { user } = useAuth();
  const [states, setStates] = useState([]);
  const [stateId, setStateId] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [locations, setLocations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/states", { params: { withProvinces: true } }).then((res) => setStates(res.data.data));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/locations/unsafe", {
        params: { state: stateId || undefined, province: provinceId || undefined, page, limit: 12 },
      });
      setLocations(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [stateId, provinceId, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function markSafe(id) {
    await api.patch(`/locations/unsafe/${id}/mark-safe`);
    load();
  }

  const selectedState = states.find((s) => s._id === stateId);
  const provinces = selectedState?.provinces || [];

  return (
    <div className="page container">
      <h1>📍 Unsafe Areas</h1>
      <p className="muted">Locations flagged due to reported incidents, filterable by state and province.</p>

      <div className="filter-row">
        <select
          value={stateId}
          onChange={(e) => {
            setStateId(e.target.value);
            setProvinceId("");
            setPage(1);
          }}
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={provinceId}
          onChange={(e) => {
            setProvinceId(e.target.value);
            setPage(1);
          }}
          disabled={!stateId}
        >
          <option value="">All provinces</option>
          {provinces.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : locations.length === 0 ? (
        <p className="muted">No unsafe locations reported for this area right now.</p>
      ) : (
        <div className="case-grid">
          {locations.map((loc) => (
            <div key={loc._id} className="card location-card">
              <div className="case-card-header">
                <span className="case-type">⚠️ {loc.reasonType}</span>
                <span className={`badge ${loc.isSafeNow ? "badge-status-solved" : "badge-status-open"}`}>
                  {loc.isSafeNow ? "Safe now" : "Unsafe"}
                </span>
              </div>
              <p>{loc.label || [loc.province?.name, loc.state?.name].filter(Boolean).join(", ")}</p>
              <p className="muted small">Flagged {new Date(loc.flaggedAt).toLocaleString()}</p>
              {!loc.isSafeNow && user && (user.role === "security_official" || user.role === "admin") && (
                <button className="btn btn-primary btn-sm" onClick={() => markSafe(loc._id)}>
                  Mark area safe
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
