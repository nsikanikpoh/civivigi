const mongoose = require("mongoose");

// Free-form community opinions / ideas on development & innovation. Anybody
// can post (no auth) — a light, feed-style section.
const opinionSchema = new mongoose.Schema(
  {
    authorName: { type: String, trim: true, default: "Anonymous" },
    title: { type: String, trim: true, maxlength: 150 },
    body: { type: String, required: true, trim: true, maxlength: 3000 },
    region: { type: String, trim: true },
    country: { type: String, trim: true },
    upvotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

opinionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Opinion", opinionSchema);
