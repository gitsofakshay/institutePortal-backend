const { sendOTP } = require('../');

sendOTP('recipient@example.com', 'Login', '123456')
  .then(() => console.log('OTP email sent!'))
  .catch(err => console.error('Email error:', err));
