import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import CaseCard from "../components/CaseCard.jsx";
import Pagination from "../components/Pagination.jsx";

const STATUS_FILTERS = ["pending", "verified", "resolved", "duplicate"];

export default function Dashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/cases", { params: { page, limit: 10, status } });
      setCases(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id, action) {
    setActionMsg("");
    try {
      await api.patch(`/cases/${id}/${action}`);
      setActionMsg(`Case ${action === "duplicate" ? "marked as duplicate" : action}.`);
      load();
    } catch (err) {
      setActionMsg(err.response?.data?.message || "Action failed.");
    }
  }

  return (
    <div className="page container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Signed in as <strong>{user?.name}</strong> ({user?.role.replace("_", " ")})
          </p>
        </div>
        {user?.role === "admin" && (
          <Link to="/admin/users" className="btn btn-outline">
            Manage Officials &amp; Admins
          </Link>
        )}
      </div>

      <div className="filter-row">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`chip-filter ${status === s ? "active" : ""}`}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {actionMsg && <p className="notice">{actionMsg}</p>}

      {loading ? (
        <p>Loading cases…</p>
      ) : cases.length === 0 ? (
        <p className="muted">No {status} cases right now.</p>
      ) : (
        <div className="case-grid">
          {cases.map((c) => (
            <CaseCard
              key={c._id}
              caseItem={c}
              actions={
                c.status !== "duplicate" && c.status !== "resolved" ? (
                  <>
                    {c.status !== "verified" && (
                      <button className="btn btn-primary btn-sm" onClick={() => act(c._id, "verify")}>
                        Verify
                      </button>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => act(c._id, "duplicate")}>
                      Mark duplicate
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => act(c._id, "resolve")}>
                      Resolve
                    </button>
                  </>
                ) : null
              }
            />
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
