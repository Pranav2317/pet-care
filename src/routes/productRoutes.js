const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const productAdminController = require("../controllers/productAdminController");

// ===== PUBLIC ROUTES (No login required) =====

// Get all products
router.get("/public", productAdminController.getPublicProducts);

// Get product by ID
router.get("/:id", productController.getProductById);

// Get products by category
router.get("/category/:category", productController.getProductsByCategory);

module.exports = router;
