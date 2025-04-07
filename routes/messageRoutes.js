const express = require("express");
const router = express.Router();
const {sendMessage} = require('../middleware/handleOtp');
const Student = require("../models/Student");
const Notification = require('../models/Notification')
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Send a message to a student
router.post("/", authMiddleware,[
    body('message','Message should be atleast 5 characters').isLength({min:5}),
], async (req, res) => {
    const { studentId, message } = req.body;
    try {
        // Check if the user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ msg: "Student not found" });
        } 
        //function for seding the email with otp        
        await sendMessage(student.email,student.name,message);                   
        res.status(200).json({ msg: "Message sent to student successfully!" });
    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({msg: "Error sending message" });
    }
});

//Route for Notification api/send-message/notification - Admin login required
router.post("/notification", authMiddleware, [
    body('message', 'Message should be atleast 10 characters').isLength({ min: 10 }),
], async (req, res) => {
    let success = false;
    try {
        // Check if the user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        //If there are error return bad request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success, errors: errors.array() });
        }

        const { message } = req.body;
        //seding message to show in home page inbox
        const msg = new Notification({ message });
        const savedMsg = await msg.save();
        success = true;
        res.status(200).json({ success, msg: 'Notfication has been saved successfully', savedMsg: savedMsg });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success, error: 'Internal Server error' });
    }
});

module.exports = router;
