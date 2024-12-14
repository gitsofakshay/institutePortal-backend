const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./db")
require("dotenv").config();
const PORT = process.env.PORT || 5000;

connectToDatabase();
const app = express();
// CORS configuration
const corsOptions = {
    origin: 'https://maharaja-agrasen-institute.netlify.app/', // Netlify frontend URL
    methods: 'GET,POST,PUT,DELETE', // Allowed methods
    allowedHeaders: 'Content-Type,Authorization,auth-token', // Allowed headers
    credentials: true // Enable credentials (cookies, etc.)
};

app.use(cors(corsOptions)); //Apply CORS setting
app.use(express.json()); // Body parser

// Routes
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/send-message", require("./routes/messageRoutes"));
app.use("/api/auth", require("./routes/authentication"));

// Start server
app.listen(PORT, () => console.log(`Institute portal Server is running on port ${PORT}`));
