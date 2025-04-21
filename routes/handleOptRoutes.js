const express = require("express");
const OTPModel = require("../models/LoginOtp"); // Import OTP model
const Admin = require("../models/AdminUser"); // Admin model
const Student = require("../models/Student"); // Student model
const Faculty = require("../models/Faculty"); // Faculty model
const { sendOTP } = require("../middleware/handleOtp");
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
require('dotenv').config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.post(
  "/sendotp",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("userType")
      .isIn(["Admin", "Student", "Faculty"])
      .withMessage("User type must be Admin, Student, or Faculty"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {      
      const { email, userType } = req.body; // Get email and user type

      // Determine the correct model based on userType
      let actualUserType = Array.isArray(userType) ? userType[0] : userType;

      let UserModel;
      if (actualUserType === "Admin") UserModel = Admin;
      else if (actualUserType === "Student") UserModel = Student;
      else if (actualUserType === "Faculty") UserModel = Faculty;
      else return res.status(400).json({ message: "Invalid user type" });

      // Find user by email
      const user = await UserModel.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      // Generate a 6-digit OTP
      const otp = crypto.randomInt(100000, 999999);

      // Set OTP expiration time (e.g., 5 minutes)
      const expirationTime = new Date(Date.now() + 5 * 60 * 1000);

      // Create short-lived token with OTP and email
      const authToken = jwt.sign({ email, otp }, JWT_SECRET, {
        expiresIn: "5m",
      });

      // Save OTP in the database
      await OTPModel.create({
        userId: user._id,
        userType,
        otp,
        expirationTime,
      });

      // Send OTP via email (You can integrate a mail service here)
      const title = `${userType} verifition`;
      sendOTP(email, title, otp);

      res.status(200).json({ message: "OTP sent successfully",authToken});
    } catch (error) {
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

//Opt verifition route
router.post(
  "/verifyotp",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("userType")
      .isIn(["Admin", "Student", "Faculty"])
      .withMessage("User type must be Admin, Student, or Faculty"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const token = req.header('auth-token')

    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array() });

    try {      
      const { email, userType, otp } = req.body;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) return res.status(400).json({ message: "Invalid token" });

      // Determine the correct model
      let actualUserType = Array.isArray(userType) ? userType[0] : userType;

      let UserModel;
      if (actualUserType === "Admin") UserModel = Admin;
      else if (actualUserType === "Student") UserModel = Student;
      else if (actualUserType === "Faculty") UserModel = Faculty;
      else return res.status(400).json({ message: "Invalid user type" });

      // Find user by email
      const user = await UserModel.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });      

      const otpNumber = Number(otp); // Convert OTP to a number

      const otpRecord = await OTPModel.findOne({
        userId: user._id,
        otp: otpNumber, // Ensure correct type
      });
      if (!otpRecord) return res.status(400).json({ message: "Invalid OTP" });

      // Check if OTP is expired
      if (otpRecord.expirationTime < new Date()) {
        await OTPModel.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({ message: "OTP has expired" });
      }

      // OTP matched - return a verified auth token to allow login or password change
      const authToken = jwt.sign({ email: decoded.email }, JWT_SECRET, {
        expiresIn: "30m",
      });

      // OTP is valid – perform login or next step
      res.status(200).json({ message: "OTP verified successfully", authToken});

      // (Optional) Delete OTP after successful verification
      await OTPModel.deleteOne({ _id: otpRecord._id });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

module.exports = router;
