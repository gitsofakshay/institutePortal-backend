const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Admin = require("../models/AdminUser");
const Faculty = require("../models/Faculty");

const JWT_SECRET = process.env.JWT_SECRET;

// Universal Auth Middleware
const authMiddleware = async (req, res, next) => {
  // Get token from header
  const token = req.header("auth-token");
  if (!token)
    return res.status(401).json({ error: "Access Denied: No Token Provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check user type and attach user with role
    if (decoded.role === "student") {
      const student = await Student.findById(decoded.id);
      if (!student) return res.status(404).json({ error: "Student not found" });
      req.user = { id: student._id, role: "student", name: student.name };
    } else if (decoded.role === "admin") {
      const admin = await Admin.findById(decoded.id);
      if (!admin) return res.status(404).json({ error: "Admin not found" });
      req.user = { id: admin._id, role: "admin", name: admin.name };
    } else if (decoded.role === "faculty") {
      const faculty = await Faculty.findById(decoded.id);
      if (!faculty) return res.status(404).json({ error: "Faculty not found" });
      req.user = { id: faculty._id, role: "faculty", name: faculty.name };
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    next();
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ error: "Invalid Token" });
  }
};

module.exports = authMiddleware;
