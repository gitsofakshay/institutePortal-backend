const express = require('express');
const Admin = require('../models/AdminUser');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isVerified } = require('../middleware/isVarified');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

//Route 1: Create a user using : POST "/api/auth/createadmin" , No login required.
router.post('/createadmin', isVerified, [
    body('name', 'Name must be atleast 3 character').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password should be atleast 5 character').isLength({ min: 5 }),
], async (req, res) => {
    //If there are error return bad request
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, msg: errors.array() });
    }
    try {
        // Check whether the user with this email exists already
        let user = await Admin.findOne({ email: req.body.email });
        if (user) {
            return res.status(401).json({ success, msg: 'Sorry! A user with this email already exists' });
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
        res.status(500).json({ success, msg: 'Internal Server error' });
    }
});


//Route 2: Authenticate a user using : POST "/api/auth/login" , No login required.
router.post('/login', isVerified, [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password can not be blank').isLength({min:1}),
    // body('otp', 'otp must be 6 digit').isLength({ max: 6 }),
], async (req, res) => {
    let success = false;
    //If there are error return bad request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, msg: errors.array() });
    }

    const { email, password } = req.body;
    try {
        //Checking email is valid or not
        let user = await Admin.findOne({ email });
        if (!user) {
            return res.status(401).json({ success, msg: "Please enter valid credentials" });
        }

        //Checking password is valid or not
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            return res.status(401).json({ success, msg: "Please enter valid credentials" });
        }

        //JWT token generation
        const payload = {
            id: user._id,
            role: 'admin' 
        };
          
        success = true;
        const authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({success, authToken, msg: 'Login to admin panel is successful' });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success, msg: 'Internal Server error' });
    }
});

//Route 3: Change Password using : POST "/api/auth/changepassword" , No login required.
router.put('/change-password', isVerified, [
    body('email', 'Enter a valid email').isEmail(),
    body('newPassword','newPassword should be atleast 5 character').isLength({min:5})
], async (req, res) => {
    let success = false;
    //If there are error return bad request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, message: errors.array() });
    }

    const { email, newPassword} = req.body;
    try {
        //Checking email is valid or not
        let user = await Admin.findOne({ email });
        if (!user) {
            return res.status(401).json({ success, message: "Please enter valid credentials" });
        }

        //hashing password by using bryptjs package
        const salt = await bcrypt.genSalt(10);
        const secPassword = await bcrypt.hash(newPassword, salt);

        //updating password
        await Admin.findOneAndUpdate({ email }, { password: secPassword });
        success = true;
        res.status(200).json({ success, message: 'Password changed successfully' });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success, message: 'Internal Server error' });
    }
});

//Route 4: Change Email using : POST "/api/auth/changeemail" , No login required.
router.put('/changeemail', isVerified, [
    body('email', 'Enter a valid email').isEmail(),
    body('newEmail', 'Enter a valid email').isEmail()
], async (req, res) => {
    let success = false;
    //If there are error return bad request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, message: errors.array() });
    }

    const { email, newEmail} = req.body;
    try {
        //Checking email is valid or not
        let user = await Admin.findOne({ email });
        if (!user) {
            return res.status(401).json({ success, message: "Please enter valid credentials" });
        }

        //updating email
        await Admin.findOneAndUpdate({ email }, { email: newEmail });
        success = true;
        res.status(200).json({ success, message: 'Email changed successfully' });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success, message: 'Internal Server error' });
    }
});

module.exports = router;