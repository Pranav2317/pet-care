const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("./config/passport");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from views folder
app.use(express.static(path.join(__dirname, "views")));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running" });
});

// Routes - API
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/auth", require("./routes/authRoutes")); // Also mount at /auth for direct access
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/payments", require("./routes/vnpayRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
// app.use('/api/customers', require('./routes/customerRoutes'));

// Routes - HTML Pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/homepage/index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/index.html"));
});

app.get("/admin/manageCustomer", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/manageCustomer.html"));
});

app.get("/admin/manageProduct", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/manageProduct.html"));
});

app.get("/admin/manageBrand", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/manageBrand.html"));
});

app.get("/admin/manageCategory", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/manageCategory.html"));
});

app.get("/admin/manageOrder", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/manageOrder.html"));
});

app.get("/admin/report", (req, res) => {
  res.sendFile(path.join(__dirname, "views/admin/report.html"));
});

app.get("/auth/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views/auth/login.html"));
});

app.get("/auth/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views/auth/register.html"));
});

app.get("/product", (req, res) => {
  res.sendFile(path.join(__dirname, "views/product/searchProduct.html"));
});

app.get("/product/detail", (req, res) => {
  res.sendFile(path.join(__dirname, "views/product/productDetail.html"));
});

app.get("/cart", (req, res) => {
  res.sendFile(path.join(__dirname, "views/cart/cart.html"));
});

app.get("/order/checkout", (req, res) => {
  res.sendFile(path.join(__dirname, "views/order/checkout.html"));
});

app.get("/order/detail", (req, res) => {
  res.sendFile(path.join(__dirname, "views/order/orderDetail.html"));
});

app.get("/homepage/categories", (req, res) => {
  res.sendFile(path.join(__dirname, "views/homepage/categories.html"));
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

module.exports = app;
