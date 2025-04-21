const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./db")
require("dotenv").config();
const PORT = process.env.PORT || 5000;

connectToDatabase();
const app = express();
// CORS configuration
const allowedOrigins = [
    'https://akshay-institute.netlify.app', // Netlify frontend URL
    'http://localhost:5173', // Local development frontend
];

const corsOptions = {
    origin: (origin, callback) => {
        console.log("Incoming origin:", origin); // 🔍 Log for debugging
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization,auth-token',
    credentials: true,
};

app.use(cors(corsOptions)); //Apply CORS setting
// app.use(cors()); //Granting access to all origin
app.use(express.json()); // Body parser

// Routes
app.use("/api/students", require("./routes/studentRoutes"));
app.use('/api/handle-students', require('./routes/handleStudentsRoutes'));
app.use('/api/fees', require('./routes/feesRoutes'));
app.use('/api/otp', require('./routes/handleOptRoutes'))
app.use('/api/faculty', require('./routes/facultyRoutes'))
app.use("/api/send-message", require("./routes/messageRoutes"));
app.use("/api/auth", require("./routes/authentication"));

// Start server
app.listen(PORT, () => console.log(`Institute portal Server is running on port ${PORT}`));
