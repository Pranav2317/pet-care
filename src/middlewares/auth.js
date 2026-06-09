const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists in DB (avoid stale tokens after seeding)
    const user = await User.findById(decoded.userId).select("_id role");
    if (!user) {
      return res.status(401).json({ message: "Account does not exist. Please log in again." });
    }

    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

module.exports = authMiddleware;
