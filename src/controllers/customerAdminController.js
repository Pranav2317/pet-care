const User = require("../models/User");
const Order = require("../models/Order");

// Get all customers (admin)
exports.getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    let query = { role: "customer" };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const customers = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      customers,
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

// Get customer detail (admin)
exports.getCustomerDetail = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findById(customerId).select("-password");
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get customer orders
    const orders = await Order.find({ user: customerId })
      .populate("products.product", "name price")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      customer,
      orders,
      orderCount: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalPrice, 0),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get customer stats (admin)
exports.getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: "customer" });

    const newCustomersThisMonth = await User.countDocuments({
      role: "customer",
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    const customerOrderStats = await Order.aggregate([
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalPrice" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);

    // Populate user info
    const topCustomers = await Promise.all(
      customerOrderStats.map(async (stat) => {
        const user = await User.findById(stat._id).select("fullName email");
        return {
          user,
          orderCount: stat.orderCount,
          totalSpent: stat.totalSpent,
        };
      })
    );

    res.json({
      success: true,
      stats: {
        totalCustomers,
        newCustomersThisMonth,
        topCustomers,
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
