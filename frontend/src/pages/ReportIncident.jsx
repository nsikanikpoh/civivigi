import React, { useState, useEffect } from "react";
import api from "../api/api.js";

const CASE_TYPES = ["Robbery", "Kidnapping", "Violence", "Abuse", "Threat"];

export default function ReportIncident() {
  const [states, setStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [form, setForm] = useState({
    type: "",
    description: "",
    stateId: "",
    provinceId: "",
    reporterName: "",
    reporterPhone: "",
  });
  const [coords, setCoords] = useState(null);
  const [locStatus, setLocStatus] = useState("idle"); // idle | locating | done | denied
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/states", { params: { withProvinces: true } })
      .then((res) => setStates(res.data.data))
      .finally(() => setLoadingStates(false));
  }, []);

  function captureLocation() {
    if (!("geolocation" in navigator)) {
      setLocStatus("denied");
      return;
    }
    setLocStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocStatus("done");
      },
      () => setLocStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateState(stateId) {
    setForm((f) => ({ ...f, stateId, provinceId: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.type || !form.description || !form.stateId || !form.provinceId) {
      setError("Please fill in incident type, description, state and province.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        type: form.type,
        description: form.description,
        province: form.provinceId,
        reporterName: form.reporterName,
        reporterPhone: form.reporterPhone,
      };
      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }
      const res = await api.post("/cases", payload);
      setResult(res.data.case);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong submitting your report.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedState = states.find((s) => s._id === form.stateId);
  const provinces = selectedState?.provinces || [];

  if (result) {
    return (
      <div className="page container narrow">
        <div className="card success-card">
          <h1>✅ Report submitted</h1>
          <p>
            Thank you — your <strong>{result.type}</strong> report has been received and
            Security Officials in the area have been alerted.
          </p>
          <p className="muted">Reference: {result._id.slice(-8).toUpperCase()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page container narrow">
      <h1>🚨 Report an Incident</h1>
      <p className="muted">
        No account needed. Your report goes straight to Security Officials covering this area.
      </p>

      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Incident type *
          <select value={form.type} onChange={(e) => update("type", e.target.value)}>
            <option value="">Select a type…</option>
            {CASE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label>
          What happened? *
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe what happened, when, and who was involved if known."
          />
        </label>

        <div className="form-row">
          <label>
            State *
            <select
              value={form.stateId}
              onChange={(e) => updateState(e.target.value)}
              disabled={loadingStates}
            >
              <option value="">{loadingStates ? "Loading…" : "Select a state…"}</option>
              {states.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Province *
            <select
              value={form.provinceId}
              onChange={(e) => update("provinceId", e.target.value)}
              disabled={!form.stateId}
            >
              <option value="">
                {form.stateId ? "Select a province…" : "Select a state first"}
              </option>
              {provinces.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="location-capture">
          <button type="button" className="btn btn-outline" onClick={captureLocation}>
            📍 {locStatus === "done" ? "Location captured" : "Use my current location"}
          </button>
          {locStatus === "locating" && <span className="muted">Locating…</span>}
          {locStatus === "denied" && (
            <span className="muted">Couldn't access location — you can still submit.</span>
          )}
          {locStatus === "done" && coords && (
            <span className="muted">
              {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)} — this area will be flagged
              as unsafe.
            </span>
          )}
        </div>

        <div className="form-row">
          <label>
            Your name (optional)
            <input value={form.reporterName} onChange={(e) => update("reporterName", e.target.value)} />
          </label>
          <label>
            Your phone (optional)
            <input value={form.reporterPhone} onChange={(e) => update("reporterPhone", e.target.value)} />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-danger btn-lg" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
