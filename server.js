require("dotenv").config();
const connectDB = require("./src/db");
const app = require("./src/app");

connectDB()
  .then(() => {
    console.log("✓ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err.message);
    console.warn("⚠ Continuing without database connection...");
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});
