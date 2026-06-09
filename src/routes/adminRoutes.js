const express = require("express");
const router = express.Router();

// Controllers
const adminController = require("../controllers/adminController");
const productAdminController = require("../controllers/productAdminController");
const orderAdminController = require("../controllers/orderAdminController");
const customerAdminController = require("../controllers/customerAdminController");
const dashboardController = require("../controllers/dashboardController");
const reportController = require("../controllers/reportController");
const categoryAdminController = require("../controllers/categoryAdminController");

// Middlewares
const authMiddleware = require("../middlewares/auth");
const adminMiddleware = require("../middlewares/admin");
const uploadMiddleware = require("../middlewares/upload");

// ===== Dashboard =====
router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  dashboardController.getDashboardStats
);

// ===== Report statistics =====
router.get(
  "/reports/stats",
  authMiddleware,
  adminMiddleware,
  reportController.getReportStats
);

// ===== Export Excel report =====
router.get(
  "/reports/export/excel",
  authMiddleware,
  adminMiddleware,
  reportController.exportExcelReport
);

// ===== User management =====
router.post(
  "/create-admin",
  authMiddleware,
  adminMiddleware,
  adminController.createAdmin
);
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  adminController.getAllUsers
);
router.put(
  "/update-role",
  authMiddleware,
  adminMiddleware,
  adminController.updateUserRole
);
router.put(
  "/users/:userId",
  authMiddleware,
  adminMiddleware,
  adminController.updateUser
);
router.delete(
  "/delete-user/:userId",
  authMiddleware,
  adminMiddleware,
  adminController.deleteUser
);

// ===== Product management =====
router.get(
  "/products",
  authMiddleware,
  adminMiddleware,
  productAdminController.getProductsAdmin
);
router.post(
  "/products",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware,
  productAdminController.createProduct
);
router.put(
  "/products/:productId",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware,
  productAdminController.updateProduct
);
router.delete(
  "/products/:productId",
  authMiddleware,
  adminMiddleware,
  productAdminController.deleteProduct
);
router.get(
  "/products/stats/all",
  authMiddleware,
  adminMiddleware,
  productAdminController.getProductStats
);

// ===== Category management =====
router.get(
  "/categories",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.getCategoriesAdmin
);
router.post(
  "/categories",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.createCategory
);
router.put(
  "/categories/:categoryId",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.updateCategory
);
router.delete(
  "/categories/:categoryId",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.deleteCategory
);

// ===== Brand management =====
router.get(
  "/brands",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.getBrandsAdmin
);
router.post(
  "/brands",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.createBrand
);
router.put(
  "/brands/:brandId",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.updateBrand
);
router.delete(
  "/brands/:brandId",
  authMiddleware,
  adminMiddleware,
  categoryAdminController.deleteBrand
);

// ===== Order management =====
router.get(
  "/orders",
  authMiddleware,
  adminMiddleware,
  orderAdminController.getAllOrders
);
router.post(
  "/orders",
  authMiddleware,
  adminMiddleware,
  orderAdminController.createOrderAdmin
);
router.get(
  "/orders/:orderId",
  authMiddleware,
  adminMiddleware,
  orderAdminController.getOrderDetail
);
router.put(
  "/orders/:orderId",
  authMiddleware,
  adminMiddleware,
  orderAdminController.updateOrderStatus
);
router.delete(
  "/orders/:orderId",
  authMiddleware,
  adminMiddleware,
  orderAdminController.deleteOrder
);
router.get(
  "/orders/stats/all",
  authMiddleware,
  adminMiddleware,
  orderAdminController.getOrderStats
);

// ===== Customer management =====
router.get(
  "/customers",
  authMiddleware,
  adminMiddleware,
  customerAdminController.getAllCustomers
);
router.get(
  "/customers/:customerId",
  authMiddleware,
  adminMiddleware,
  customerAdminController.getCustomerDetail
);
router.get(
  "/customers/stats/all",
  authMiddleware,
  adminMiddleware,
  customerAdminController.getCustomerStats
);

module.exports = router;
