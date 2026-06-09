const express = require("express");
const router = express.Router();
const vnpayController = require("../controllers/vnpayController");

// Create VNPAY payment URL
router.post("/vnpay/create", vnpayController.createPayment);

// Handle VNPAY payment return callback
router.get("/vnpay/return", vnpayController.vnpayReturn);

module.exports = router;
