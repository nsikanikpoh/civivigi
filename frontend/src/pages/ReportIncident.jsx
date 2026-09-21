import React, { useState } from "react";
import api from "../api/api.js";

const CASE_TYPES = ["Robbery", "Kidnapping", "Violence", "Abuse", "Threat"];

export default function ReportIncident() {
  const [form, setForm] = useState({
    type: "",
    description: "",
    region: "",
    country: "",
    city: "",
    reporterName: "",
    reporterPhone: "",
  });
  const [coords, setCoords] = useState(null);
  const [locStatus, setLocStatus] = useState("idle"); // idle | locating | done | denied
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.type || !form.description || !form.region || !form.country) {
      setError("Please fill in incident type, description, region and country.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
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
            State / Region *
            <input value={form.region} onChange={(e) => update("region", e.target.value)} />
          </label>
          <label>
            Country *
            <input value={form.country} onChange={(e) => update("country", e.target.value)} />
          </label>
        </div>

        <label>
          City
          <input value={form.city} onChange={(e) => update("city", e.target.value)} />
        </label>

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
