# CiviVigi

**Safety, Reporting & Protection for communities — web + USSD.**

CiviVigi lets anyone report threats, violence or abuse and get connected to
the Security Officials who can act on it. Verified reports are relayed to
subscribed WhatsApp groups (by text *and* voice call) and published to
CiviVigi's social channels. The platform also surfaces unsafe areas,
government projects, community needs, official headlines, and a space for
public opinion — all in one place.

This is a **MERN** proof-of-concept: MongoDB, Express, React (Vite), Node.js.

---

## What's inside

```
civivigi/
├── backend/     Express + Mongoose API, USSD webhook, WhatsApp/social integrations
└── frontend/    React (Vite) web app — landing page, reporting flow, dashboards
```

### Core features implemented

- **State / Province hierarchy** — Admin-managed geography (not free text).
  Every incident is scoped to a **Province**, which belongs to a **State**.
  Admins add/remove states and provinces from the "States & Provinces" page.
- **Public incident reporting** (no account needed) — Robbery, Kidnapping,
  Violence, Abuse, Threat — scoped to a Province (State cascades from it),
  with the reporter's current location captured and flagged unsafe.
- **USSD reporting** — a numeric menu flow (`POST /api/ussd`) compatible with
  telecom USSD gateways (Africa's-Talking-style webhook payloads); the caller
  types their state name, then their province name within it.
- **Security Officials & Admins** — provisioned by an Admin (no self sign-up),
  JWT-authenticated, role-gated. Officials are assigned to one or more
  **Provinces**; an Admin can add, remove, or explicitly **move** an official
  from one province to another.
- **Province-scoped case management** — a Security Official can only verify,
  mark-duplicate, or resolve a case reported in one of their assigned
  provinces (enforced server-side); Admins can manage any case.
- **Verification workflow** — officials verify or mark cases as duplicate
  (duplicates are removed from the public feed).
- **Notifications on report** — the Security Officials assigned to the
  case's province are sent a WhatsApp text *and* a WhatsApp/voice call that
  reads the same message aloud if picked up.
- **Notifications on verification** — the case is broadcast to every
  WhatsApp group subscribed to that province (or to the whole state, if the
  group subscribed state-wide), and published to Twitter, Facebook and
  Instagram.
- **Browse & filter by state/province** — a "States & Provinces" page shows
  the whole hierarchy, lets you filter incidents by state and/or province,
  and **ranks provinces by number of reported incidents**.
- **Unsafe locations** — filterable by state/province; officials can mark a
  location safe again once cleared.
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

| Role               | Email                     | Password         | Provinces covered           |
|--------------------|---------------------------|-------------------|------------------------------|
| Admin               | admin@civivigi.org        | Admin@12345       | (all — admin bypasses scoping) |
| Security Official   | official@civivigi.org     | Official@12345    | Ikeja, Ikorodu (Lagos)       |
| Security Official   | official2@civivigi.org    | Official@12345    | Abeokuta (Ogun)              |

The seed also creates the **Lagos** and **Ogun** states with their
provinces, so the "States & Provinces" page and the incident ranking table
have real data to show immediately.

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
| `POST /api/admin/users` | Admin | Add an Official or Admin (officials can take an initial `provinces` array) |
| `GET/PATCH/DELETE /api/admin/users/:id` | Admin | Manage users; `PATCH` can replace the whole `provinces` array |
| `POST /api/admin/users/:id/provinces` | Admin | Add one province assignment |
| `DELETE /api/admin/users/:id/provinces/:provinceId` | Admin | Remove one province assignment |
| `PATCH /api/admin/users/:id/move-province` | Admin | Move an official from one province to another in one call |
| `GET /api/states` (`?withProvinces=true`) | Public | List states, optionally nested with their provinces |
| `POST /api/states` / `DELETE /api/states/:id` | Admin | Add/remove a state |
| `GET /api/provinces` (`?state=`) | Public | List provinces, optionally filtered by state |
| `POST /api/provinces` / `DELETE /api/provinces/:id` | Admin | Add/remove a province (belongs to a state) |
| `GET /api/provinces/ranking` (`?state=&limit=`) | Public | Provinces ranked by number of reported incidents |
| `POST /api/cases` | Public | Report an incident (web) — takes a `province` id |
| `GET /api/cases` (`?state=&province=&type=&status=`) | Public | Browse the case feed (paginated, filterable) |
| `PATCH /api/cases/:id/verify` | Official (own province)/Admin | Verify → dispatches WhatsApp + social |
| `PATCH /api/cases/:id/duplicate` | Official (own province)/Admin | Mark duplicate (removed from public feed) |
| `PATCH /api/cases/:id/resolve` | Official (own province)/Admin | Close out a case |
| `GET /api/locations/unsafe` (`?state=&province=`) | Public | Unsafe locations, filterable by state/province |
| `PATCH /api/locations/unsafe/:id/mark-safe` | Official/Admin | Clear a flagged location |
| `POST /api/subscriptions` | Public | A WhatsApp group subscribes to a state feed (optionally scoped to one province) |
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

The caller picks a number, then types their **state** name, then their
**province** name within that state (each is resolved against the real
State/Province records with a case-insensitive match — an unrecognized name
re-prompts rather than failing the session), then a short description; the
case is created exactly like a web report (including officials being
notified), and the session auto-expires after 30 minutes of inactivity.

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
- The State/Province migration covers the resources the feature request
  named — **Case**, **UnsafeLocation**, **User** (Security Officials), and
  **WhatsAppSubscription**. Government Projects, Community Needs, Headlines
  and Opinions still use the original free-text region/country fields, since
  that request was specifically about incident reporting, officials, and
  province/state administration.
