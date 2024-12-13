const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./db")
require("dotenv").config();
const PORT = process.env.PORT || 5000;

connectToDatabase();
const app = express();
app.use(cors());
app.use(express.json()); // Body parser

// Routes
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/send-message", require("./routes/messageRoutes"));
app.use("/api/auth", require("./routes/authentication"));

// Start server
app.listen(PORT, () => console.log(`Institute portal Server is running on port ${PORT}`));
