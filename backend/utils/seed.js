// Demo seed script — populates enough data to make every frontend section
// non-empty for a live demo. Run with `npm run seed` (from backend/).
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const State = require("../models/State");
const Province = require("../models/Province");
const User = require("../models/User");
const Case = require("../models/Case");
const UnsafeLocation = require("../models/UnsafeLocation");
const WhatsAppSubscription = require("../models/WhatsAppSubscription");
const GovProject = require("../models/GovProject");
const CommunityNeed = require("../models/CommunityNeed");
const Headline = require("../models/Headline");
const Opinion = require("../models/Opinion");

// 1. Force dotenv to use an absolute path to the root folder
const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (result.error) {
  console.log("Dotenv Error:", result.error);
}

// GovProject/CommunityNeed/Headline/Opinion still use free-text region/country
// (out of scope for the state/province migration — see README).
const REGION = "Lagos";
const COUNTRY = "Nigeria";

async function seed() {
  await connectDB();

  console.log("[seed] Clearing existing demo collections...");
  await Promise.all([
    State.deleteMany({}),
    Province.deleteMany({}),
    User.deleteMany({}),
    Case.deleteMany({}),
    UnsafeLocation.deleteMany({}),
    WhatsAppSubscription.deleteMany({}),
    GovProject.deleteMany({}),
    CommunityNeed.deleteMany({}),
    Headline.deleteMany({}),
    Opinion.deleteMany({}),
  ]);

  console.log("[seed] Creating states + provinces...");
  const lagosState = await State.create({ name: "Lagos", country: COUNTRY });
  const ogunState = await State.create({ name: "Ogun", country: COUNTRY });

  const ikeja = await Province.create({ name: "Ikeja", state: lagosState._id });
  const ikorodu = await Province.create({ name: "Ikorodu", state: lagosState._id });
  const abeokuta = await Province.create({ name: "Abeokuta", state: ogunState._id });

  console.log("[seed] Creating admin + security officials...");
  const admin = await User.create({
    name: process.env.SEED_ADMIN_NAME || "Super Admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@civivigi.org",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
    role: "admin",
  });

  const official = await User.create({
    name: "Officer Adaeze Bello",
    email: "official@civivigi.org",
    password: "Official@12345",
    role: "security_official",
    phone: "+2348000000000",
    provinces: [ikeja._id, ikorodu._id],
  });

  const secondOfficial = await User.create({
    name: "Officer Tunde Fashola",
    email: "official2@civivigi.org",
    password: "Official@12345",
    role: "security_official",
    phone: "+2348000000001",
    provinces: [abeokuta._id],
  });

  console.log("[seed] Creating WhatsApp subscriptions...");
  await WhatsAppSubscription.create([
    {
      groupName: "Ikeja Neighborhood Watch",
      groupWhatsAppId: "+2348011111111",
      state: lagosState._id,
      province: ikeja._id,
    },
    {
      groupName: "Lagos State-wide Alerts",
      groupWhatsAppId: "+2348011111112",
      state: lagosState._id, // no province -> covers every province in Lagos
    },
  ]);

  console.log("[seed] Creating cases + unsafe locations...");
  const caseSeeds = [
    { type: "Robbery", description: "Armed robbery reported near Allen Avenue market.", status: "verified", province: ikeja },
    { type: "Threat", description: "Anonymous threat made against a local trader.", status: "pending", province: ikeja },
    { type: "Violence", description: "Physical altercation reported outside a bar on Opebi Road.", status: "verified", province: ikeja },
    { type: "Abuse", description: "Suspected domestic abuse reported by a neighbor.", status: "pending", province: ikorodu },
    { type: "Kidnapping", description: "Attempted abduction reported near a school gate.", status: "duplicate", province: ikorodu },
    { type: "Robbery", description: "Reported break-in at a shop along Lalubu street.", status: "verified", province: abeokuta },
  ];

  for (const [i, c] of caseSeeds.entries()) {
    const { province, ...rest } = c;
    const caseDoc = await Case.create({
      ...rest,
      province: province._id,
      state: province.state,
      location: { type: "Point", coordinates: [3.3515 + i * 0.01, 6.6018 + i * 0.01] },
      reporter: { name: "Anonymous", channel: i % 2 === 0 ? "web" : "ussd" },
      verifiedBy: c.status === "verified" ? official._id : undefined,
      verifiedAt: c.status === "verified" ? new Date() : undefined,
      dispatched: c.status === "verified",
    });

    if (c.status !== "duplicate") {
      await UnsafeLocation.create({
        case: caseDoc._id,
        province: province._id,
        state: province.state,
        location: caseDoc.location,
        reasonType: caseDoc.type,
        isSafeNow: false,
      });
    }
  }

  console.log("[seed] Creating gov projects...");
  await GovProject.create([
    {
      title: "Ikeja Streetlight Restoration",
      description: "Restoring 500 streetlights across Ikeja to reduce night-time crime.",
      severity: "high",
      region: REGION,
      country: COUNTRY,
      budget: 250000000,
      createdBy: admin._id,
    },
    {
      title: "Community CCTV Rollout",
      description: "Installing CCTV at major junctions in partnership with local vigilante groups.",
      severity: "medium",
      region: REGION,
      country: COUNTRY,
      budget: 90000000,
      createdBy: admin._id,
    },
    {
      title: "Neighborhood Watch Training",
      description: "Training volunteer watch groups on safe reporting procedures.",
      severity: "low",
      region: REGION,
      country: COUNTRY,
      budget: 5000000,
      createdBy: admin._id,
    },
  ]);

  console.log("[seed] Creating community needs...");
  await CommunityNeed.create([
    {
      title: "More police patrol vehicles",
      description: "Residents are requesting additional patrol vehicles for night shifts.",
      severity: "high",
      status: "open",
      region: REGION,
      country: COUNTRY,
      createdBy: admin._id,
    },
    {
      title: "Better street lighting on Toyin Street",
      description: "Multiple reports of poor visibility at night.",
      severity: "medium",
      status: "closed",
      region: REGION,
      country: COUNTRY,
      createdBy: admin._id,
    },
    {
      title: "Repaired emergency call boxes",
      description: "Old call boxes near the market are non-functional.",
      severity: "low",
      status: "solved",
      region: REGION,
      country: COUNTRY,
      createdBy: admin._id,
    },
  ]);

  console.log("[seed] Creating headlines...");
  await Headline.create([
    {
      title: "Governor commissions new rapid-response security unit",
      summary: "New unit aims to cut emergency response time in half.",
      speaker: "State Governor",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      region: REGION,
      country: COUNTRY,
      createdBy: admin._id,
    },
    {
      title: "State budget allocates funds for community safety programs",
      summary: "A significant share of the new budget targets local safety initiatives.",
      speaker: "Commissioner for Finance",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      region: REGION,
      country: COUNTRY,
      createdBy: admin._id,
    },
  ]);

  console.log("[seed] Creating opinions...");
  await Opinion.create([
    {
      authorName: "Chinedu O.",
      title: "We need better street lighting",
      body: "I think investing in solar streetlights would help reduce night-time crime significantly.",
      region: REGION,
      country: COUNTRY,
      upvotes: 12,
    },
    {
      authorName: "Anonymous",
      title: "Community app is a great idea",
      body: "This platform could really help us stay informed. Would love to see SMS alerts too.",
      region: REGION,
      country: COUNTRY,
      upvotes: 4,
    },
  ]);

  console.log("\n[seed] Done! Demo login credentials:");
  console.log(`  Admin:             ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD || "Admin@12345"}`);
  console.log(`  Security Official: ${official.email} / Official@12345 (Ikeja + Ikorodu, Lagos)`);
  console.log(`  Security Official: ${secondOfficial.email} / Official@12345 (Abeokuta, Ogun)`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
