const Review = require("../models/Review");
const Product = require("../models/Product");

// Recalculate average rating and update Product
const recalcProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const avg =
    reviews.length === 0
      ? 0
      : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avg * 10) / 10,
  });
};

// GET /api/reviews/:productId – get reviews for a product
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/reviews/:productId – add / update review (auth required)
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }

    // Upsert: update if user has already reviewed
    await Review.findOneAndUpdate(
      { product: productId, user: req.userId },
      { rating, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await recalcProductRating(productId);

    const updated = await Review.find({ product: productId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });

    const product = await Product.findById(productId).select("rating");
    res.json({ success: true, reviews: updated, avgRating: product.rating });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/reviews/:productId – delete own review
exports.deleteReview = async (req, res) => {
  try {
    await Review.findOneAndDelete({
      product: req.params.productId,
      user: req.userId,
    });
    await recalcProductRating(req.params.productId);
    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/reviews/:productId/:reviewId/reply - Admin reply to review
exports.replyReview = async (req, res) => {
  try {
    const { adminReply } = req.body;
    const { productId, reviewId } = req.params;

    if (!adminReply) {
      return res.status(400).json({ success: false, message: "Please enter a reply" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.adminReply = adminReply;
    review.adminReplyAt = new Date();
    await review.save();

    const updated = await Review.find({ product: productId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });

    res.json({ success: true, message: "Reply sent", reviews: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/reviews/:productId/:reviewId/reply - Admin delete reply
exports.deleteReply = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.adminReply = undefined;
    review.adminReplyAt = undefined;
    await review.save();

    const updated = await Review.find({ product: productId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });

    res.json({ success: true, message: "Reply deleted", reviews: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
