const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please tell your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  role: {
    type: String,
    enum: { values: ["user", "admin"] },
    default: "user",
  },
  photo: { type: String, default: "default.jpg" },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    // minlength: 8,
    select: false,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordConfirm: {
    type: String,
    select: false,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password are not the same ",
    },
  },
  plan: {
    type: String,
    enum: { values: ["mobile", "basic", "standard", "premium"] },
  },
  passwordChangedAt: { type: Date },
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre("save", async function (next) {
  //this if will run only when password was Modifield
  if (!this.isModified("password")) return next();
  //Generates a password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //passwordConfirm was only for validation we dont store it in DB
  this.passwordConfirm = undefined;
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    console.log(this.passowrdChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
