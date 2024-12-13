const mongoose = require('mongoose')
require("dotenv").config();
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
const connectToDatabase = () => {
  mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB database successfully."))
  .catch((err) => console.error("Error connecting to MongoDB:", err));
};

module.exports = connectToDatabase;