const Product = require("../models/Product");

// Validate product data
const validateProductData = async (data) => {
  const errors = [];

  if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
    errors.push("Invalid product name");
  }

  if (!data.category || typeof data.category !== "string" || data.category.trim() === "") {
    errors.push("Invalid category");
  }

  if (data.price === undefined || data.price === null) {
    errors.push("Invalid price");
  } else {
    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0) {
      errors.push("Price must be a positive number");
    }
  }

  if (data.quantity === undefined || data.quantity === null) {
    errors.push("Invalid stock quantity");
  } else {
    const quantity = parseInt(data.quantity);
    if (isNaN(quantity) || quantity < 0) {
      errors.push("Stock quantity must be a positive number");
    }
  }

  if (data.description && typeof data.description !== "string") {
    errors.push("Description must be text");
  }

  if (data.image && typeof data.image !== "string") {
    errors.push("Invalid image URL");
  }

  return errors;
};

// Helper to parse arrays from string
const parseArray = (input) => {
  if (Array.isArray(input)) return input;
  if (typeof input === "string")
    return input
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i);
  return [];
};

// Normalize product data
const normalizeProductData = (data, file) => {
  const normalized = {
    name: data.name.trim(),
    description: data.description?.trim() || "",
    category: data.category.toLowerCase(),
    price: parseFloat(data.price),
    quantity: parseInt(data.quantity) || 0,
    brand: data.brand?.trim() || "",
    weight: data.weight?.trim() || "",
    lifeStage: data.lifeStage?.trim() || "",
    flavor: data.flavor?.trim() || "",
    origin: data.origin?.trim() || "",
    benefits: parseArray(data.benefits),
    ingredients: parseArray(data.ingredients),
    detailedDescription: data.detailedDescription?.trim() || "",
  };

  if (file) {
    normalized.image = "/uploads/" + file.filename;
  } else if (data.image) {
    normalized.image = data.image.trim();
  }

  return normalized;
};

// Get products with filter (admin)
exports.getProductsAdmin = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    let query = {};

    if (category) {
      query.category = category.toLowerCase();
    }

    if (search) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product list",
      error: error.message,
    });
  }
};

// Create product (admin only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, price, quantity, image } = req.body;

    // Validate data
    const errors = await validateProductData({
      name,
      category,
      price,
      quantity,
      description,
      image,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data",
        errors,
      });
    }

    // Normalize data
    const normalizedData = normalizeProductData(req.body, req.file);

    // Check if product name already exists
    const existingProduct = await Product.findOne({
      name: normalizedData.name,
    });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product name already exists in the system",
      });
    }

    const product = new Product(normalizedData);
    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Update product (admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, category, price, quantity, image } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product does not exist",
      });
    }

    // Validate data
    const errors = await validateProductData({
      name,
      category,
      price,
      quantity,
      description,
      image,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data",
        errors,
      });
    }

    // Normalize data
    const normalizedData = normalizeProductData(req.body, req.file);

    // Check if new name is already used by another product
    if (normalizedData.name !== product.name) {
      const existingProduct = await Product.findOne({
        name: normalizedData.name,
      });
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: "Product name already exists",
        });
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { ...normalizedData, updatedAt: Date.now() },
      { new: true }
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product does not exist",
      });
    }

    // Delete associated image file from uploads folder if it's a local upload
    if (product.image && product.image.startsWith("/uploads/")) {
      const fs = require("fs");
      const path = require("path");
      const imagePath = path.join(__dirname, "../views", product.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log(`Successfully deleted local image file: ${imagePath}`);
        } catch (err) {
          console.error(`Error deleting image file: ${err.message}`);
        }
      }
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// Get product stats (admin)
exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$price", "$quantity"] } },
        },
      },
    ]);

    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalQty: { $sum: "$quantity" },
        },
      },
    ]);

    const lowStockProducts = await Product.find({
      quantity: { $lt: 10 },
    }).limit(10);

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalInventoryValue: totalValue[0]?.total || 0,
        productsByCategory,
        lowStockProducts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product statistics",
      error: error.message,
    });
  }
};

// Get all public products (no auth required)
exports.getPublicProducts = async (req, res) => {
  try {
    const { category, search, limit = 10 } = req.query;

    let query = {};

    if (category) {
      query.category = category.toLowerCase();
    }

    if (search) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum);

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product list",
      error: error.message,
    });
  }
};
