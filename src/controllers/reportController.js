const excelReportService = require("../services/excelReportService");
const moment = require("moment");
const Order = require("../models/Order");
const Product = require("../models/Product");

exports.getReportStats = async (req, res) => {
  try {
    let { from, to } = req.query;

    const now = new Date();
    if (!from) {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      from = firstDay.toISOString().slice(0, 10);
    }
    if (!to) {
      to = now.toISOString().slice(0, 10);
    }

    const dateFrom = new Date(from + "T00:00:00.000Z");
    const dateTo = new Date(to + "T23:59:59.999Z");

    // Previous period of same duration for growth comparison
    const durationMs = dateTo - dateFrom;
    const prevDateTo = new Date(dateFrom.getTime() - 1);
    const prevDateFrom = new Date(prevDateTo.getTime() - durationMs);

    const matchCurrent = {
      $match: { status: { $ne: "cancelled" }, createdAt: { $gte: dateFrom, $lte: dateTo } },
    };
    const matchPrev = {
      $match: { status: { $ne: "cancelled" }, createdAt: { $gte: prevDateFrom, $lte: prevDateTo } },
    };

    const [summaryAgg, prevSummaryAgg, dailyRevenue, topProductsAgg, revenueByCategory, lowStock] =
      await Promise.all([
        Order.aggregate([
          matchCurrent,
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalPrice" },
              orderCount: { $sum: 1 },
              totalItemsSold: {
                $sum: {
                  $reduce: {
                    input: "$products",
                    initialValue: 0,
                    in: { $add: ["$$value", "$$this.quantity"] },
                  },
                },
              },
            },
          },
        ]),
        Order.aggregate([
          matchPrev,
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalPrice" },
              orderCount: { $sum: 1 },
            },
          },
        ]),
        Order.aggregate([
          matchCurrent,
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              revenue: { $sum: "$totalPrice" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Order.aggregate([
          matchCurrent,
          { $unwind: "$products" },
          { $match: { "products.product": { $ne: null } } },
          {
            $group: {
              _id: "$products.product",
              totalQty: { $sum: "$products.quantity" },
              totalRevenue: {
                $sum: { $multiply: ["$products.price", "$products.quantity"] },
              },
            },
          },
          { $sort: { totalQty: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "_id",
              as: "info",
            },
          },
          { $addFields: { info: { $arrayElemAt: ["$info", 0] } } },
          {
            $project: {
              totalQty: 1,
              totalRevenue: 1,
              name: { $ifNull: ["$info.name", "Deleted product"] },
              category: { $ifNull: ["$info.category", "Other"] },
              image: { $ifNull: ["$info.image", ""] },
            },
          },
        ]),
        Order.aggregate([
          matchCurrent,
          { $unwind: "$products" },
          {
            $lookup: {
              from: "products",
              localField: "products.product",
              foreignField: "_id",
              as: "productInfoArr",
            },
          },
          {
            $group: {
              _id: {
                $ifNull: [{ $arrayElemAt: ["$productInfoArr.category", 0] }, "Other"],
              },
              revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
              count: { $sum: "$products.quantity" },
            },
          },
          { $sort: { revenue: -1 } },
        ]),
        Product.find({ quantity: { $lt: 10 } })
          .select("name category quantity")
          .sort({ quantity: 1 })
          .limit(20),
      ]);

    const summary = summaryAgg[0] || { totalRevenue: 0, orderCount: 0, totalItemsSold: 0 };
    const prevSummary = prevSummaryAgg[0] || { totalRevenue: 0, orderCount: 0 };
    const avgOrderValue = summary.orderCount > 0
      ? Math.round(summary.totalRevenue / summary.orderCount)
      : 0;

    const grandRevenue = topProductsAgg.reduce((s, p) => s + p.totalRevenue, 0);
    const topProducts = topProductsAgg.map((p) => ({
      ...p,
      pct: grandRevenue > 0 ? +((p.totalRevenue / grandRevenue) * 100).toFixed(1) : 0,
    }));

    res.json({
      success: true,
      data: {
        totalRevenue: summary.totalRevenue,
        orderCount: summary.orderCount,
        avgOrderValue,
        totalItemsSold: summary.totalItemsSold,
        prevRevenue: prevSummary.totalRevenue,
        prevOrderCount: prevSummary.orderCount,
        dailyRevenue,
        topProducts,
        lowStock,
        revenueByCategory,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.exportExcelReport = async (req, res) => {
  try {
    const workbook = await excelReportService.generateReport();

    const fileName = `Gray_Pet_Shop_Report_${moment().format("YYYYMMDD_HHmmss")}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting excel report:", error);
    res.status(500).json({
      success: false,
      message: "Server error while exporting report",
      error: error.message,
    });
  }
};
