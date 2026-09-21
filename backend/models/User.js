const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { USER_ROLES } = require("../utils/constants");

// Admins and Security Officials only — the general public never gets an
// account here; they report anonymously (see Case.reporter).
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: USER_ROLES, required: true },
    phone: { type: String, trim: true }, // WhatsApp-reachable number, E.164
    // The provinces a Security Official is responsible for — they receive
    // incident alerts for these, and can only manage (verify/mark duplicate/
    // resolve) cases reported in one of them. Empty/unused for Admins.
    provinces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Province" }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // which admin added them
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
