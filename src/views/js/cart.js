import { getToken, isAuthenticated, getUserInfo } from "./auth.js";

const API_BASE_URL = "/api";

// ── Cart key per user (prevents sharing between users on the same browser) ──────
// Each user has their own key: cart_<userId>, guests use cart_guest

const getCartKey = () => {
  const user = getUserInfo();
  const userId = user?.id || user?._id;
  return userId ? `cart_${userId}` : "cart_guest";
};

// ── Basic helpers ────────────────────────────────────────────────────────────

export const getCart = () => {
  const cart = localStorage.getItem(getCartKey());
  return cart ? JSON.parse(cart) : [];
};

export const getCartTotal = () => {
  return getCart().reduce((total, item) => total + item.price * item.quantity, 0);
};

export const getCartItemCount = () => {
  return getCart().reduce((count, item) => count + item.quantity, 0);
};

// ── Sync cart from backend to LocalStorage ──────────────────────────────

export const syncCartFromBackend = async () => {
  if (!isAuthenticated()) return getCart();
  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (result.success) {
      const cartKey = getCartKey();
      if (result.cart.length === 0) {
        // Backend empty → clear local, do NOT merge to avoid another user's old cart being merged in
        localStorage.setItem(cartKey, JSON.stringify([]));
        return [];
      }
      // Map backend → frontend format (skip products deleted from DB)
      const validItems = result.cart.filter((item) => item.product != null);
      const cart = validItems.map((item) => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        quantity: item.quantity,
      }));
      localStorage.setItem(cartKey, JSON.stringify(cart));
      return cart;
    }
  } catch (error) {
    console.error("Error syncing cart from backend:", error);
  }
  return getCart();
};

// ── Merge guest local cart to backend (only used on login) ─────────────

export const mergeLocalCartToBackend = async () => {
  if (!isAuthenticated()) return;
  
  // Get guest cart (before login)
  const guestCartStr = localStorage.getItem("cart_guest");
  const guestCart = guestCartStr ? JSON.parse(guestCartStr) : [];
  
  if (guestCart.length === 0) return;
  
  const token = getToken();
  try {
    for (const item of guestCart) {
      await fetch(`${API_BASE_URL}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: item._id, quantity: item.quantity }),
      });
    }
    // Remove guest cart after merge completes
    localStorage.removeItem("cart_guest");
    await syncCartFromBackend();
  } catch (error) {
    console.error("Error merging cart to backend:", error);
  }
};

// ── Add product to cart ────────────────────────────────────────────────────

export const addToCart = async (product, quantity = 1) => {
  if (!isAuthenticated()) {
    alert("Please log in to add products to your cart!");
    window.location.href = "/auth/login";
    return null;
  }

  // Sync to backend first
  try {
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ productId: product._id, quantity }),
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error("Backend error:", result.message);
      alert("Could not add to cart: " + result.message);
      return null;
    }
  } catch (err) {
    console.error("Error syncing add to cart:", err);
    alert("Connection error while adding to cart");
    return null;
  }

  // Update local storage after backend succeeds
  const cartKey = getCartKey();
  const cart = getCart();
  const existingItem = cart.find((item) => item._id === product._id);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
    });
  }
  localStorage.setItem(cartKey, JSON.stringify(cart));

  return cart;
};

// ── Remove product from cart ────────────────────────────────────────────────────

export const removeFromCart = async (productId) => {
  const cartKey = getCartKey();
  const cart = getCart().filter((item) => item._id !== productId);
  localStorage.setItem(cartKey, JSON.stringify(cart));

  if (isAuthenticated()) {
    try {
      await fetch(`${API_BASE_URL}/cart/item/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (err) {
      console.error("Error syncing cart removal:", err);
    }
  }

  return cart;
};

// ── Update quantity ─────────────────────────────────────────────────────────

export const updateCartQuantity = async (productId, quantity) => {
  const cartKey = getCartKey();
  const cart = getCart();
  const item = cart.find((item) => item._id === productId);
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    item.quantity = quantity;
    localStorage.setItem(cartKey, JSON.stringify(cart));

    if (isAuthenticated()) {
      try {
        await fetch(`${API_BASE_URL}/cart/item/${productId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ quantity }),
        });
      } catch (err) {
        console.error("Error syncing quantity update:", err);
      }
    }
  }
  return getCart();
};

// ── Clear entire cart ──────────────────────────────────────────────────────────

export const clearCart = () => {
  localStorage.removeItem(getCartKey());

  if (isAuthenticated()) {
    fetch(`${API_BASE_URL}/cart/clear`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch((err) => console.error("Error syncing cart clear:", err));
  }
};
