// Product API utility functions - Public and Admin

const API_BASE_URL = "/api";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Header with authorization
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ===== PUBLIC PRODUCTS (No Auth Required) =====

// Get all products (public)
export const getPublicProducts = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/products/public?${query}`);
    const data = await response.json();

    // Handle both old format (array) and new format (object with success flag)
    if (Array.isArray(data)) {
      return { success: true, products: data };
    }
    return data;
  } catch (error) {
    return { success: false, message: error.message, products: [] };
  }
};

// Get product by ID (public)
export const getPublicProductById = async (productId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Get products by category (public)
export const getProductsByCategory = async (category) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/category/${category.toLowerCase()}`
    );
    const data = await response.json();
    return Array.isArray(data) ? { success: true, products: data } : data;
  } catch (error) {
    return { success: false, message: error.message, products: [] };
  }
};

// Search products (public)
export const searchProducts = async (keyword) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/public?search=${encodeURIComponent(keyword)}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: error.message, products: [] };
  }
};

// ===== ADMIN PRODUCTS (Auth Required) =====

// Get all products as admin with filters
export const getAdminProducts = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/products?${query}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Create product (admin only)
export const createProduct = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Update product (admin only)
export const updateProduct = async (productId, data) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Delete product (admin only)
export const deleteProduct = async (productId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Get product stats (admin only)
export const getProductStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products/stats/all`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};
