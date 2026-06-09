const Order = require("../models/Order");
const Product = require("../models/Product");

async function restoreInventoryForOrder(order) {
  if (!order?.products?.length) {
    return;
  }

  for (const item of order.products) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { quantity: item.quantity },
    });
  }
}

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate("user", "fullName email phone")
      .populate("products.product", "name price")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get order detail (admin)
exports.getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "fullName email phone address")
      .populate("products.product", "name price image");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const oldOrder = await Order.findById(orderId);
    if (!oldOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (status === "cancelled" && oldOrder.status !== "cancelled") {
      await restoreInventoryForOrder(order);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get order stats (admin)
exports.getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "pending" });

    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const recentOrders = await Order.find()
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        ordersByStatus,
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete order (admin)
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "cancelled") {
      await restoreInventoryForOrder(order);
    }

    await Order.findByIdAndDelete(orderId);

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Create order (admin)
exports.createOrderAdmin = async (req, res) => {
  try {
    const { userId, products, shippingAddress, paymentMethod } = req.body;
    // Accept optional shippingFee from admin UI (default 30000)
    let shippingFee = 30000;
    if (typeof req.body.shippingFee !== 'undefined') {
      const sf = Number(req.body.shippingFee);
      shippingFee = isNaN(sf) ? 0 : sf;
    }

    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.address) {
      return res.status(400).json({ success: false, message: "Missing shipping information" });
    }
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: "Product list is empty" });
    }

    let subtotal = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found ID: ${item.product}` });
      }
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: "Invalid quantity" });
      }
      if (product.quantity < qty) {
        return res.status(400).json({ success: false, message: `Product "${product.name}" only has ${product.quantity} left` });
      }

      orderProducts.push({
        product: product._id,
        quantity: qty,
        price: product.price,
      });
      subtotal += product.price * qty;
    }

    const total = subtotal + shippingFee;

    const orderData = {
      orderNumber: generateOrderNumber(),
      products: orderProducts,
      totalPrice: total,
      status: "pending",
      shippingAddress: {
        fullName: shippingAddress.fullName,
        address: shippingAddress.address,
        city: shippingAddress.city || "",
        phone: shippingAddress.phone,
      },
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "banking" ? "pending" : "unpaid",
    };

    if (userId) {
      orderData.user = userId;
    }

    const order = await Order.create(orderData);

    // Decrease inventory
    for (const item of orderProducts) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity },
      });
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
