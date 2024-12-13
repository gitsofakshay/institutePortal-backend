const OTPModel = require('../models/LoginOtp');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//function for seding the email with otp
const sendOTP = (email, otp) => {
    const msg = {
        to: email,
        from: process.env.EMAIL_USER,
        subject: 'Maharaja Agrasen institute admin verification OTP',
        text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
        html: `<strong>Your OTP is ${otp}. It is valid for 5 minutes.</strong>`,
    };
    
    return sgMail.send(msg);
};

const sendMessage = (email,name,message) => {
    const msg = {
        to: email,
        from: process.env.EMAIL_USER,
        subject: 'Maharaja Agrasen Institute important alert',
        text: `Dear ${name} ${message}`,
        html: `<strong>Best Regards form Maharaja Agrasen Institute!</strong>`,
    };

    return sgMail.send(msg);
};

//function for generating otp
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
};

// Save OTP in the database with user ID and timestamp
const saveOTP = async (userId, otp) => {
    const expirationTime = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
    await OTPModel.create({ userId, otp, expirationTime });
};

// Save OTP in the database with user email and timestamp
// const saveSignupOtp = async (email, otp) => {
//     const expirationTime = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
//     await SignupOTP.create({ email, otp, expirationTime });
// };

module.exports = {
    sendOTP,
    generateOTP,
    saveOTP,
    sendMessage
    // saveSignupOtp,
};