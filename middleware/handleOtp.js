const formData = require('form-data');
const Mailgun = require('mailgun.js');
require('dotenv').config();

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});

const DOMAIN = process.env.MAILGUN_DOMAIN;

// Send OTP Email
const sendOTP = (email, title, otp) => {
  return mg.messages.create(DOMAIN, {
    from: `Akshay Institute <${process.env.EMAIL_USER}>`,
    to: [email],
    subject: `Akshay Institute ${title} OTP`,
    text: `Your OTP is ${otp}. It is valid for 5 minutes. Don't share it with anyone.`,
    html: `<strong>Your OTP is ${otp}. It is valid for 5 minutes.</strong>`,
  });
};

// Send Custom Message Email
const sendMessage = (email, name, message) => {
  return mg.messages.create(DOMAIN, {
    from: `Akshay Institute <${process.env.EMAIL_USER}>`,
    to: [email],
    subject: 'Akshay Institute Important Alert',
    text: `Dear ${name},\n\n${message}`,
    html: `
      <p>Dear ${name},</p>
      <p>${message}</p>
      <br />
      <strong>Best Regards from Akshay Institute!</strong>
    `
  });
};

module.exports = {
  sendOTP,
  sendMessage,
};
