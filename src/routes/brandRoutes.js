const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");

// /api/brands/ -> Get brand list (main)
router.get("/", brandController.getPublicBrands);

// /api/brands/categories -> Get category list (based on brand/product)
router.get("/categories", brandController.getPublicCategories);

module.exports = router;
