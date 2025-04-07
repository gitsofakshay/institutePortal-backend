const express = require('express');
const router = express.Router();
const { setPassword, login } = require('./facultyAuthController');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const authMiddleware = require('../middleware/authMiddleware')
const {body, validationResult} = require('express-validator')
require('dotenv').config();

// Route 1: Fetch all faculty records using: GET "/api/faculty/fetchfaculty". Login required.
router.get('/fetchfaculty', authMiddleware, async (req, res) => {
  try {
    // Check if the user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    const faculty = await Faculty.find();
    res.status(200).json(faculty);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route 2: Add a new faculty using: POST "/api/faculty/addfaculty". Login required.
router.post(
  '/addfaculty',
  authMiddleware,
  [
    body('name', 'Name must be at least 3 characters').isLength({ min: 3 }),
    body('email', 'Valid email is required').isEmail(),
    body('phone', 'Phone number must be 10 digits').isLength({ min: 10, max: 10 }),
    body('department', 'Department must be at least 2 characters').isLength({ min: 2 }),
    body('courses', 'Course must be at least 2 characters').isLength({ min: 2 }),
    body('address', 'Address must be at least 5 characters').isLength({ min: 5 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      // Check if the user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
      }
      const { name, email, phone, department, address,courses } = req.body;
      const faculty = new Faculty({ name, email, phone, department, address, courses});
      const savedFaculty = await faculty.save();
      res.status(200).json({ msg: 'Faculty has been added', savedFaculty });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// Route 3: Update an existing faculty record using: PUT "/api/faculty/updatefaculty/:id". Login required.
router.put(
  '/updatefaculty/:id',
  authMiddleware,
  [
    body('name', 'Name must be at least 3 characters').optional().isLength({ min: 3 }),
    body('email', 'Valid email is required').optional().isEmail(),
    body('phone', 'Phone number must be 10 digits').optional().isLength({ min: 10, max: 10 }),
    body('department', 'Department must be at least 2 characters').optional().isLength({ min: 2 }),
    body('courses', 'Course must be at least 2 characters').optional().isLength({ min: 2 }),
    body('address', 'Address must be at least 5 characters').optional().isLength({ min: 5 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id: facultyId } = req.params;
    try {
      // Check if the user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
      }
      const { name, email, phone, department, address, courses } = req.body;

      const updatedFaculty = {};
      if (name) updatedFaculty.name = name;
      if (email) updatedFaculty.email = email;
      if (phone) updatedFaculty.phone = phone;
      if (department) updatedFaculty.department = department;
      if (courses) updatedFaculty.courses = courses;
      if (address) updatedFaculty.address = address;

      const faculty = await Faculty.findById(facultyId);
      if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

      const updatedRecord = await Faculty.findByIdAndUpdate(facultyId, { $set: updatedFaculty }, { new: true });
      res.status(200).json({ msg: 'Faculty record has been updated', updatedRecord });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

// Route 4: Delete an existing faculty record using: DELETE "/api/faculty/deletefaculty/:id". Login required.
router.delete('/deletefaculty/:id', authMiddleware, async (req, res) => {
  const { id: facultyId } = req.params;
  try {
    // Check if the user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

    await Faculty.findByIdAndDelete(facultyId);
    res.status(200).json({ msg: 'Faculty record has been deleted', faculty });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Below routes will be hit by the faculty dashbord or after login

// Set Password (First Time Login)
router.post('/set-password', setPassword);

// Faculty Login
router.post('/login', login);


router.get('/:id/profile', authMiddleware, async (req, res) => {
  try {
    //Check if the user is faculty
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Access denied: faculties only' });
    }

    const faculty = await Faculty.findById(req.params.id).select('-password');
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

    res.status(200).json(faculty);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

  router.get('/:id/courses', authMiddleware, async (req, res) => {
    try {
      //Check if the user is faculty
      if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: 'Access denied: faculties only' });
      }

      const faculty = await Faculty.findById(req.params.id);
      if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
  
      res.status(200).json({ courses: faculty.courses });
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });

router.get('/:id/courses/:courseName/students', authMiddleware, async (req, res) => {
  try {
    //Check if the user is faculty
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Access denied: faculties only' });
    }

    const students = await Student.find({ course: req.params.courseName });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.post('/:id/courses/:courseName/attendance', authMiddleware, async (req, res) => {
  try {
    //Check if the user is faculty
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Access denied: faculties only' });
    }
    
    const { presentStudents, absentStudents } = req.body;
    const { courseName } = req.params;

    // Increment 'present' for present students
    if (presentStudents?.length > 0) {
      await Student.updateMany(
        { _id: { $in: presentStudents }, course: courseName },
        { $inc: { 'attendance.present': 1 } }
      );
    }

    // Increment 'absent' for absent students
    if (absentStudents?.length > 0) {
      await Student.updateMany(
        { _id: { $in: absentStudents }, course: courseName },
        { $inc: { 'attendance.absent': 1 } }
      );
    }

    res.status(200).json({ message: 'Attendance updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});
  

module.exports = router;
