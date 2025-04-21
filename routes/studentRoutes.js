const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

//Route 1: fetch all students record using : GET "/api/studetns/fetchstudents" . Login required.
router.get("/fetchstudents", authMiddleware, async (req, res) => {
  try {
    // Check if the user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    //fetching all student data
    const stu = await Student.find();
    res.status(200).json(stu);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

//Route 2: Add a new student using : POST "/api/studetns/addstudent" . Login required.
router.post(
  "/addstudent",
  authMiddleware,
  [
    body("name", "Name must be atleast 3 characters").isLength({ min: 3 }),
    body("dob", "Please enter correct date").isLength({ min: 10, max: 10 }),
    body("email", "Please enter correct date").isEmail(),
    body("phone", "Number must be 10 digit").isLength({ min: 10, max: 10 }),
    body("course", "Course must be atleast 2 characters").isLength({ min: 2 }),
    body("gender", "Please provide correct gender").isLength({ min: 4 }),
    body("address", "Address must be atleast 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    try {
      //  Check if the user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
      }
      //If there are error return bad request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, dob, email, phone, course, gender, address, enrolled } =
        req.body;
      //Adding a student in record
      const stu = new Student({
        name,
        dob,
        email,
        phone,
        course,
        gender,
        address,
        enrolled,
      });
      const savedStudent = await stu.save();
      res
        .status(200)
        .json({ msg: "Student has been added", savedStudent: savedStudent });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Internal Server error" });
    }
  }
);

//Route : Add a new studetn for enquiry using : POST "/api/studetns/enrollstudent" . Login not required.
router.post(
  "/enrollstudent",
  [
    body("name", "Name must be atleast 3 characters").isLength({ min: 3 }),
    body("dob", "Please enter correct date").isLength({ min: 10, max: 10 }),
    body("email", "Please enter correct date").isEmail(),
    body("phone", "Number must be 10 digit").isLength({ min: 10, max: 10 }),
    body("course", "Course must be atleast 2 characters").isLength({ min: 2 }),
    body("gender", "Please provide correct gender").isLength({ min: 4 }),
    body("address", "Address must be atleast 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    try {
      //If there are error return bad request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, dob, email, phone, course, gender, address, enrolled } =
        req.body;
      //Adding a student in record
      const stu = new Student({
        name,
        dob,
        email,
        phone,
        course,
        gender,
        address,
        enrolled,
      });
      const savedStudent = await stu.save();
      res
        .status(200)
        .json({
          msg: "Student has been registered for enquiry",
          savedStudent: savedStudent,
        });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Internal Server error" });
    }
  }
);

router.put(
  "/updatestudent/:id",
  authMiddleware,
  [
    body("name")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Name must be at least 3 characters"),
    body("dob")
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage("Please enter correct date"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please enter a valid email"),
    body("phone")
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage("Number must be 10 digits"),
    body("course")
      .optional()
      .isLength({ min: 2 })
      .withMessage("Course must be at least 2 characters"),
    body("gender")
      .optional()
      .isLength({ min: 4 })
      .withMessage("Please provide correct gender"),
    body("address")
      .optional()
      .isLength({ min: 5 })
      .withMessage("Address must be at least 5 characters"),
    body("fees.total")
      .optional()
      .isNumeric()
      .withMessage("Total fee must be a number"),
  ],
  async (req, res) => {
    let success = false;
    const { id: studentId } = req.params;

    try {
      // Check if the user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
      }
      const {
        name,
        dob,
        email,
        phone,
        course,
        gender,
        address,
        enrolled,
        fees,
      } = req.body;

      const newStudent = {};
      if (name) newStudent.name = name;
      if (dob) newStudent.dob = dob;
      if (email) newStudent.email = email;
      if (phone) newStudent.phone = phone;
      if (course) newStudent.course = course;
      if (gender) newStudent.gender = gender;
      if (address) newStudent.address = address;
      if (enrolled !== undefined) newStudent.enrolled = enrolled;

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ success, error: "Student Not Found" });
      }

      // Only update fees.total, and recalculate due
      if (fees && fees.total !== undefined) {
        if (!newStudent.fees) newStudent.fees = {};

        const incomingTotal = Number(fees.total); // new amount to add to total
        const updatedTotal = student.fees.total + incomingTotal;

        const paid = student.fees.paid || 0;

        newStudent.fees.total = updatedTotal;
        newStudent.fees.paid = paid;
        newStudent.fees.due = updatedTotal - paid;
      }
      const updatedStudent = await Student.findByIdAndUpdate(
        student._id,
        { $set: newStudent },
        { new: true }
      );

      success = true;
      res
        .status(200)
        .json({
          success,
          msg: "Student data has been updated",
          stu: updatedStudent,
        });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success, error: "Internal Server Error" });
    }
  }
);

//Route 4: Delete an existing student record using : DELETE "/api/students/delete:id/" . Login required.
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  //Deleting a specific student record
  let success = false;
  const { id: studentId } = req.params;
  try {
    // Check if the user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    //Find the note to be deleted and delete it
    let stu = await Student.findById(studentId);
    if (!stu) {
      return res.status(404).json({ success, error: "Student Not found" });
    }

    stu = await Student.findByIdAndDelete(studentId);
    success = true;
    res
      .status(200)
      .json({ success, msg: "Student data has been deleted", stu: stu });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success, error: "Internal Server error" });
  }
});

// Make a manual fee payment (Admin Only)
router.post(
  "/manual-payment",
  [
    body("studentId").notEmpty().withMessage("Student ID is required"),
    body("amount")
      .isFloat({ gt: 0 })
      .withMessage("Amount must be greater than 0"),
    body("method").notEmpty().withMessage("Payment method is required"),
  ],
  authMiddleware,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      // Check if the user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
      }

      const { studentId, amount, method } = req.body;

      const student = await Student.findById(studentId);
      if (!student)
        return res.status(404).json({ message: "Student not found" });

      if (student.fees.due < amount) {
        return res.status(400).json({ message: "Amount exceeds due balance" });
      }

      student.fees.paid += amount;
      student.fees.due -= amount;
      student.fees.lastPaymentDate = new Date();
      student.fees.paymentHistory.push({ amount, date: new Date(), method });

      await student.save();

      res.json({
        message: "Manual payment recorded successfully",
        fees: student.fees,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Server Error" });
    }
  }
);

module.exports = router;
