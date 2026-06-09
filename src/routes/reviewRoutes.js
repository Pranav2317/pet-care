const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const reviewController = require("../controllers/reviewController");
const adminMiddleware = require("../middlewares/admin");

// Public: get reviews
router.get("/:productId", reviewController.getReviews);

// Login required: create / delete
router.post("/:productId", authMiddleware, reviewController.createReview);
router.delete("/:productId", authMiddleware, reviewController.deleteReview);

// Admin: reply to review & delete reply
router.post("/:productId/:reviewId/reply", authMiddleware, adminMiddleware, reviewController.replyReview);
router.delete("/:productId/:reviewId/reply", authMiddleware, adminMiddleware, reviewController.deleteReply);

module.exports = router;
