const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Student = require('../models/Student');
const fetchuser = require('../middleware/fetchUser');
const { body, validationResult } = require('express-validator');

//Route 1: fetch all students record using : GET "/api/studetns/fetchstudents" . Login required.
router.get('/fetchstudents', fetchuser, async (req, res) => {
    try {
        //fetching all student data
        const stu = await Student.find();
        res.status(200).json(stu);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }
});

//Route 2: Add a new student using : POST "/api/studetns/addstudent" . Login required.
router.post('/addstudent', fetchuser, [
    body('name', 'Name must be atleast 3 characters').isLength({ min: 3 }),
    body('dob', 'Please enter correct date').isLength({ min: 10, max: 10 }),
    body('email', 'Please enter correct date').isEmail(),
    body('phone', 'Number must be 10 digit').isLength({ min: 10, max: 10 }),
    body('course', 'Course must be atleast 2 characters').isLength({ min: 2 }),
    body('gender', 'Please provide correct gender').isLength({ min: 4 }),
    body('address', 'Address must be atleast 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    try {
        //If there are error return bad request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, dob, email, phone, course, gender, address, enrolled } = req.body;
        //Adding a student in record
        const stu = new Student({ name, dob, email, phone, course, gender, address, enrolled });
        const savedStudent = await stu.save();
        res.status(200).json({ msg: 'Student has been added', savedStudent: savedStudent });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server error' });
    }
});

//Route : Add a new studetn for enquiry using : POST "/api/studetns/enrollstudent" . Login not required.
router.post('/enrollstudent', [
    body('name', 'Name must be atleast 3 characters').isLength({ min: 3 }),
    body('dob', 'Please enter correct date').isLength({ min: 10, max: 10 }),
    body('email', 'Please enter correct date').isEmail(),
    body('phone', 'Number must be 10 digit').isLength({ min: 10, max: 10 }),
    body('course', 'Course must be atleast 2 characters').isLength({ min: 2 }),
    body('gender', 'Please provide correct gender').isLength({ min: 4 }),
    body('address', 'Address must be atleast 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    try {
        //If there are error return bad request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, dob, email, phone, course, gender, address, enrolled } = req.body;
        //Adding a student in record
        const stu = new Student({ name, dob, email, phone, course, gender, address, enrolled });
        const savedStudent = await stu.save();
        res.status(200).json({ msg: 'Student has been registered for enquiry', savedStudent: savedStudent });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server error' });
    }
});

//Route 3: updating an existing studetn record using : PUT "/api/students/updatestudent/id" . Login required.
router.put('/updatestudent/:id', fetchuser, [
    body('name', 'Name must be atleast 3 characters').isLength({ min: 3 }),
    body('dob', 'Please enter correct date').isLength({ min: 10, max: 10 }),
    body('email', 'Please enter correct date').isEmail(),
    body('phone', 'Number must be 10 digit').isLength({ min: 10, max: 10 }),
    body('course', 'Course must be atleast 2 characters').isLength({ min: 2 }),
    body('gender', 'Please provide correct gender').isLength({ min: 4 }),
    body('address', 'Address must be atleast 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    let success = false;
    const { id: studentId } = req.params;
    try {
        //Updating an existing note to a specific user
        const { name, dob, email, phone, course, gender, address, enrolled } = req.body;

        const newStudent = {};
        if (name) { newStudent.name = name };
        if (dob) { newStudent.dob = dob };
        if (email) { newStudent.email = email };
        if (phone) { newStudent.phone = phone };
        if (course) { newStudent.course = course };
        if (gender) { newStudent.gender = gender };
        if (address) { newStudent.address = address };
        if (enrolled) { newStudent.enrolled = enrolled };

        //Find the student to be updated and update it
        const stu = await Student.findById(studentId)
        if (!stu) { return res.status(404).json({ success, error: "Student Not found" }) };

        //Allow updation only if user owns the student
        // if(note.user.toString() != req.user.id){
        //     return res.status(401).json({success,error: "Not Allowed"});
        // }

        const student = await Student.findByIdAndUpdate(stu._id, { $set: newStudent }, { new: true });
        success = true;
        res.status(200).json({ success, msg: 'Student data has been updated', stu: student });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success, error: 'Internal Server error' });
    }
});

//Route 4: Delete an existing student record using : DELETE "/api/students/delete:id/" . Login required.
router.delete('/delete/:id', fetchuser, async (req, res) => {
    //Deleting a specific student record
    let success = false;
    const { id: studentId } = req.params;
    try {
        //Find the note to be deleted and delete it
        let stu = await Student.findById(studentId);
        if (!stu) { return res.status(404).json({ success, error: "Student Not found" }) };

        //Allow deletion only if user owns 
        // if(stu.user.toString() != req.user.id){
        //     return res.status(401).json({success,error: "Not Allowed"});
        // }

        stu = await Student.findByIdAndDelete(studentId);
        success = true;
        res.status(200).json({ success, msg: "Student data has been deleted", stu: stu });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success, error: 'Internal Server error' });
    }
});

module.exports = router;