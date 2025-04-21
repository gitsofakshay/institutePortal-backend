const mongoose = require('mongoose');
const { Schema } = mongoose;

const facultySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
  },
  department: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  courses: [{ type: String, required: true }], // List of courses taught by faculty
  address: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Faculty'], // Keeping it consistent for role-based authentication
    default: 'Faculty'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Faculty = mongoose.model('Faculty', facultySchema);
module.exports = Faculty;
