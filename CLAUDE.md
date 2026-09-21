# CLAUDE.md — CiviVigi Build Playbook

This file is a self-contained recipe for building the **CiviVigi** MERN
proof-of-concept from a blank directory, exactly the way it was built the
first time. Hand this file to a fresh Claude session (or follow it yourself)
and it reproduces the same project end-to-end: same spec, same file order,
same conventions, same verification steps, same delivery.

Treat the "Product Spec" section as the literal brief given by the product
owner — reproduce it verbatim when re-briefing a fresh session so nothing is
lost in paraphrase. Treat "Build Order" as the sequence of `Write` calls to
issue, since later files depend on earlier ones (controllers import models,
routes import controllers, `server.js` imports routes).

---

## 1. Product Spec (verbatim brief)

> CiviVigi
> This is a web app and USSD accessed app that enables Safety, Reporting &
> Protection in a communities.
> It enable people to safely report threats, violence, or abuse and access
> clear pathways to timely support and protection.
>
> Reported cases are Designated By States/regions and countries.
>
> Anybody can report a case.
> A case is classified as Robbery, Kidnapping, violence, Abuse, Threat.
> Cases are designated by states/regions and countries.
>
> User types, Security officials and admins.
> Admins and security officials are added [not self-registered].
>
> Security Officials verify threats.
>
> When a case is marked as duplicate, it is removed.
> Security officials can mark a case as duplicate.
>
> WhatsApp group can subscribe to receive feeds by also specifying the
> state/region and country they want to receive feeds for.
> Once verified, it's forwarded to WhatsApp groups that subscribed to that
> Threat.
> Published on Twitter, Facebook and Instagram pages of CiviVigi.
>
> Picks Current Location and flags it as an unsafe location.
>
> Security Officials also mark flagged places as safe to enable resumption of
> movements and normal activities.
>
> Has a section where:
> Users can view locations in the current city that are flagged as unsafe due
> to incidence reported.
>
> Has a section that shows government projects that has major impact, by
> severity level: high, medium, and low.
> Has a section that shows major needs by severity levels and tracked by
> statuses: open, closed, and solved.
> These sections above should be paginated.
>
> A section that captures major headlines and speech from government.
> Paginated and filtered by date.
>
> A section that makes people air their opinion or idea on community
> development and innovation.
>
> The incident report can also be done by using USSD.
> Implement a backend API for integrating with telecom USSD, where a user
> picks the incident report type by choosing the number designated for it.
>
> Report triggers contacting security officials responsible for the areas
> affected: send them a WhatsApp message, and trigger a WhatsApp call that
> rings for a while, and if the receiver picks up, it should deliver the same
> message read to the recipient.
>
> MERN App.
> Build the entire app. Backend and frontend, with a landing page.
> From the landing page, users can see a button to report an event, and sign
> in for security officials and admins.
>
> Use designs that fit the purpose. Feel free to be creative. This will be a
> proof of concept for demo.

### Non-negotiable requirements distilled from the brief

- Stack: **MERN** (MongoDB/Mongoose, Express, React, Node). No other stack
  substitutions.
- Reporting is **anonymous-friendly** — no account required to report or to
  post an opinion or to subscribe a WhatsApp group.
- Exactly two authenticated roles: `admin`, `security_official`. Accounts are
  **provisioned by an Admin**, never self-registered. Build a login endpoint
  only — no signup endpoint should exist.
- Case types are a **closed enum**: Robbery, Kidnapping, Violence, Abuse,
  Threat. Don't invent extra types.
- Cases are scoped by **region + country** (not just country) — every
  region-based query, subscription, and official-coverage field must carry
  both fields together.
- "Marked duplicate" = **removed from the public feed**, not deleted from the
  database (officials need the audit trail; the public `GET /api/cases`
  should exclude `status: duplicate` by default).
- Verification triggers **two independent fan-outs**: WhatsApp groups (by
  region/country subscription) AND social media (Twitter/Facebook/Instagram)
  — both should be attempted even if one platform fails (`Promise.allSettled`,
  not `Promise.all`).
- Reporting triggers **two independent official-facing actions**: a WhatsApp
  text AND a WhatsApp/voice call that reads the same message aloud on
  pickup. Both must reuse the exact same formatted message string.
