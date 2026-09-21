const mongoose = require("mongoose");

// The unit everything else is actually scoped to: a Security Official is
// assigned to one or more provinces, a Case is reported into exactly one,
// and a WhatsApp subscription can target one province (or a whole state).
// Added only by an Admin.
const provinceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// A province name only needs to be unique within its own state.
provinceSchema.index({ state: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Province", provinceSchema);
