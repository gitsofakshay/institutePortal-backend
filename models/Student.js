const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const StudentSchema = new Schema({
  name: { type: String, required: true },
  dob: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: Number, required: true, unique: true },
  gender: { type: String, required: true },
  course: { type: String, required: true },
  enrolled: { type: Boolean, default: false }, // Default: Not enrolled yet
  address: { type: String, default: 'India' },
  password: { type: String }, // password will be set by the student

  // Attendance will be added later
  attendance: {
    present: { type: Number, default: 0 },
    absent: { type: Number, default: 0 }
  },  

  // Fees info will be updated later
  fees: {
    total: { type: Number, default: 0 }, // Set later
    paid: { type: Number, default: 0 }, // Set later
    due: { type: Number, default: 0 }, // Auto-updated
    lastPaymentDate: { type: Date },
    paymentHistory: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, required: true },
        method: {
          type: String,
          enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Razorpay'], // ✅ Added Razorpay
          required: true
        }        
      }
    ],
  },

  // Notifications will be added later
  notifications: [
    { 
      message: { type: String, required: true },
      date: { type: Date, default: Date.now },
      read: { type: Boolean, default: false }
    }
  ],

  date: { type: Date, default: Date.now }
});

// // 🔹 Hash password before saving
// StudentSchema.pre('save', async function (next) {
//   if (this.isModified('password') && this.password) {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//   }
//   next();
// });

// // 🔹 Auto-update due amount when 'paid' changes
// StudentSchema.pre('save', function (next) {
//   if (this.isModified('fees.paid')) {
//     this.fees.due = this.fees.total - this.fees.paid;
//   }
//   next();
// });

module.exports = mongoose.model('Student', StudentSchema);
