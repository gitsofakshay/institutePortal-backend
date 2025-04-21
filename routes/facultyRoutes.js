const express = require("express");
const router = express.Router();
const { setPassword, login } = require("./facultyAuthController");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");
const { isVerified } = require("../middleware/isVarified");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Route 1: Fetch all faculty records using: GET "/api/faculty/fetchfaculty". Login required.
router.get("/fetchfaculty", authMiddleware, async (req, res) => {
  try {
    // Check if the user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
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
  "/addfaculty",
  authMiddleware,
  [
    body("name")
      .isLength({ min: 3 })
      .withMessage("Name must be at least 3 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone")
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be 10 digits"),
    body("department")
      .isLength({ min: 2 })
      .withMessage("Department must be at least 2 characters"),
    body("address")
      .isLength({ min: 5 })
      .withMessage("Address must be at least 5 characters"),
    body("courses")
      .isArray({ min: 1 })
      .withMessage("Courses must be a non-empty array"),
    body("courses.*")
      .isString()
      .withMessage("Each course must be a string")
      .isLength({ min: 2 })
      .withMessage("Each course must be at least 2 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
      }

      const { name, email, phone, department, address, courses } = req.body;
      const faculty = new Faculty({
        name,
        email,
        phone,
        department,
        address,
        courses,
      });
      const savedFaculty = await faculty.save();

      res.status(200).json({ msg: "Faculty has been added", savedFaculty });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Route 3: Update an existing faculty record using: PUT "/api/faculty/updatefaculty/:id". Login required.
router.put(
  "/updatefaculty/:id",
  authMiddleware,
  [
    body("name")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Name must be at least 3 characters"),
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("phone")
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be 10 digits"),
    body("department")
      .optional()
      .isLength({ min: 2 })
      .withMessage("Department must be at least 2 characters"),
    body("address")
      .optional()
      .isLength({ min: 5 })
      .withMessage("Address must be at least 5 characters"),
    body("courses")
      .optional()
      .isArray({ min: 1 })
      .withMessage("Courses must be a non-empty array"),
    body("courses.*")
      .optional()
      .isString()
      .withMessage("Each course must be a string")
      .isLength({ min: 2 })
      .withMessage("Each course must be at least 2 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { id: facultyId } = req.params;

    try {
      // Check if the user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
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
      if (!faculty) return res.status(404).json({ error: "Faculty not found" });

      const updatedRecord = await Faculty.findByIdAndUpdate(
        facultyId,
        { $set: updatedFaculty },
        { new: true }
      );

      res
        .status(200)
        .json({ msg: "Faculty record has been updated", updatedRecord });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Route 4: Delete a faculty record using: DELETE "/api/faculty/deletefaculty/:id". Login required.
router.delete("/deletefaculty/:id", authMiddleware, async (req, res) => {
  try {
    // Only admin is allowed to delete faculty
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const { id } = req.params;
    const faculty = await Faculty.findById(id);

    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }

    await Faculty.findByIdAndDelete(id);
    res.status(200).json({ msg: "Faculty record has been deleted" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Below routes will be hit by the faculty dashbord or after login

// Set Password (First Time Login)
router.post("/set-password", isVerified, setPassword);

// Faculty Login
router.post("/login", isVerified, login);

// Reset Password (Faculty) - requires email and OTP verification
router.put(
  "/reset-password",
  isVerified,
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { email, newPassword } = req.body;

      const faculty = await Faculty.findOne({ email });
      if (!faculty)
        return res.status(404).json({ message: "Faculty not found" });

      const salt = await bcrypt.genSalt(10);
      faculty.password = await bcrypt.hash(newPassword, salt);

      await faculty.save();

      res.json({ message: "Password reset successful. You can now log in." });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  }
);

// routes for faculty after no login required
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    //Check if the user is faculty
    if (req.user.role !== "faculty") {
      return res.status(403).json({ message: "Access denied: faculties only" });
    }

    const faculty = await Faculty.findById(req.user.id).select("-password");
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });

    res.status(200).json(faculty);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.get(
  "/courses/:courseName/students",
  authMiddleware,
  async (req, res) => {
    try {
      //Check if the user is faculty
      if (req.user.role !== "faculty") {
        return res
          .status(403)
          .json({ message: "Access denied: faculties only" });
      }

      const students = await Student.find({ course: req.params.courseName });
      res.status(200).json(students);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  }
);

router.post(
  "/courses/:courseName/attendance",
  authMiddleware,
  [
    body("presentStudents")
      .optional()
      .isArray()
      .withMessage("presentStudents must be an array"),
    body("presentStudents.*")
      .optional()
      .isMongoId()
      .withMessage("Each presentStudent must be a valid Mongo ID"),

    body("absentStudents")
      .optional()
      .isArray()
      .withMessage("absentStudents must be an array"),
    body("absentStudents.*")
      .optional()
      .isMongoId()
      .withMessage("Each absentStudent must be a valid Mongo ID"),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if the user is faculty
      if (req.user.role !== "faculty") {
        return res
          .status(403)
          .json({ message: "Access denied: faculties only" });
      }

      const { presentStudents, absentStudents } = req.body;
      const { courseName } = req.params;

      if (presentStudents?.length > 0) {
        await Student.updateMany(
          { _id: { $in: presentStudents }, course: courseName },
          { $inc: { "attendance.present": 1 } }
        );
      }

      if (absentStudents?.length > 0) {
        await Student.updateMany(
          { _id: { $in: absentStudents }, course: courseName },
          { $inc: { "attendance.absent": 1 } }
        );
      }

      res.status(200).json({ message: "Attendance updated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  }
);

module.exports = router;
