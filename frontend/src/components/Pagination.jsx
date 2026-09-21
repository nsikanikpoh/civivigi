import React from "react";

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination) return null;
  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button className="btn btn-outline" disabled={!hasPrevPage} onClick={() => onPageChange(page - 1)}>
        ← Prev
      </button>
      <span className="pagination-status">
        Page {page} of {totalPages}
      </span>
      <button className="btn btn-outline" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}>
        Next →
      </button>
    </div>
  );
}
