import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api.js";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function UnsafeLocations() {
  const { user } = useAuth();
  const [city, setCity] = useState("");
  const [locations, setLocations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/locations/unsafe", { params: { city: city || undefined, page, limit: 12 } });
      setLocations(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [city, page]);

  useEffect(() => {
    load();
  }, [load]);

  function detectCity() {
    if (!("geolocation" in navigator)) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async () => {
        // A POC-friendly stand-in: reverse-geocoding needs an external API
        // key, so we simply prompt for the city name informed by the browser
        // locale/timezone in a real build. Here we just let the user type it.
        setDetecting(false);
      },
      () => setDetecting(false)
    );
  }

  async function markSafe(id) {
    await api.patch(`/locations/unsafe/${id}/mark-safe`);
    load();
  }

  return (
    <div className="page container">
      <h1>📍 Unsafe Areas Near You</h1>
      <p className="muted">Locations flagged due to reported incidents in your current city.</p>

      <div className="filter-row">
        <input
          className="text-filter"
          placeholder="Enter your city…"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPage(1);
          }}
        />
        <button className="btn btn-outline" onClick={detectCity} disabled={detecting}>
          {detecting ? "Detecting…" : "📍 Use my location"}
        </button>
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
              <p>{loc.label || [loc.city, loc.region, loc.country].filter(Boolean).join(", ")}</p>
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
