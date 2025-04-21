const Faculty = require('../models/Faculty');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Set Password (First Time Login)
exports.setPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const faculty = await Faculty.findOne({ email });
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    
    // Check if password is already set
    if (faculty.password) return res.status(400).json({ message: 'Password is already set. Please login.' });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    faculty.password = hashedPassword;
    await faculty.save();

    res.status(200).json({ message: 'Password set successfully. Please login.' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Faculty Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const faculty = await Faculty.findOne({ email });
    if (!faculty) return res.status(404).json({ message: 'Invalid email or password' });

    // Compare password
    const isMatch = await bcrypt.compare(password, faculty.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    //JWT token generation
    const payload = {
      id: faculty._id,
      role: 'faculty'  
    };

    const authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ message: 'Login successful', authToken , faculty:{id: faculty._id}});
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
