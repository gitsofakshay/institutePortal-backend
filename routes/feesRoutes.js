const express = require('express');
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Student = require('../models/Student');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const router = express.Router();
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// INITIATE PAYMENT
router.post(
  "/initiate-payment",
  [
    authMiddleware,
    body("amount")
      .isFloat({ gt: 0 })
      .withMessage("Amount must be a positive number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      // Check if the user is a student
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied: students only" });
      }
      const { amount } = req.body;
      const student = await Student.findById(req.user.id);
      if (!student) return res.status(404).json({ message: "Student not found" });

      const options = {
        amount: amount * 100, // in paise
        currency: "INR",
        receipt: `rcpt_${student._id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
      };

      const order = await razorpay.orders.create(options);
      res.json({
        orderId: order.id,
        key: process.env.RAZORPAY_KEY_ID,
        amount,
      });
    } catch (err) {
      console.error("Error initiating payment:", err);
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  }
);

// VERIFY PAYMENT
router.post(
  "/verify-payment",
  [
    authMiddleware,
    body("orderId").notEmpty().withMessage("orderId is required"),
    body("paymentId").notEmpty().withMessage("paymentId is required"),
    body("signature").notEmpty().withMessage("signature is required"),
    body("amount")
      .isFloat({ gt: 0 })
      .withMessage("Amount must be a positive number"),
    body("method").optional().isString().withMessage("method must be a string"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array() });

    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied: students only" });
      }

      const { orderId, paymentId, signature, amount, method } = req.body;

      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(orderId + "|" + paymentId)
        .digest("hex");

      if (generatedSignature !== signature) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid signature" });
      }

      const student = await Student.findById(req.user.id);
      if (!student) return res.status(404).json({ message: "Student not found" });

      if (student.fees.due < amount) {
        return res.status(400).json({ message: "Amount exceeds due balance" });
      }

      student.fees.paid += amount;
      student.fees.due -= amount;
      student.fees.lastPaymentDate = new Date();
      student.fees.paymentHistory.push({
        amount,
        date: new Date(),
        method: method || "Razorpay",
      });

      await student.save();

      res.json({
        success: true,
        message: "Payment verified and updated",
        fees: student.fees,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
);

module.exports = router;