const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const brandController = require("../controllers/brandController");

// Public: list all categories from Category model
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public: list brands (kept for backward compatibility)
router.get("/brands", brandController.getPublicBrands);

module.exports = router;
