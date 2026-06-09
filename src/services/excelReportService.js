const ExcelJS = require("exceljs");
const moment = require("moment");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

class ExcelReportService {
  constructor() {
    this.primaryColor = "845400"; // Gray Pet Shop primary color
    this.secondaryColor = "FFB347";
    this.headerFont = {
      name: "Arial",
      family: 4,
      size: 12,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    this.titleFont = {
      name: "Arial",
      family: 4,
      size: 16,
      bold: true,
      color: { argb: "FF" + this.primaryColor },
    };
    this.currencyFormat = '#,##0" ₫"';
  }

  async generateReport() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Gray Pet Shop Admin";
    workbook.lastModifiedBy = "Admin";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Gather raw data
    const [orders, products, users] = await Promise.all([
      Order.find({})
        .populate("user", "fullName email phone")
        .populate("products.product", "name category price"),
      Product.find({}),
      User.find({ role: "customer" }),
    ]);

    await this.buildDashboardSheet(
      workbook.addWorksheet("1. Dashboard Summary"),
      orders,
      products,
      users
    );
    await this.buildRevenueSheet(
      workbook.addWorksheet("2. Revenue Report"),
      orders
    );
    await this.buildOrdersSheet(
      workbook.addWorksheet("3. Orders Report"),
      orders
    );
    await this.buildProductsSheet(
      workbook.addWorksheet("4. Products Report"),
      products,
      orders
    );
    await this.buildCustomersSheet(
      workbook.addWorksheet("5. Customers Report"),
      users,
      orders
    );
    await this.buildPaymentsSheet(
      workbook.addWorksheet("6. Payments Report"),
      orders
    );

    return workbook;
  }

  // Helper to setup common sheet headers
  setupSheetHeader(sheet, title, numCols) {
    sheet.mergeCells(1, 1, 1, numCols);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = `GRAY PET SHOP - ${title.toUpperCase()}`;
    titleCell.font = this.titleFont;
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    sheet.mergeCells(2, 1, 2, numCols);
    const dateCell = sheet.getCell(2, 1);
    dateCell.value = `Report generated: ${moment().format("DD/MM/YYYY HH:mm:ss")}`;
    dateCell.font = { italic: true, color: { argb: "FF666666" } };
    dateCell.alignment = { vertical: "middle", horizontal: "center" };

    sheet.getRow(1).height = 30;
    sheet.getRow(2).height = 20;
    sheet.getRow(3).height = 10; // Empty row for spacing
  }

