# CiviVigi

**Safety, Reporting & Protection for communities — web + USSD.**

CiviVigi lets anyone report threats, violence or abuse and get connected to
the Security Officials who can act on it. Verified reports are relayed to
subscribed WhatsApp groups (by text *and* voice call) and published to
CiviVigi's social channels. The platform also surfaces unsafe areas,
government projects, community needs, official headlines, and a space for
public opinion — all in one place.

This is a **MERN** proof-of-concept: MongoDB, Express, React (Vite), Node.js.


Every no is not a yes

---

## What's inside

```
civivigi/
├── backend/     Express + Mongoose API, USSD webhook, WhatsApp/social integrations
└── frontend/    React (Vite) web app — landing page, reporting flow, dashboards
```

### Core features implemented

- **Public incident reporting** (no account needed) — Robbery, Kidnapping,
  Violence, Abuse, Threat — scoped by state/region + country, with the
  reporter's current location captured and flagged unsafe.
- **USSD reporting** — a numeric menu flow (`POST /api/ussd`) compatible with
  telecom USSD gateways (Africa's-Talking-style webhook payloads).
- **Security Officials & Admins** — provisioned by an Admin (no self sign-up),
  JWT-authenticated, role-gated.
- **Verification workflow** — officials verify or mark cases as duplicate
  (duplicates are removed from the public feed).
- **Notifications on report** — the Security Officials covering the affected
  region are sent a WhatsApp text *and* a WhatsApp/voice call that reads the
  same message aloud if picked up.
- **Notifications on verification** — the case is broadcast to every
  WhatsApp group subscribed to that region/country, and published to
  Twitter, Facebook and Instagram.
- **Unsafe locations** — browsable by city; officials can mark a location
  safe again once cleared.
- **Government projects** — paginated, filterable by severity (high/medium/low).
- **Community needs** — paginated, filterable by severity and status
  (open/closed/solved).
- **Headlines & speeches** — paginated, filterable by date range.
- **Community opinions** — a public post + feed section with upvotes.

All third-party integrations (Twilio WhatsApp/voice, Twitter, Facebook,
Instagram) are **env-var-driven**: without credentials configured they log
what *would* have been sent to the console, so the whole flow can be
demoed end-to-end with zero external accounts. Add real credentials and
they start working for real with no code changes.

---

## Prerequisites

- Node.js 18+
- A MongoDB instance (local `mongod`, Docker, or a free MongoDB Atlas cluster)

---

## 1. Backend setup

```bash
cd backend
cp .env.example .env      # then edit MONGO_URI / JWT_SECRET as needed
npm install
npm run seed               # creates demo admin, official, cases, projects, etc.
npm run dev                 # starts on http://localhost:5000
```

Demo login (from the seed script, unless you changed `.env`):

| Role               | Email                     | Password         |
|--------------------|---------------------------|-------------------|
| Admin               | admin@civivigi.org        | Admin@12345       |
| Security Official   | official@civivigi.org     | Official@12345    |

### Key environment variables (`backend/.env`)

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Auth token signing |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Enables real WhatsApp messages + voice calls (blank = console-log mock) |
| `TWILIO_WHATSAPP_FROM` | Your Twilio WhatsApp sender, e.g. `whatsapp:+14155238886` |
| `TWILIO_VOICE_FROM` | Your Twilio voice number for the "ring + read aloud" call |
| `TWITTER_BEARER_TOKEN`, `FACEBOOK_PAGE_ACCESS_TOKEN` + `FACEBOOK_PAGE_ID`, `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Enables real social posting (blank = console-log mock) |

### API overview

| Method & Path | Access | Purpose |
|---|---|---|
| `POST /api/auth/login` | Public | Official/Admin sign-in |
| `GET /api/auth/me` | Authenticated | Current user |
| `POST /api/admin/users` | Admin | Add an Official or Admin |
| `GET/PATCH/DELETE /api/admin/users/:id` | Admin | Manage users |
| `POST /api/cases` | Public | Report an incident (web) |
| `GET /api/cases` | Public | Browse the case feed (paginated, filterable) |
| `PATCH /api/cases/:id/verify` | Official/Admin | Verify → dispatches WhatsApp + social |
| `PATCH /api/cases/:id/duplicate` | Official/Admin | Mark duplicate (removed from public feed) |
| `PATCH /api/cases/:id/resolve` | Official/Admin | Close out a case |
| `GET /api/locations/unsafe` | Public | Unsafe locations, filterable by city |
| `PATCH /api/locations/unsafe/:id/mark-safe` | Official/Admin | Clear a flagged location |
| `POST /api/subscriptions` | Public | A WhatsApp group subscribes to a region/country feed |
| `GET /api/gov-projects` | Public | Paginated, filterable by severity |
| `GET /api/community-needs` | Public | Paginated, filterable by severity + status |
| `GET /api/headlines` | Public | Paginated, filterable by date range |
| `GET/POST /api/opinions`, `PATCH /api/opinions/:id/upvote` | Public | Community opinions feed |
| `POST /api/ussd` | Telecom gateway | USSD webhook (`sessionId`, `phoneNumber`, `text`) |

---

## 2. Frontend setup

```bash
cd frontend
cp .env.example .env       # points VITE_API_BASE_URL at the backend
npm install
npm run dev                  # starts on http://localhost:5173
```

The landing page has a **Report an Incident** button (public), and a
separate **Official / Admin Sign In** for Security Officials and Admins,
who land on a role-based dashboard (case verification, duplicate marking,
unsafe-location clearing, and — for Admins — user management).

---

## USSD flow

`POST /api/ussd` expects the common `{ sessionId, phoneNumber, text }`
webhook shape used by gateways such as Africa's Talking, and responds with
plain text prefixed `CON` (continue) or `END` (terminate):

```
CON Welcome to CiviVigi
Report an incident:
1. Robbery
2. Kidnapping
3. Violence
4. Abuse
5. Threat
```

The caller picks a number, then enters region, country and a short
description; the case is created exactly like a web report (including
officials being notified), and the session auto-expires after 30 minutes of
inactivity.

---

## Notes on this being a proof of concept

- Passwords are hashed (bcrypt) and auth is JWT-based, but this build
  favors clarity over production hardening (no rate limiting, refresh
  tokens, email verification, etc.).
- WhatsApp calling: Twilio's dedicated WhatsApp Calling API is still
  limited-availability, so the "ring, and read the message aloud on
  pickup" behavior is implemented via Twilio Voice + TwiML `<Say>`, which
  produces the same experience described in the requirements. Swap in the
  WhatsApp Calling endpoints directly once your account has access.
- Social posting to Instagram requires an image; a generic CiviVigi alert
  graphic is used as a placeholder when a case has none.
