const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const cartController = require("../controllers/cartController");

router.use(authMiddleware); // Login required for all cart operations

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.put("/item/:itemId", cartController.updateCartItem);
router.delete("/item/:itemId", cartController.removeFromCart);
router.delete("/clear", cartController.clearCart);

module.exports = router;
