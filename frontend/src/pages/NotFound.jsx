import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page container center-page">
      <h1>404</h1>
      <p>That page doesn't exist.</p>
      <Link to="/" className="btn btn-primary">
        Back home
      </Link>
    </div>
  );
}