  // Helper to style table headers
  styleTableHeader(sheet, headerRowIndex) {
    const headerRow = sheet.getRow(headerRowIndex);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF" + this.primaryColor },
      };
      cell.font = this.headerFont;
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    headerRow.height = 25;
    sheet.views = [{ state: "frozen", ySplit: headerRowIndex }];
  }

  // Helper to style data cells
  styleDataCell(cell) {
    cell.border = {
      top: { style: "thin", color: { argb: "FFDDDDDD" } },
      left: { style: "thin", color: { argb: "FFDDDDDD" } },
      bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
      right: { style: "thin", color: { argb: "FFDDDDDD" } },
    };
    cell.alignment = { vertical: "middle" };
  }

  async buildDashboardSheet(sheet, orders, products, users) {
    this.setupSheetHeader(sheet, "Dashboard Overview", 2);

    sheet.columns = [
      { header: "KPI Metric", key: "metric", width: 40 },
      { header: "Value", key: "value", width: 30 },
    ];

    // Override row 4 (since columns declaration adds headers to row 1 by default, but we merged it)
    sheet.getRow(4).values = ["Statistics", "Value"];
    this.styleTableHeader(sheet, 4);

    const successfulOrders = orders.filter((o) => o.status === "delivered");
    const cancelledOrders = orders.filter((o) => o.status === "cancelled");
    const totalRevenue = successfulOrders.reduce(
      (sum, o) => sum + o.totalPrice,
      0
    );
    const avgOrderValue =
      successfulOrders.length > 0 ? totalRevenue / successfulOrders.length : 0;
    const conversionRate =
      orders.length > 0 ? (successfulOrders.length / orders.length) * 100 : 0;

    const kpis = [
      {
        metric: "Total revenue",
        value: totalRevenue,
        format: this.currencyFormat,
      },
      { metric: "Total orders", value: orders.length, format: "#,##0" },
      { metric: "Total customers", value: users.length, format: "#,##0" },
      {
        metric: "Total products in stock",
        value: products.reduce((sum, p) => sum + p.quantity, 0),
        format: "#,##0",
      },
      {
        metric: "Successful orders (Delivered)",
        value: successfulOrders.length,
        format: "#,##0",
      },
      {
        metric: "Cancelled orders (Cancelled)",
        value: cancelledOrders.length,
        format: "#,##0",
      },
      {
        metric: "Successful conversion rate",
        value: conversionRate / 100,
        format: "0.00%",
      },
      {
        metric: "Average order value",
        value: avgOrderValue,
        format: this.currencyFormat,
      },
    ];

    kpis.forEach((kpi, idx) => {
      const row = sheet.addRow([kpi.metric, kpi.value]);
      row.getCell(2).numFmt = kpi.format;
      row.eachCell((cell) => this.styleDataCell(cell));
      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF9F9F9" },
          };
        });
      }
    });
  }

  async buildRevenueSheet(sheet, orders) {
    this.setupSheetHeader(sheet, "Revenue Report", 5);

    sheet.getRow(4).values = [
      "Period",
      "Type",
      "Orders",
      "Revenue",
      "Notes",
    ];
    this.styleTableHeader(sheet, 4);

    sheet.columns = [
      { key: "time", width: 25 },
      { key: "type", width: 20 },
      { key: "orders", width: 15 },
      { key: "revenue", width: 25 },
      { key: "note", width: 30 },
    ];

    const successfulOrders = orders.filter((o) => o.status === "delivered");

    // Group by Day
    const byDay = {};
    const byMonth = {};
    const byYear = {};

    successfulOrders.forEach((o) => {
      const d = moment(o.createdAt);
      const dayStr = d.format("DD/MM/YYYY");
      const monthStr = d.format("MM/YYYY");
      const yearStr = d.format("YYYY");

      if (!byDay[dayStr]) byDay[dayStr] = { count: 0, revenue: 0 };
      if (!byMonth[monthStr]) byMonth[monthStr] = { count: 0, revenue: 0 };
      if (!byYear[yearStr]) byYear[yearStr] = { count: 0, revenue: 0 };

      byDay[dayStr].count++;
      byDay[dayStr].revenue += o.totalPrice;

      byMonth[monthStr].count++;
      byMonth[monthStr].revenue += o.totalPrice;

      byYear[yearStr].count++;
      byYear[yearStr].revenue += o.totalPrice;
    });

    const addRows = (data, typeDesc) => {
      Object.keys(data)
        .sort()
        .reverse()
        .forEach((key) => {
          const row = sheet.addRow([
            key,
            typeDesc,
            data[key].count,
            data[key].revenue,
            "",
          ]);
          row.getCell(3).numFmt = "#,##0";
          row.getCell(4).numFmt = this.currencyFormat;
          row.eachCell((cell) => this.styleDataCell(cell));
        });
    };

    addRows(byDay, "By Day");
    addRows(byMonth, "By Month");
    addRows(byYear, "By Year");

    sheet.autoFilter = {
      from: "A4",
      to: "E4",
    };
  }

  async buildOrdersSheet(sheet, orders) {
    this.setupSheetHeader(sheet, "Orders Report", 8);

    sheet.getRow(4).values = [
      "Order Number",
      "Customer",
      "Phone",
      "Order Date",
      "Status",
      "Payment",
      "Payment Status",
      "Total",
    ];
    this.styleTableHeader(sheet, 4);

    sheet.columns = [
      { key: "orderNumber", width: 20 },
      { key: "customer", width: 30 },
      { key: "phone", width: 20 },
      { key: "date", width: 20 },
      { key: "status", width: 20 },
      { key: "paymentGateway", width: 20 },
      { key: "paymentStatus", width: 20 },
      { key: "total", width: 25 },
    ];

    orders.forEach((o) => {
      const row = sheet.addRow([
        o.orderNumber || o._id.toString().slice(-8).toUpperCase(),
        o.shippingAddress?.fullName || o.user?.fullName || "Walk-in Customer",
        o.shippingAddress?.phone || o.user?.phone || "N/A",
        moment(o.createdAt).format("DD/MM/YYYY HH:mm"),
        o.status,
        o.paymentGateway || o.paymentMethod || "COD",
        o.paymentStatus,
        o.totalPrice,
      ]);

      row.getCell(8).numFmt = this.currencyFormat;
      row.eachCell((cell) => this.styleDataCell(cell));

      // Conditional Formatting logic
      const statusCell = row.getCell(5);
      if (o.status === "cancelled") {
        statusCell.font = { color: { argb: "FFFF0000" }, bold: true };
      } else if (o.status === "delivered") {
        statusCell.font = { color: { argb: "FF008000" }, bold: true };
      }
    });

    sheet.autoFilter = { from: "A4", to: "H4" };
  }

  async buildProductsSheet(sheet, products, orders) {
    this.setupSheetHeader(sheet, "Products Report", 7);

    sheet.getRow(4).values = [
      "Product ID",
      "Product Name",
      "Category",
      "Stock",
      "Sold",
      "Total Revenue",
      "Status",
    ];
    this.styleTableHeader(sheet, 4);

    sheet.columns = [
      { key: "id", width: 30 },
      { key: "name", width: 50 },
      { key: "category", width: 20 },
      { key: "stock", width: 15 },
      { key: "sold", width: 15 },
      { key: "revenue", width: 25 },
      { key: "status", width: 25 },
    ];

    // Compute sales from delivered orders
    const productStats = {};
    products.forEach((p) => {
      productStats[p._id.toString()] = {
        name: p.name,
        category: p.category,
        stock: p.quantity,
        sold: 0,
        revenue: 0,
      };
    });

    orders
      .filter((o) => o.status === "delivered")
      .forEach((o) => {
        o.products.forEach((op) => {
          if (op.product && productStats[op.product._id.toString()]) {
            productStats[op.product._id.toString()].sold += op.quantity;
            productStats[op.product._id.toString()].revenue +=
              op.quantity * op.price;
          }
        });
      });

    const statsArray = Object.keys(productStats).map((id) => ({
      id,
      ...productStats[id],
    }));
    statsArray.sort((a, b) => b.sold - a.sold); // Sort by sold descending

    statsArray.forEach((p) => {
      let status = "Normal";
      if (p.stock <= 0) status = "Out of stock";
      else if (p.stock < 10) status = "Low stock";

      const row = sheet.addRow([
        p.id,
        p.name,
        p.category,
        p.stock,
        p.sold,
        p.revenue,
        status,
      ]);

      row.getCell(4).numFmt = "#,##0";
      row.getCell(5).numFmt = "#,##0";
      row.getCell(6).numFmt = this.currencyFormat;
      row.eachCell((cell) => this.styleDataCell(cell));

      const statusCell = row.getCell(7);
      if (status === "Out of stock") {
        statusCell.font = { color: { argb: "FFFF0000" }, bold: true };
      } else if (status === "Low stock") {
        statusCell.font = { color: { argb: "FFFFA500" }, bold: true };
      }
    });

    sheet.autoFilter = { from: "A4", to: "G4" };
  }

  async buildCustomersSheet(sheet, users, orders) {
    this.setupSheetHeader(sheet, "Customers Report", 6);

    sheet.getRow(4).values = [
      "Email",
      "Customer Name",
      "Phone",
      "Orders",
      "Total Spent",
      "Tier",
    ];
    this.styleTableHeader(sheet, 4);

    sheet.columns = [
      { key: "email", width: 30 },
      { key: "name", width: 30 },
      { key: "phone", width: 20 },
      { key: "ordersCount", width: 15 },
      { key: "spent", width: 25 },
      { key: "tier", width: 20 },
    ];

    const customerStats = {};
    users.forEach((u) => {
      customerStats[u._id.toString()] = {
        email: u.email,
        name: u.fullName,
        phone: u.phone,
        ordersCount: 0,
        spent: 0,
      };
    });

    orders
      .filter((o) => o.status === "delivered")
      .forEach((o) => {
        if (o.user && customerStats[o.user._id.toString()]) {
          customerStats[o.user._id.toString()].ordersCount++;
          customerStats[o.user._id.toString()].spent += o.totalPrice;
        }
      });

    const arr = Object.values(customerStats).sort((a, b) => b.spent - a.spent);

    let totalSpentAll = 0;
    let totalOrdersAll = 0;

    arr.forEach((c) => {
      let tier = "Regular";
      if (c.spent >= 10000000) tier = "VIP (Diamond)";
      else if (c.spent >= 5000000) tier = "Member (Gold)";
      else if (c.spent >= 2000000) tier = "Member (Silver)";

      const row = sheet.addRow([
        c.email,
        c.name,
        c.phone,
        c.ordersCount,
        c.spent,
        tier,
      ]);
      row.getCell(4).numFmt = "#,##0";
      row.getCell(5).numFmt = this.currencyFormat;
      row.eachCell((cell) => this.styleDataCell(cell));

      if (tier.includes("VIP")) {
        row.getCell(6).font = { color: { argb: "FF800080" }, bold: true };
      }

      totalSpentAll += c.spent;
      totalOrdersAll += c.ordersCount;
    });

    // Add total row
    const totalRow = sheet.addRow([
      "TOTAL",
      "",
      "",
      totalOrdersAll,
      totalSpentAll,
      "",
    ]);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF2CC" },
      };
    });
    totalRow.getCell(4).numFmt = "#,##0";
    totalRow.getCell(5).numFmt = this.currencyFormat;

    sheet.autoFilter = { from: "A4", to: "F4" };
  }

  async buildPaymentsSheet(sheet, orders) {
    this.setupSheetHeader(sheet, "Payments Report", 5);

    sheet.getRow(4).values = [
      "Method",
      "Transactions",
      "Successful",
      "Failed / Cancelled",
      "Total (Successful)",
    ];
    this.styleTableHeader(sheet, 4);

    sheet.columns = [
      { key: "method", width: 25 },
      { key: "totalTx", width: 20 },
      { key: "successTx", width: 20 },
      { key: "failTx", width: 20 },
      { key: "revenue", width: 30 },
    ];

    const stats = {
      vnpay: { total: 0, success: 0, fail: 0, revenue: 0 },
      cod: { total: 0, success: 0, fail: 0, revenue: 0 },
      momo: { total: 0, success: 0, fail: 0, revenue: 0 },
      other: { total: 0, success: 0, fail: 0, revenue: 0 },
    };

    orders.forEach((o) => {
      let gw = (o.paymentGateway || o.paymentMethod || "other").toLowerCase();
      if (!["vnpay", "cod", "momo"].includes(gw)) gw = "other";

      stats[gw].total++;
      if (o.status === "cancelled" || o.paymentStatus === "failed") {
        stats[gw].fail++;
      } else if (o.status === "delivered") {
        stats[gw].success++;
        stats[gw].revenue += o.totalPrice;
      } else {
        // pending/shipped... count as success in payment intent if not COD, but for revenue we usually only count delivered.
        if (o.paymentStatus === "paid") {
          stats[gw].success++;
          // We might include it in revenue, but let's stick to delivered for actual confirmed revenue.
        }
      }
    });

    Object.keys(stats).forEach((gw) => {
      const row = sheet.addRow([
        gw.toUpperCase(),
        stats[gw].total,
        stats[gw].success,
        stats[gw].fail,
        stats[gw].revenue,
      ]);
      row.getCell(2).numFmt = "#,##0";
      row.getCell(3).numFmt = "#,##0";
      row.getCell(4).numFmt = "#,##0";
      row.getCell(5).numFmt = this.currencyFormat;
      row.eachCell((cell) => this.styleDataCell(cell));
    });
  }
}

module.exports = new ExcelReportService();
