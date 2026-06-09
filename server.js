require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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
