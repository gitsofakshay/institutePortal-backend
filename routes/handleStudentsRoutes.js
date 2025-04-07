const express = require('express');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For authentication
const authMiddleware = require('../middleware/authMiddleware'); // Auth middleware
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification'); // Import Notification model
require('dotenv').config();

const router = express.Router();

// Route for students to set their password (if record exists)
router.post(
  '/set-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
  
      // Find student by email
      const student = await Student.findOne({ email });
      if (!student) return res.status(404).json({ message: 'Student record not found' });
  
      // Check if password is already set
      if (student.password) return res.status(400).json({ message: 'Password is already set. Please login.' });
  
      // Hash and save the password
      const salt = await bcrypt.genSalt(10);
      student.password = await bcrypt.hash(password, salt);
      await student.save();
  
      res.json({ message: 'Password set successfully. You can now log in.' });
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// Student login route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
      
      // Check if student exists
      const student = await Student.findOne({ email });
      if (!student) return res.status(400).json({ message: 'Invalid email or password' });
  
      // Ensure the password is set
      if (!student.password) return res.status(400).json({ message: 'Password not set. Please set your password first.' });
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, student.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });
  
      const payload = {
        id: student._id,
        role: 'student' 
      };
      
      // Generate JWT token
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  
      res.json({ token, student: { id: student._id, name: student.name, email: student.email } });
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

  
// Reset Password
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),   
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, newPassword } = req.body;
  
      const student = await Student.findOne({ email });
      if (!student) return res.status(404).json({ message: 'Student not found' });
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      student.password = await bcrypt.hash(newPassword, salt);
  
      await student.save();
  
      res.json({ message: 'Password reset successful. You can now log in.' });
  
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// Get student profile (protected route)
router.get('/profile', authMiddleware, async (req, res) => {
  try { 
    //Check if the user is student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied: students only' });
    }
    const student = await Student.findById(req.user.id).select('-password');
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get attendance counts (Protected Route)
router.get('/attendance', authMiddleware, async (req, res) => {
  try {
    //Check if the user is student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied: students only' });
    }
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const { present, absent } = student.attendance;

    res.json({
      presentCount: present,
      absentCount: absent
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Route for Notification: POST "/api/send-message/fetchnotification" - Access code required
router.post(
  '/fetchnotification',
  [
    body('access_code', 'Access code must be exactly 8 characters').isLength({ max: 8 }),
  ],
  async (req, res) => {
    let success = false;
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
      }

      // Validate access code
      const access_code = req.body.access_code;
      const original_code = process.env.ACCESS_CODE;      
      if (access_code === original_code) {
        // Fetch all notifications
        const notifications = await Notification.find();
        success = true;
        res.status(200).json({ success, notifications });
      } else {
        res.status(401).json({ success, msg: 'Invalid access code' });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success, error: 'Internal Server Error' });
    }
  }
);

module.exports = router;