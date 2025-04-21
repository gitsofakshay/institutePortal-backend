const jwt = require("jsonwebtoken");
require('dotenv').config();

exports.isVerified = (req, res, next) => {
  const authHeader = req.header('auth-token');
  if (!authHeader) return res.status(400).json({ message: "Token is not provided" });
  if (authHeader) {
    try {
      const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
      req.email = decoded.email;
      next();
    } catch (error) {
      return res.status(401).json({ msg: "Unauthorized or expired token" });
    }
  } else {
    return res.status(401).json({ msg: "No token provided" });
  }
};
