
const mongoose = require('mongoose');
const {Schema} = mongoose;

const otpSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'admin',
    required: true,
  },
  otp: {
    type: Number,
    required: true,
  },
  expirationTime: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// Optional: Add a method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  return this.expirationTime < Date.now();
};

// Create the OTP model
const OTPModel = mongoose.model('OTP', otpSchema);

module.exports = OTPModel;
