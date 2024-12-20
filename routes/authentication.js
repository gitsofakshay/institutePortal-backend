const express = require('express');
const mongoose = require('mongoose');
const Admin = require('../models/AdminUser');
const LoginOtp = require('../models/LoginOtp')
const { sendOTP, generateOTP, saveOTP } = require('../middleware/handleOtp');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { json } = require('body-parser');
require('dotenv').config();

//Route 1: Create a user using : POST "/api/auth/createadmin" , No login required.
router.post('/createadmin', [
    body('name', 'Name must be atleast 3 character').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password should be atleast 5 character').isLength({ min: 5 }),
], async (req, res) => {
    //If there are error return bad request
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }
    try {
        // Check whether the user with this email exists already
        let user = await Admin.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ success, error: 'Sorry! A user with this email already exists' });
        }

        //hashing password by using bryptjs package
        const salt = await bcrypt.genSalt(10);
        const secPassword = await bcrypt.hash(req.body.password, salt);

        // Create new user
        user = new Admin({
            name: req.body.name,
            email: req.body.email,
            password: secPassword
        });
        //waiting to save user in database
        await user.save();
        success = true;
        res.status(200).json({ success });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success, error: 'Internal Server error' });
    }
});

//Route 2: Verify OTP using : POST "/api/auth/verifyotp" , No login required.
router.post('/verifyotp', [
    body('otp', 'otp must be 6 digit').isLength({ max: 6 }),
    body('email', 'Enter a valid email').isEmail()
], async (req, res) => {
    //If there are error return bad request
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    try {
        // Email verification process
        const { email, otp } = req.body;        
        const user = await Admin.findOne({ email: email });
    
        if (!user) {
            return res.status(404).json({success:success, message: 'Admin user not found' });
        }
    
        const loginOtp = await LoginOtp.findOne({ userId: user._id });
        // Check if OTP exists and is valid
        if (!loginOtp || loginOtp.isExpired()) {
            await LoginOtp.deleteOne({ _id: loginOtp._id });
            return res.status(401).json({ success:success,message: 'OTP has expired' });
        }
    
        if (loginOtp.otp !== parseInt(otp)) {
            return res.status(401).json({success: success, message: 'Invalid OTP' });
        }
    
        // If OTP is correct, delete it and proceed
        await LoginOtp.deleteOne({ _id: loginOtp._id });
    
        const data = {
            user: {
                id: user.id
            }
        };
        success = true;
        const authToken = jwt.sign(data, process.env.JWT_SECRET);
        res.status(200).json({ success: success, authToken, msg: 'Login to admin panel is successful' });
    } catch (error) {        
        console.error(error.message);
        res.status(500).json({ success: false, error: 'Internal Server error' });
    }
});


//Route 3: Authenticate a user using : POST "/api/auth/login" , No login required.
router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password can not be blank').isLength({min:1}),
], async (req, res) => {
    let success = false;
    //If there are error return bad request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        //Checking email is valid or not
        let user = await Admin.findOne({ email });
        if (!user) {
            return res.status(400).json({ success, error: "Please enter valid credentials" });
        }

        //Checking password is valid or not
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            return res.status(400).json({ success, error: "Please enter valid credentials" });
        }

        //Email verification process
        const otp = generateOTP();
        await saveOTP(user.id, otp);
        await sendOTP(email, otp);
        success = true;
        res.status(200).json({ success, msg: 'OTP sent to registered email please verify it' });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success, error: 'Internal Server error' });
    }
});

module.exports = router;