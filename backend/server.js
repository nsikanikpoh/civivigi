'use strict';
const path = require('path');
const dotenv = require('dotenv');

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const caseRoutes = require("./routes/caseRoutes");
const locationRoutes = require("./routes/locationRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const govProjectRoutes = require("./routes/govProjectRoutes");
const communityNeedRoutes = require("./routes/communityNeedRoutes");
const headlineRoutes = require("./routes/headlineRoutes");
const opinionRoutes = require("./routes/opinionRoutes");
const ussdRoutes = require("./routes/ussdRoutes");

// 1. Force dotenv to use an absolute path to the root folder
const result = dotenv.config({ path: path.resolve(__dirname, '.env') });

if (result.error) {
  console.log("Dotenv Error:", result.error);
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.json({ success: true, service: "civivigi-backend", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/gov-projects", govProjectRoutes);
app.use("/api/community-needs", communityNeedRoutes);
app.use("/api/headlines", headlineRoutes);
app.use("/api/opinions", opinionRoutes);
app.use("/api/ussd", ussdRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] CiviVigi backend listening on port ${PORT}`);
  });
});

module.exports = app;
