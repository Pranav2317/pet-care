const authMiddleware = require("./auth");

const adminMiddleware = (req, res, next) => {
  try {
    authMiddleware(req, res, () => {
      if (req.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins have access",
        });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Authentication error",
      error: error.message,
    });
  }
};

module.exports = adminMiddleware;
