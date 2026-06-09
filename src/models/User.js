const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: false, // Not required for Google OAuth users
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values for non-Google users
  },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
  },
  phone: String,
  address: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving (only if password is provided)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
