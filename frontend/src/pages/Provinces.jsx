import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import CaseCard from "../components/CaseCard.jsx";
import Pagination from "../components/Pagination.jsx";

// Browse the State -> Province hierarchy, filter reported incidents by
// state/province, and see provinces ranked by incident count. States and
// provinces themselves are admin-managed; Admins get an inline add form here.
export default function Provinces() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [states, setStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);

  const [stateId, setStateId] = useState("");
  const [provinceId, setProvinceId] = useState("");

  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loadingCases, setLoadingCases] = useState(true);

  const [ranking, setRanking] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(true);

  const [newStateName, setNewStateName] = useState("");
  const [newProvinceState, setNewProvinceState] = useState("");
  const [newProvinceName, setNewProvinceName] = useState("");
  const [geoError, setGeoError] = useState("");

  const loadStates = useCallback(async () => {
    setLoadingStates(true);
    try {
      const res = await api.get("/states", { params: { withProvinces: true } });
      setStates(res.data.data);
    } finally {
      setLoadingStates(false);
    }
  }, []);

  const loadCases = useCallback(async () => {
    setLoadingCases(true);
    try {
      const res = await api.get("/cases", {
        params: { state: stateId || undefined, province: provinceId || undefined, page, limit: 9 },
      });
      setCases(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoadingCases(false);
    }
  }, [stateId, provinceId, page]);

  const loadRanking = useCallback(async () => {
    setLoadingRanking(true);
    try {
      const res = await api.get("/provinces/ranking", { params: { state: stateId || undefined, limit: 10 } });
      setRanking(res.data.data);
    } finally {
      setLoadingRanking(false);
    }
  }, [stateId]);

  useEffect(() => {
    loadStates();
  }, [loadStates]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  async function addState(e) {
    e.preventDefault();
    setGeoError("");
    if (!newStateName.trim()) return;
    try {
      await api.post("/states", { name: newStateName.trim() });
      setNewStateName("");
      loadStates();
    } catch (err) {
      setGeoError(err.response?.data?.message || "Failed to add state");
    }
  }

  async function addProvince(e) {
    e.preventDefault();
    setGeoError("");
    if (!newProvinceState || !newProvinceName.trim()) return;
    try {
      await api.post("/provinces", { name: newProvinceName.trim(), state: newProvinceState });
      setNewProvinceName("");
      loadStates();
      loadRanking();
    } catch (err) {
      setGeoError(err.response?.data?.message || "Failed to add province");
    }
  }

  const selectedState = states.find((s) => s._id === stateId);
  const provinces = selectedState?.provinces || [];

  return (
    <div className="page container">
      <h1>🗺️ States &amp; Provinces</h1>
      <p className="muted">Browse the state/province hierarchy, filter incidents, and see which provinces report the most.</p>

      {isAdmin && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2>Add to hierarchy (Admin)</h2>
          <div className="two-col">
            <form className="form form-row" onSubmit={addState}>
              <label>
                New state name
                <input value={newStateName} onChange={(e) => setNewStateName(e.target.value)} />
              </label>
              <button className="btn btn-primary btn-sm" type="submit">
                Add state
              </button>
            </form>
            <br/>
            <form className="form form-row" onSubmit={addProvince}>
              <label>
                State
                <select value={newProvinceState} onChange={(e) => setNewProvinceState(e.target.value)}>
                  <option value="">Select state…</option>
                  {states.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                New province name
                <input value={newProvinceName} onChange={(e) => setNewProvinceName(e.target.value)} />
              </label>
              <button className="btn btn-primary btn-sm" type="submit">
                Add province
              </button>
            </form>
          </div>
          {geoError && <p className="form-error">{geoError}</p>}
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <h2>Hierarchy</h2>
          {loadingStates ? (
            <p>Loading…</p>
          ) : states.length === 0 ? (
            <p className="muted">No states added yet.</p>
          ) : (
            <ul className="hierarchy-list">
              {states.map((s) => (
                <li key={s._id}>
                  <strong>{s.name}</strong>
                  <ul>
                    {(s.provinces || []).map((p) => (
                      <li key={p._id}>{p.name}</li>
                    ))}
                    {(s.provinces || []).length === 0 && <li className="muted small">No provinces yet</li>}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2>Provinces ranked by incidents{selectedState ? ` — ${selectedState.name}` : ""}</h2>
          {loadingRanking ? (
            <p>Loading…</p>
          ) : ranking.length === 0 ? (
            <p className="muted">No incidents recorded yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Province</th>
                  <th>State</th>
                  <th>Incidents</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.provinceId}>
                    <td>{i + 1}</td>
                    <td>{r.provinceName}</td>
                    <td>{r.stateName}</td>
                    <td>{r.incidentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <h2 style={{ marginTop: "2rem" }}>Filter incidents</h2>
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

      {loadingCases ? (
        <p>Loading incidents…</p>
      ) : cases.length === 0 ? (
        <p className="muted">No incidents match this filter.</p>
      ) : (
        <div className="case-grid">
          {cases.map((c) => (
            <CaseCard key={c._id} caseItem={c} />
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
