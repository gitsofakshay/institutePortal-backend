const mongoose = require('mongoose');
const {Schema} = mongoose;

const StudentSchema = new Schema({
  name: {
    type: String,
    required: true, 
  },
  dob: {
    type: String,
    required: true, 
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: Number,
    required: true,
    unique: true
  },
  gender: {
    type: String,
    required: true,    
  },
  course: {
    type: String,
    required: true,    
  },
  enrolled:{
    type: Boolean,
    default: false,
    required: true,
  },
  address: {
    type: String,
    default: 'India'       
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('student', StudentSchema);  