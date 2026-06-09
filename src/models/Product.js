const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  image: String,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  brand: String,
  weight: String,
  lifeStage: String,
  flavor: String,
  origin: String,
  benefits: [String],
  ingredients: [String],
  detailedDescription: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
