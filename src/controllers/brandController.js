const Brand = require("../models/Brand");
const Product = require("../models/Product");

const formatName = (value) => value?.trim() || "";

const ensureBrandsFromProducts = async () => {
  try {
    const existingBrandNames = new Set(
      (await Brand.find({}).select("name").lean()).map((brand) => brand.name)
    );

    const productBrands = await Product.distinct("brand", {
      brand: { $exists: true, $ne: "" },
    });

    const normalizedProductBrands = [
      ...new Set(productBrands.map((name) => formatName(name)).filter(Boolean)),
    ];

    const newBrands = normalizedProductBrands
      .filter((name) => !existingBrandNames.has(name))
      .map((name) => ({ name }));

    if (newBrands.length > 0) {
      await Brand.insertMany(newBrands, { ordered: false });
    }
  } catch (error) {
    console.error("Error syncing brands:", error);
  }
};

const getFallbackBrandsFromProducts = async () => {
  const productBrands = await Product.distinct("brand", {
    brand: { $exists: true, $ne: "" },
  });

  return [
    ...new Set(productBrands.map((name) => formatName(name)).filter(Boolean)),
  ]
    .sort()
    .map((name) => ({ name }));
};

exports.getPublicCategories = async (req, res) => {
  try {
    const productCategories = await Product.distinct("category", {
      category: { $exists: true, $ne: "" },
    });

    const categories = [
      ...new Set(
        productCategories.map((name) => formatName(name)).filter(Boolean)
      ),
    ]
      .sort()
      .map((name) => ({
        name,
        slug: name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      }));

    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicBrands = async (req, res) => {
  try {
    await ensureBrandsFromProducts();
    let brands = await Brand.find({}).sort({ name: 1 });
    if (brands.length === 0) {
      brands = await getFallbackBrandsFromProducts();
    }
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBrandsAdmin = async (req, res) => {
  try {
    await ensureBrandsFromProducts();
    let brands = await Brand.find({}).sort({ name: 1 });
    if (brands.length === 0) {
      brands = await getFallbackBrandsFromProducts();
    }
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const name = formatName(req.body.name);
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name cannot be empty",
      });
    }
    const brand = new Brand({ name });
    await brand.save();
    res
      .status(201)
      .json({ success: true, message: "Brand created successfully", brand });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Brand already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const name = formatName(req.body.name);
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name cannot be empty",
      });
    }
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res
        .status(404)
        .json({ success: false, message: "Brand does not exist" });
    }
    brand.name = name;
    await brand.save();
    res.json({
      success: true,
      message: "Brand updated successfully",
      brand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Brand already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res
        .status(404)
        .json({ success: false, message: "Brand does not exist" });
    }
    const assignedProducts = await Product.countDocuments({
      brand: brand.name,
    });
    if (assignedProducts > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete brand because products are still using it",
      });
    }
    await Brand.findByIdAndDelete(brandId);
    res.json({ success: true, message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
