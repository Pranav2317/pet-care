const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const orderController = require("../controllers/orderController");

// Get customer's order list
router.get("/", authMiddleware, orderController.getOrders);

// Get order detail
router.get("/:orderId", authMiddleware, orderController.getOrderDetail);

// Create new order
router.post("/", authMiddleware, orderController.createOrder);

// Cancel order
router.patch("/:orderId/cancel", authMiddleware, orderController.cancelOrder);

module.exports = router;
