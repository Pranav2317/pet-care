const Product = require("../models/Product");

/**
 * Get product information by ID (Public)
 * GET /api/products/:id
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get product list by category (Public)
 * GET /api/products/category/:category
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.category.toLowerCase(),
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
