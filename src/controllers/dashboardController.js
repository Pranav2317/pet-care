const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");

// Get dashboard stats (admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const pendingOrders = await Order.countDocuments({ status: "pending" });

    // Revenue by month (for growth calculation)
    const revenueByMonth = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    // Revenue by category
    const revenueByCategory = await Order.aggregate([
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          revenue: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
          count: { $sum: "$products.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Revenue by day (last 14 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

    const revenueByDay = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: fourteenDaysAgo,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Recent activities
    const recentOrders = await Order.find()
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .select("fullName email role createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // Top selling products (use $lookup to avoid null product refs)
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$products" },
      { $match: { "products.product": { $ne: null } } },
      {
        $group: {
          _id: "$products.product",
          sold: { $sum: "$products.quantity" },
          revenue: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $addFields: {
          productInfo: { $arrayElemAt: ["$productInfo", 0] },
        },
      },
      {
        $project: {
          sold: 1,
          revenue: 1,
          name: { $ifNull: ["$productInfo.name", "Deleted product"] },
          category: { $ifNull: ["$productInfo.category", "Other"] },
          image: { $ifNull: ["$productInfo.image", ""] },
        },
      },
    ]);

    res.json({
      success: true,
      dashboard: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          admins: totalAdmins,
        },
        products: {
          total: totalProducts,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          revenue: totalRevenue[0]?.total || 0,
        },
        revenueByDay,
        revenueByMonth,
        revenueByCategory,
        recentOrders,
        recentUsers,
        topProducts,
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