- Location capture happens **on report**, not only after verification — the
  unsafe-location flag is an early warning, so it must not wait on official
  review.
- Three list sections need **pagination**: government projects (severity
  filter), community needs (severity + status filter), headlines (date-range
  filter). A fourth, opinions, is paginated too even though not explicitly
  required, for consistency.
- USSD is a **real backend requirement**, not a frontend simulation: a
  webhook endpoint that speaks the numeric-menu protocol telecom gateways use
  (`CON`/`END` prefixed plain-text responses), with server-side session state
  (gateways call back once per keypress, statelessly).
- Landing page must have three visible entry points: report button, and
  separate official/admin sign-in — don't merge these into one form.
- Explicit creative license was given ("feel free to be creative... proof of
  concept for demo") — this licenses inventing a visual identity, copy, and
  layout, but does **not** license skipping any functional requirement above.

---

## 2. Ground rules for the build session

1. **Mock third-party integrations behind env vars, never behind fake code
   paths.** Every service (Twilio WhatsApp/voice, Twitter, Facebook,
   Instagram) checks whether its credentials are present; if not, it
   `console.log`s exactly what it would have sent and returns a
   `{ mocked: true, ... }` object. This means the POC runs and demos fully
   with zero real accounts, and flipping to production is a `.env` edit, not
   a code change. Never special-case "demo mode" logic scattered through
   controllers — keep the mock/real branch inside the service function only.
2. **Write files in dependency order**, not alphabetical or "whatever comes
   to mind" order: constants/utils → config → models → middleware → services
   → controllers → routes → `server.js`. This lets you `node --check` and
   `require()`-smoke-test each layer as it lands, instead of discovering a
   missing export after 30 files.
3. **One Mongoose model per collection, one controller per resource, one
   routes file per resource.** Don't collapse resources into a single fat
   controller — the spec has ~9 distinct resources (User, Case,
   UnsafeLocation, WhatsAppSubscription, GovProject, CommunityNeed, Headline,
   Opinion, UssdSession) and each maps to its own file trio
   (`models/X.js`, `controllers/xController.js`, `routes/xRoutes.js`).
4. **Public vs. protected is decided per-route, not per-router.** Several
   resources mix public GETs with protected mutations (e.g. `Case`:
   reporting and browsing are public, verify/duplicate/resolve are
   `security_official`/`admin` only). Apply `protect`/`authorize` middleware
   on individual route lines, not with a blanket `router.use()`, except for
   routers that are *entirely* admin-only (`adminRoutes.js`).
5. **Pagination and filtering are shared utilities, not copy-pasted per
   controller.** Build `utils/pagination.js` (`getPagination`,
   `buildPaginatedResponse`) once, before writing any list controller, and
   have every paginated `list*` controller call both helpers the same way.
6. **Verify as you go, not just at the end.** After the backend is fully
   written: `node --check` every file, then `require()` every module from a
   throwaway `node -e` script to catch load-time errors (missing exports,
   circular requires) that syntax-checking alone won't catch. After the
   frontend is fully written: `npm run build` and confirm zero errors before
   packaging. Do this before writing the README, so the README doesn't
   describe a broken build.
7. **Deliver as a clean zip**, not a directory listing: strip
   `node_modules/`, `dist/`, and OS cruft (`.DS_Store`) before zipping, and
   confirm the zip's file count/size look sane (`unzip -l`) before sending.
8. **The README is written last**, once the actual API surface and file tree
   are known — write it from what was actually built, not from the plan, so
   commands and endpoint tables can be run rather than roughly right.
9. When the user gives a large upfront spec like this, **do not ask
   clarifying questions before starting.** The spec is detailed enough to
   scaffold from directly; open questions (e.g. which chat platform to fall
   back to if WhatsApp calling isn't available) are resolved with a
   reasonable, stated default (see §5) rather than a blocking question,
   since this is an explicitly-labeled proof of concept for a demo.

---

## 3. Task list to create at the start

Create these four tracked tasks up front (one `TaskCreate` per task, mark
the first `in_progress` immediately) so progress is visible if the session
is long-running:

1. **Scaffold backend (Express + MongoDB)** — models, auth, routes/
   controllers for cases, subscriptions, gov projects, community needs,
   headlines, opinions, locations.
2. **Build integration services** — WhatsApp message+call trigger, social
   media posting (Twitter/FB/IG), USSD webhook flow, notify-officials-by-
   region logic — mocked but real integration points.
3. **Build React frontend** — landing page, report incident flow, sign-in,
   official/admin dashboard with case verification, unsafe locations, gov
   projects, community needs, headlines, opinions — all paginated where
   required.
4. **Seed data + README + package** — demo seed script, setup README, zip
   and deliver.

Update each to `completed` only once its files pass the verification step
in §6/§7 for that layer — don't mark "done" on writing the files alone.

---

## 4. Build order (exact file sequence)

### 4.1 Backend — directories

```bash
mkdir -p civivigi/backend/{config,models,middleware,routes,controllers,services,utils}
mkdir -p civivigi/frontend/src/{api,context,pages,components,styles}
```

### 4.2 Backend — foundation (write in this order)

1. `backend/package.json` — dependencies: `express`, `mongoose`, `bcryptjs`,
   `jsonwebtoken`, `cors`, `dotenv`, `morgan`, `twilio`, `axios`,
   `express-async-handler`; devDependency `nodemon`. Scripts: `start`,
   `dev`, `seed`.
2. `backend/.env.example` — `PORT`, `MONGO_URI`, `JWT_SECRET`,
   `JWT_EXPIRES_IN`, seed-admin credentials, Twilio vars
   (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`,
   `TWILIO_VOICE_FROM`, `PUBLIC_BASE_URL`), social vars (Twitter/Facebook/
   Instagram tokens), `USSD_SESSION_TTL_MS`. Every var an integration
   service reads must appear here, or the mock-mode fallback is undiscoverable.
3. `backend/config/db.js` — `connectDB()`: `mongoose.connect`, logs success,
   exits process on failure with an actionable message, logs on disconnect.
4. `backend/utils/constants.js` — every enum used anywhere in the app, in one
   place: `CASE_TYPES`, `USSD_CASE_TYPE_MENU` (digit → case type, this *is*
   the USSD menu contract), `CASE_STATUSES`, `USER_ROLES`,
   `SEVERITY_LEVELS`, `COMMUNITY_NEED_STATUSES`, `REPORT_CHANNELS`.
5. `backend/utils/pagination.js` — `getPagination(query, opts)` (parses/
   clamps `page`/`limit`, computes `skip`) and
   `buildPaginatedResponse({items, total, page, limit})` (returns
   `{ data, pagination: { total, page, limit, totalPages, hasNextPage,
   hasPrevPage } }`).
6. `backend/utils/asyncHandler.js` — re-export of `express-async-handler`,
   named for clarity in controller imports.

### 4.3 Backend — models (one file each, in this order)

1. `models/User.js` — `name, email(unique), password(select:false),
   role(enum USER_ROLES), phone, region, country, isActive, createdBy`.
   `pre('save')` bcrypt-hashes password when modified.
   `comparePassword(candidate)` and `toSafeObject()` (strips password)
   instance methods.
2. `models/Case.js` — `type(enum CASE_TYPES), description, region, country,
   city, location(GeoJSON Point + label), status(enum CASE_STATUSES,
   default pending), reporter{name,phone,channel}, verifiedBy, verifiedAt,
   markedDuplicateBy, duplicateOfCase, dispatched(Boolean)`. Indexes:
   `{region,country,status}` and a `2dsphere` on `location`. `dispatched`
   exists specifically to make verification idempotent — re-verifying an
   already-dispatched case must not re-broadcast.
3. `models/UnsafeLocation.js` — `case(ref), label, city, region, country,
   location(GeoJSON Point, required), reasonType, flaggedAt, isSafeNow
   (default false), markedSafeBy, markedSafeAt`. `2dsphere` index on
   `location`, compound index on `{city, isSafeNow}`.
4. `models/WhatsAppSubscription.js` — `groupName, groupWhatsAppId, region,
   country, isActive`. Compound index `{region, country, isActive}`.
5. `models/GovProject.js` — `title, description, severity(enum
   SEVERITY_LEVELS), region, country, budget, startDate, completionDate,
   imageUrl, createdBy`.
6. `models/CommunityNeed.js` — `title, description, severity(enum
   SEVERITY_LEVELS), status(enum COMMUNITY_NEED_STATUSES, default open),
   region, country, createdBy`.
7. `models/Headline.js` — `title, summary, body, speaker, sourceUrl,
   imageUrl, publishedAt(required, default now), region, country,
   createdBy`. Index on `publishedAt` descending (date-range queries + sort
   are the whole point of this resource).
8. `models/Opinion.js` — `authorName(default "Anonymous"), title, body
   (required), region, country, upvotes(default 0)`.
9. `models/UssdSession.js` — `sessionId(unique), phoneNumber, stage(enum:
   MAIN_MENU/AWAIT_TYPE/AWAIT_REGION/AWAIT_COUNTRY/AWAIT_DESCRIPTION/DONE),
   data{type,region,country,description}`. TTL index on `updatedAt`
   (`expireAfterSeconds`) so abandoned USSD sessions self-clean — telecom
   gateways don't send an explicit "session ended" signal you can rely on.

### 4.4 Backend — middleware

1. `middleware/auth.js` — `protect` (verifies Bearer JWT, loads
   `req.user`, rejects inactive users) and `authorize(...roles)` (403 if
   `req.user.role` isn't in the allowed list). Both are `asyncHandler`-wrapped
   or throw synchronously so `errorHandler` catches everything.
2. `middleware/errorHandler.js` — `notFound` (404 for unmatched routes) and
   `errorHandler` (maps `ValidationError`/`CastError`/duplicate-key `11000`
   to sensible status codes, hides stack traces when
   `NODE_ENV=production`).

### 4.5 Backend — services (write before controllers; controllers call these)

1. `services/whatsappService.js` — `isConfigured` flag from env vars.
   `sendWhatsAppMessage(to, body)`, `triggerWhatsAppCall(to, message)`
   (TwiML `<Say>` read-aloud; note in comments that this stands in for
   Twilio's WhatsApp Calling channel, still limited-availability, using
   Twilio Voice as the mechanism that produces the same "ring, then read
   aloud on pickup" behavior), `broadcastCaseToSubscriptions(subs, caseDoc)`,
   `formatCaseAlert(caseDoc)` (the **one** shared message-formatting
   function — message text and call text must be identical per the spec).
   Every function mock-logs and returns `{mocked:true,...}` when
   `!isConfigured`.
2. `services/socialMediaService.js` — `buildCaseCaption(caseDoc)` (shared
   caption builder), `postToTwitter`, `postToFacebook`, `postToInstagram`
   (each independently env-gated, mock-logs if unconfigured; Instagram falls
   back to a placeholder image URL since the Graph API requires one),
   `publishVerifiedCase(caseDoc)` fans out to all three with
   `Promise.allSettled`.
3. `services/notifyService.js` — the orchestration layer, imported by
   controllers instead of the two services above directly:
   `notifyOfficialsOfNewCase(caseDoc)` (finds active `security_official`
   users matching `region`+`country`, messages + calls each one that has a
   phone on file, logs a warning — doesn't throw — if none are found so
   reporting never fails just because no official is configured yet) and
   `dispatchVerifiedCase(caseDoc)` (finds matching active subscriptions,
   calls `broadcastCaseToSubscriptions` + `publishVerifiedCase`).
4. `services/ussdService.js` — `handleUssdRequest({sessionId, phoneNumber,
   text})`. Splits `text` on `*` (the Africa's-Talking-style accumulated-
   input convention), loads/creates a `UssdSession`, and switches on
   `session.stage` to advance a **4-step state machine**: main menu (digit →
   `USSD_CASE_TYPE_MENU` lookup) → region → country → description → create
   the `Case` (channel: `"ussd"`) → call `notifyOfficialsOfNewCase` → return
   an `END` response with a short reference code. Export the literal
   `MAIN_MENU_TEXT` string too, so the controller/tests can reuse it.

### 4.6 Backend — controllers (one per resource; import the matching
   model + relevant service/util)

Write in roughly this order, since later ones are simpler repeats of the
same pattern once the first few establish it:

1. `controllers/authController.js` — `login` (find by email, `select`
   password back in, compare, sign JWT with `{id, role}`), `getMe`. No
   register/signup handler — intentionally absent per spec.
2. `controllers/adminController.js` — `createUser` (admin-only; checks
   email uniqueness, sets `createdBy: req.user._id`), `listUsers` (filter by
   role/region), `updateUser` (toggle `isActive`, edit coverage
   region/country/phone/name — this is how an admin "provisions" or retires
   an official), `deleteUser`.
3. `controllers/caseController.js` — `createCase` (public; validates `type`
   against `CASE_TYPES`; if `latitude`/`longitude` present, also creates an
   `UnsafeLocation` in the same request — **before** notifying officials;
   fires `notifyOfficialsOfNewCase` without awaiting/blocking the HTTP
   response, but does log its failure), `listCases` (public, paginated,
   defaults `status` filter to `{$ne:'duplicate'}` so duplicates disappear
   from the feed without being deleted), `getCase`, `verifyCase` (sets
   status+verifiedBy/At, then — **only if `dispatched` was false** — flips
   `dispatched=true` and calls `dispatchVerifiedCase`, returning its result
   in the response for demo visibility), `markDuplicate` (accepts optional
   `duplicateOfCase` reference), `resolveCase`.
4. `controllers/locationController.js` — `listUnsafeLocations` (public,
   paginated, filters by city/region/country, defaults to `isSafeNow:false`
   unless `includeSafe=true` is passed, populates the linked `case`'s
   type/description/status), `markLocationSafe` (official/admin only, stamps
   `markedSafeBy`/`markedSafeAt`).
5. `controllers/subscriptionController.js` — `createSubscription` (public —
   any WhatsApp group can subscribe with no auth), `listSubscriptions`
   (official/admin), `deleteSubscription` (admin).
6. `controllers/govProjectController.js`,
   `controllers/communityNeedController.js`,
   `controllers/headlineController.js` — same shape each time: a public
   paginated `list*` with the resource's specific filters (severity;
   severity+status; date-range via `publishedAt.$gte/$lte`), and
   admin-guarded `create*`/`update*`/`delete*`.
7. `controllers/opinionController.js` — `listOpinions` (public, paginated),
   `createOpinion` (public, only `body` required), `upvoteOpinion` (public,
   `$inc: {upvotes: 1}` — no auth, this is intentionally frictionless).
8. `controllers/ussdController.js` — `ussdWebhook`: pulls
   `{sessionId, phoneNumber, text}` from `req.body`, calls
   `handleUssdRequest`, responds with `Content-Type: text/plain` (USSD
   gateways expect plain text, not JSON).

### 4.7 Backend — routes (one per resource, thin — just wiring)

For each controller above, write a matching `routes/xRoutes.js` that:
declares public routes with no middleware, and adds `protect,
authorize(...)` inline on the routes that need it. `adminRoutes.js` is the
one router that applies `router.use(protect, authorize('admin'))` blanket,
since every route under `/api/admin` is admin-only. `ussdRoutes.js` is a
single unguarded `POST /` (the telecom gateway can't send a JWT).

### 4.8 Backend — server.js (write last, after every route file exists)

`require('dotenv').config()` first line. Then: `express()`, `cors()`,
`express.json()`, `express.urlencoded({extended:true})`, `morgan('dev')`
(skip in test env). A `GET /api/health` liveness route. Mount every router
under `/api/<resource>`. `notFound` then `errorHandler` **last**, after all
routes. `connectDB().then(() => app.listen(PORT))` — never listen before the
DB connection resolves. `module.exports = app` (enables testing without
binding a port later, even though no test suite is in scope for this POC).

### 4.9 Backend — seed script

`utils/seed.js`: `require('dotenv').config()`, connect, `deleteMany({})` on
every collection (idempotent re-seeding for repeat demos), then create — in
this order so `_id` references exist when needed — one admin, one
security_official (with a real `phone` and matching `region`/`country` so
the notify-on-report flow has someone to notify), one WhatsApp subscription
for that same region/country, five cases spanning all five types and three
different statuses (including one `duplicate`, so the dashboard's duplicate
filter has something to show) each with GeoJSON coordinates and a paired
`UnsafeLocation` (skip the paired location for the duplicate case), three
gov projects (one per severity), three community needs (one per status),
two headlines at different `publishedAt` dates (so date filtering is
demoable), two opinions. End by printing the demo login credentials to the
console — this is what the person running the seed actually needs to see.

### 4.10 Frontend — scaffold

1. `frontend/package.json` — `react`, `react-dom`, `react-router-dom`,
   `axios`; devDependencies `vite`, `@vitejs/plugin-react`. Scripts:
   `dev`, `build`, `preview`.
2. `frontend/vite.config.js` — `@vitejs/plugin-react`, dev-server proxy of
   `/api` to `VITE_API_PROXY_TARGET` (default `http://localhost:5000`).
3. `frontend/.env.example` — `VITE_API_BASE_URL`.
4. `frontend/index.html` — sets the `<title>`/meta description to the real
   product pitch (not "Vite App"), loads two Google Fonts (a display face +
   a body face) since this is a designed landing experience, not a bare
   utility screen.

### 4.11 Frontend — plumbing (write before any page)

1. `src/main.jsx` — `BrowserRouter` + `AuthProvider` wrapping `<App/>`,
   imports the global stylesheet.
2. `src/api/api.js` — one `axios.create({baseURL})`, a request interceptor
   that attaches `Authorization: Bearer <token>` from `localStorage` if
   present. Every page imports this, never raw `axios`.
3. `src/context/AuthContext.jsx` — holds `user`/`token`/`loading`, calls
   `GET /auth/me` on mount if a token exists (and clears it on 401),
   exposes `login(email,password)` and `logout()`. `localStorage` key:
   `civivigi_token`.
4. `src/components/ProtectedRoute.jsx` — redirects to `/signin` if no user,
   to `/dashboard` if the user's role isn't in the route's allowed `roles`.

### 4.12 Frontend — shared components (before pages that use them)

`Navbar.jsx` (report button + conditional sign-in/dashboard/sign-out,
responsive hamburger), `Pagination.jsx` (renders nothing if
`totalPages<=1`), `SeverityBadge.jsx`, `StatusBadge.jsx`, `CaseCard.jsx`
(type icon map, status badge, optional `actions` slot for
official-only buttons).

### 4.13 Frontend — App.jsx + pages

Write `App.jsx` (route table) once the page filenames are decided, then
fill in each page. Order that matches dependency/complexity, cheapest
first:

`NotFound.jsx` → `Landing.jsx` (hero, case-type strip, feature grid, USSD
mock terminal, cross-links to every content section — this is the one page
where the "feel free to be creative" license is spent) → `ReportIncident.jsx`
(type select from the same 5-type list as the backend enum, textarea,
region/country/city, a `navigator.geolocation.getCurrentPosition` capture
button with idle/locating/done/denied states, optional reporter name/phone,
POST to `/cases`, success state showing a reference code) →
`SignIn.jsx` (single email/password form, no signup link — matches the
"provisioned, not self-registered" rule) → `Dashboard.jsx`
(status-filter chips, case grid with Verify/Mark-duplicate/Resolve buttons
gated by current status, admin-only link to user management) →
`AdminUsers.jsx` (add-user form + table with deactivate/reactivate/remove)
→ `UnsafeLocations.jsx` (city text filter, mark-safe button visible only to
signed-in officials/admins) → `GovProjects.jsx` (severity chip filter) →
`CommunityNeeds.jsx` (severity **and** status chip filters) →
`Headlines.jsx` (from/to date inputs) → `Opinions.jsx` (post form + feed
with upvote button).

Every list page follows the same shape: `useCallback` loader that reads
`page`+filters from state, calls the matching `/api/...` endpoint with
`params`, sets `data`+`pagination` from the paginated envelope, and renders
`<Pagination pagination={pagination} onPageChange={setPage}/>` at the
bottom. Copy this pattern rather than re-deriving it per page.

### 4.14 Frontend — styling

Write `src/styles/index.css` **after** all pages exist, so you know every
class name actually used (`.hero`, `.case-grid`, `.chip-filter`, `.badge-
severity-*`, `.badge-status-*`, etc.) — writing CSS before markup produces
either unused rules or markup contorted to fit a stylesheet guessed in
advance. Define CSS custom properties (`--primary`, `--danger`, `--accent`,
`--radius`, etc.) at `:root` first; every component-level rule should
reference tokens, not hard-coded colors, so the palette can be restyled in
one place if the demo needs different branding later. Include a `@media
(max-width: 860px)` block collapsing the nav into a hamburger and forms/
grids into single columns — a safety-reporting tool has to work on a phone.

---

## 5. Decisions to make the same way if the spec is ambiguous

- **WhatsApp calling mechanism**: Twilio's dedicated WhatsApp Calling API is
  limited-availability. Default to Twilio Voice + TwiML `<Say>` as the "ring,
  and read the message aloud on pickup" mechanism, and say so explicitly in
  both a code comment (`services/whatsappService.js`) and the README, rather
  than silently substituting SMS or skipping the call feature.
- **Reverse geocoding for "current city"**: don't wire up a paid geocoding
  API for a POC. Let the person type their city in `UnsafeLocations.jsx`;
  leave the "use my location" button present but honest about only
  confirming device location access, not resolving it to a city name.
- **Instagram's image requirement**: Graph API feed posts need an
  `image_url`. Default to a placeholder graphic
  (`https://placehold.co/1080x1080?text=CiviVigi+Alert`) when a case has no
  `imageUrl`, rather than skipping Instagram or blocking verification on it.
- **What happens with zero officials in a region**: never throw or block the
  report from being recorded — log a warning and continue. A missing
  official is a data-provisioning gap for the admin to fix, not a reason to
  fail a safety report.
- **File format for delivery**: a zip of the two project folders + README,
  with `node_modules` and any build output stripped before zipping. Not a
  live deployed URL, not individual file attachments.

---

## 6. Verification checklist (run before saying the backend is done)

```bash
# 1. Syntax-check every backend file
cd backend
for f in $(find . -name "*.js" -not -path "./node_modules/*"); do
  node --check "$f" || echo "FAILED: $f"
done

# 2. Require-check every module to catch load-time errors syntax-checking misses
node -e "
const mods = [/* every models/, controllers/, routes/, services/, utils/, middleware/ file, relative path, no .js */];
for (const m of mods) {
  try { require(m); console.log('OK  ', m); }
  catch (e) { console.log('FAIL', m, '->', e.message); }
}
"

npm install --no-audit --no-fund
```

If a real MongoDB (local `mongod`, Docker, or `mongodb-memory-server`) is
reachable in the build environment, also run `npm run seed` and hit
`GET /api/health`, `POST /api/cases`, `PATCH /api/cases/:id/verify` for a
true end-to-end smoke test. If not reachable, say so plainly rather than
claiming an untested live run — the require-check plus a clean `npm
install` is the honest fallback.

## 7. Verification checklist (frontend)

```bash
cd frontend
npm install --no-audit --no-fund
npm run build     # must complete with 0 errors before packaging
```

---

## 8. Packaging & delivery

```bash
cd civivigi
rm -rf frontend/dist frontend/node_modules backend/node_modules
find . -name ".DS_Store" -delete 2>/dev/null

cd ..
mkdir -p outputs
zip -r -q outputs/civivigi.zip civivigi -x "*/node_modules/*" -x "*/dist/*"
unzip -l outputs/civivigi.zip | tail -20   # sanity-check file count/size
```

Deliver the zip with `SendUserFile` (status: `proactive` if the person isn't
actively watching, `normal` if replying in-thread), captioned in one line —
don't paste the file tree into the chat, the zip listing already shows it.
Close with a short summary: what's in each half of the stack, one sentence
on the WhatsApp-calling substitution decision from §5, and an honest note
about what was/wasn't live-tested per §6.

---

## 9. What "done" looks like

- Backend: 9 models, matching controllers/routes, 4 services
  (`whatsappService`, `socialMediaService`, `notifyService`, `ussdService`),
  JWT auth with two roles, a USSD webhook, a seed script, `server.js` wiring
  it all together, `.env.example` covering every consumed env var.
- Frontend: landing page + 9 more pages (report, sign-in, dashboard, admin
  users, unsafe locations, gov projects, community needs, headlines,
  opinions) + not-found, shared nav/pagination/badge/card components, one
  global stylesheet using CSS custom properties, builds clean with `vite
  build`.
- Root `README.md` describing setup for both halves, the seeded demo
  credentials, a full endpoint table, and the USSD menu contract.
- A clean zip, delivered, with a summary message — not a wall of file paths
  — as the final chat reply.