import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Landing from "./pages/Landing.jsx";
import ReportIncident from "./pages/ReportIncident.jsx";
import SignIn from "./pages/SignIn.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UnsafeLocations from "./pages/UnsafeLocations.jsx";
import GovProjects from "./pages/GovProjects.jsx";
import CommunityNeeds from "./pages/CommunityNeeds.jsx";
import Headlines from "./pages/Headlines.jsx";
import Opinions from "./pages/Opinions.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/report" element={<ReportIncident />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/unsafe-locations" element={<UnsafeLocations />} />
          <Route path="/gov-projects" element={<GovProjects />} />
          <Route path="/community-needs" element={<CommunityNeeds />} />
          <Route path="/headlines" element={<Headlines />} />
          <Route path="/opinions" element={<Opinions />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["security_official", "admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <p>CiviVigi — Safety, Reporting &amp; Protection. Proof-of-concept build.</p>
      </footer>
    </>
  );
}
