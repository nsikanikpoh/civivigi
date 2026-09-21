import React from "react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: "📍",
    title: "Report from anywhere",
    text: "With Internet access or USSD report incidents anonymously, flagged unsafe location instantly.",
  },
  {
    icon: "✅",
    title: "Verified by officials",
    text: "Security Officials review every report before it goes out, keeping the feed accurate and trustworthy.",
  },
  {
    icon: "📡",
    title: "Instant alerts",
    text: "Verified cases reach subscribed WhatsApp groups by text and voice call, plus our social channels.",
  },
  {
    icon: "🏛️",
    title: "Civic transparency",
    text: "Follow up on government projects, community needs and official headlines, all in one place.",
  },
];

const caseTypes = [
  { icon: "💰", label: "Robbery" },
  { icon: "⛓️", label: "Kidnapping" },
  { icon: "🩸", label: "Violence" },
  { icon: "🚫", label: "Abuse" },
  { icon: "⚠️", label: "Threat" },
];

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-inner">
          <span className="pill">Community Safety Platform</span>
          <h1>
            See something wrong. <span className="highlight">Say it safely.</span>
          </h1>
          <p className="hero-sub">
            CiviVigi lets anyone report incidents, threats, violence, or abuse in seconds via web or USSD, 
            routing reports straight to security officials who can act.
          </p>
          <div className="hero-actions">
            <Link to="/report" className="btn btn-danger btn-lg">
              🚨 Report an Incident
            </Link>
            <Link to="/unsafe-locations" className="btn btn-outline btn-lg">
              View Unsafe Areas
            </Link>
          </div>
          <div className="hero-signin">
            <span>Official capacity?</span>
            <Link to="/signin">Security Official sign in →</Link>
          </div>
        </div>
        <div className="hero-graphic" aria-hidden="true">
          <div className="pulse-ring" />
          <div className="pulse-ring delay" />
          <div className="pulse-core">🛡️</div>
        </div>
      </section>

      <section className="case-types-strip">
        <p className="section-eyebrow">You can report</p>
        <div className="case-types-row">
          {caseTypes.map((c) => (
            <div key={c.label} className="case-type-chip">
              <span>{c.icon}</span> {c.label}
            </div>
          ))}
        </div>
      </section>

      <section className="features container">
        <h2>Built for real emergencies</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ussd-callout container">
        <div className="card ussd-card">
          <div>
            <h2>No internet? No problem.</h2>
            <p>
              Dial our USSD code from any mobile phone to report an incident through a simple
              numeric menu. No app, no data, no smartphone required.
            </p>
          </div>
          <div className="ussd-mock">
            <div className="ussd-screen">
              <p>Welcome to CiviVigi</p>
              <p>Report an incident:</p>
              <p>1. Robbery</p>
              <p>2. Kidnapping</p>
              <p>3. Violence</p>
              <p>4. Abuse</p>
              <p>5. Threat</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta container">
        <h2>Explore what's happening in your community</h2>
        <div className="cta-links">
          <Link to="/gov-projects" className="btn btn-outline">
            🏗️ Government Projects
          </Link>
          <Link to="/community-needs" className="btn btn-outline">
            📋 Community Needs
          </Link>
          <Link to="/headlines" className="btn btn-outline">
            📰 Headlines
          </Link>
          <Link to="/opinions" className="btn btn-outline">
            💬 Community Opinions
          </Link>
        </div>
      </section>
    </div>
  );
}
