const OTPModel = require('../models/LoginOtp');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//function for seding the email with otp
const sendOTP = (email, title, otp) => {
    const msg = {
        to: email,
        from: process.env.EMAIL_USER,
        subject: `Akshay Institute ${title} OTP`,
        text: `Your OTP is ${otp}. It is valid for 5 minutes. Don't share it to anyone.`,
        html: `<strong>Your OTP is ${otp}. It is valid for 5 minutes.</strong>`,
    };
    
    return sgMail.send(msg);
};

const sendMessage = (email,name,message) => {
    const msg = {
        to: email,
        from: process.env.EMAIL_USER,
        subject: 'Akshay Institute important alert',
        text: `Dear ${name},\n\n${message}`,
        html: `
            <p>Dear ${name},</p>
            <p>${message}</p>
            <br />
            <strong>Best Regards from Akshay Institute!</strong>
        `,
    };

    return sgMail.send(msg);
};

module.exports = {
    sendOTP,    
    sendMessage    
};