const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");

// =============================================
// Helper Functions
// =============================================

/**
 * Generate a unique order number
 * Combines timestamp + random string to ensure no duplicates
 */
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Validate and normalize cart data
 * @param {Array} cart - Product array from client
 * @returns {{ valid: boolean, message?: string, items?: Array }}
 */
function normalizeCartItems(cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    return { valid: false, message: "Cart is empty." };
  }

  return {
    valid: true,
    items: cart.map((item) => ({
      _id: String(item._id || ""),
      quantity: Number(item.quantity),
    })),
  };
}

/**
 * Restore inventory when an order is cancelled
 * @param {Object} order - Order document from MongoDB
 */
async function restoreInventoryForOrder(order) {
  if (!order?.products?.length) return;

  for (const item of order.products) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { quantity: item.quantity },
    });
  }
}

// =============================================
// Controller Methods
// =============================================

/**
 * Get order list for the logged-in customer
 * GET /api/orders
 */
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate("user", "fullName email phone")
      .populate("products.product", "name price image category")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Get order detail by ID
 * GET /api/orders/:orderId
 */
exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user", "fullName email phone")
      .populate("products.product", "name price image category");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Check order ownership
    if (order.user._id.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "You do not have permission to view this order" });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Create a new order
 * POST /api/orders
 */
exports.createOrder = async (req, res) => {
  try {
    const { paymentMethod, shippingAddress, cart, totalPrice } = req.body;

    // Validate cart
    const normalizedCart = normalizeCartItems(cart);
    if (!normalizedCart.valid) {
      return res
        .status(400)
        .json({ success: false, message: normalizedCart.message });
    }

    // Validate payment method
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    // Validate shipping information
    if (!shippingAddress?.address || !shippingAddress?.phone) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all shipping information.",
      });
    }

    // Calculate price and check inventory
    let subtotal = 0;
    const products = [];

    for (const item of normalizedCart.items) {
      const product = await Product.findById(item._id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item._id}`,
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" only has ${product.quantity} left, not enough to order.`,
        });
      }

      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity.",
        });
      }

      const qty = Math.floor(item.quantity);
      products.push({
        product: product._id,
        quantity: qty,
        price: product.price,
      });
      subtotal += product.price * qty;
    }

    // Calculate total (including shipping fee)
    const shippingFee = 30000;
    const total = subtotal + shippingFee;

    if (Number(totalPrice) !== total) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid total amount." });
    }

    // Create order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.userId,
      products,
      totalPrice: total,
      status: "pending",
      shippingAddress: {
        fullName: shippingAddress.fullName || "",
        address: shippingAddress.address,
        city: shippingAddress.city || "",
        phone: shippingAddress.phone,
      },
      paymentMethod,
      paymentGateway: paymentMethod === "banking" ? "vnpay" : null,
      paymentStatus: paymentMethod === "banking" ? "pending" : "unpaid",
    });

    // Deduct inventory
    for (const item of products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
    }

    // Clear backend cart if present
    const userCart = await Cart.findOne({ user: req.userId });
    if (userCart) {
      await CartItem.deleteMany({ cart: userCart._id });
    }

    return res.json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create order.",
      error: error.message,
    });
  }
};

/**
 * Cancel order
 * PATCH /api/orders/:orderId/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { cancelReason } = req.body;

    if (!cancelReason) {
      return res.status(400).json({
        success: false,
        message: "Please select a cancellation reason.",
      });
    }

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    // Check ownership
    if (order.user.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "You do not have permission to cancel this order." });
    }

    if (order.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Order was already cancelled." });
    }

    // Only allow cancellation in pending or confirmed status
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order in its current status.",
      });
    }

    // Update cancellation status
    order.status = "cancelled";
    order.cancelReason = cancelReason;
    order.cancelledAt = new Date();
    await order.save();

    // Restore inventory
    await restoreInventoryForOrder(order);

    return res.json({
      success: true,
      message: "Order cancelled successfully.",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to cancel order.",
      error: error.message,
    });
  }
};
