const mongoose = require('mongoose');
const {Schema} = mongoose;

const NotificationSchema = new Schema({
  message: {
    type: String,
    required: true, 
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('notification', NotificationSchema);  