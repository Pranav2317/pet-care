const Category = require('../models/Category');
const brandController = require('./brandController');

// Get categories for admin (list all)
exports.getCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Category name cannot be empty' });
    const slug = (req.body.slug || name).toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await Category.findOne({ slug });
    if (existing) return res.status(409).json({ success: false, message: 'Category already exists' });
    const cat = new Category({ name, slug, description: req.body.description || '' });
    await cat.save();
    res.status(201).json({ success: true, message: 'Category created successfully', category: cat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Category name cannot be empty' });
    const slug = (req.body.slug || name).toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const cat = await Category.findById(categoryId);
    if (!cat) return res.status(404).json({ success: false, message: 'Category does not exist' });
    cat.name = name;
    cat.slug = slug;
    cat.description = req.body.description || cat.description;
    await cat.save();
    res.json({ success: true, message: 'Category updated successfully', category: cat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const cat = await Category.findById(categoryId);
    if (!cat) return res.status(404).json({ success: false, message: 'Category does not exist' });
    await Category.findByIdAndDelete(categoryId);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delegate brand admin functions to brandController
exports.getBrandsAdmin = brandController.getBrandsAdmin;
exports.createBrand = brandController.createBrand;
exports.updateBrand = brandController.updateBrand;
exports.deleteBrand = brandController.deleteBrand;

// Optional helper functions used elsewhere
exports.ensureBrandsFromProducts = brandController.ensureBrandsFromProducts;
exports.getFallbackBrandsFromProducts = brandController.getFallbackBrandsFromProducts;
