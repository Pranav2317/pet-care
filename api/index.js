require("dotenv").config();

const connectDB = require("../src/db");
const app = require("../src/app");

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }

  app(req, res);
};
