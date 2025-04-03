import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: [true, "Email already exists"],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          if (!validator.isEmail(value)) return false; // Validate email format

          const domain = value.split("@")[1]; // Extract domain part
          return allowedDomains.includes(domain); // Check if it's in the allowed list
        },
        message: "Please enter a valid email with an allowed domain",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // maxlength: [12, "Password must be less than 12 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: function (value) {
          return validator.isMobilePhone(value, "en-IN"); // Validate as an Indian phone number
        },
        message: "Please enter a valid phone number",
      },
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

/*--------------------------------*/ 

// 🔹 **Pre-save hook** to hash password before storing in the database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip if password is unchanged

  this.password = await bcrypt.hash(this.password, 10); // Hash password
  next();
});

// 🔹 **Method to verify password**
userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 🔹 **Generate Access Token**
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// 🔹 **Generate Refresh Token**
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

/*--------------------------------*/ 

export const User = mongoose.model("User", userSchema);
