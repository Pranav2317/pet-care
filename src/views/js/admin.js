// Admin API utility functions

const API_BASE_URL = "/api";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Header with authorization
const getAuthHeaders = (isFormData = false) => {
  const headers = {
    Authorization: `Bearer ${getToken()}`,
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

// Report Stats API (date-range filtered)
export const getReportStats = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE_URL}/admin/reports/stats${query ? `?${query}` : ""}`,
      { headers: getAuthHeaders() }
    );
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Dashboard API
export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Product Management
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

export const createProduct = async (data) => {
  try {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      method: "POST",
      headers: getAuthHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateProduct = async (productId, data) => {
  try {
    const isFormData = data instanceof FormData;
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(isFormData),
        body: isFormData ? data : JSON.stringify(data),
      }
    );
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

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

export const getAdminCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createCategory = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateCategory = async (categoryId, data) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/categories/${categoryId}`,
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

export const deleteCategory = async (categoryId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/categories/${categoryId}`,
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

export const getAdminBrands = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/brands`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createBrand = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/brands`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateBrand = async (brandId, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/brands/${brandId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteBrand = async (brandId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/brands/${brandId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

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

// Order Management
export const getAdminOrders = async (params = {}) => {
  try {
    const filteredParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        filteredParams[key] = value;
      }
    });
    const query = new URLSearchParams(filteredParams).toString();
    const response = await fetch(
      `${API_BASE_URL}/admin/orders${query ? `?${query}` : ""}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getOrderDetail = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteOrder = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createAdminOrder = async (data) => {
  try {
    const url = (typeof window !== 'undefined' && window.location && window.location.origin) ? `${window.location.origin}${API_BASE_URL}/admin/orders` : `${API_BASE_URL}/admin/orders`;
    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (!response.ok) return { success: false, status: response.status, message: json.message || text, body: json };
      return json;
    } catch (e) {
      // Non-JSON response
      return { success: response.ok, status: response.status, message: text };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getOrderStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/stats/all`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Customer Management
export const getAdminCustomers = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/customers?${query}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getCustomerDetail = async (customerId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/customers/${customerId}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getCustomerStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/customers/stats/all`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// User Management
export const getAllUsers = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/users?${query}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createAdmin = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/create-admin`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Create general user (admin can create customers or admins)
export const createUser = async (data) => {
  try {
    // If creating admin, use admin endpoint which enforces admin role
    if (data.role === "admin") {
      return await createAdmin(data);
    }

    // Otherwise register via auth endpoint (creates customer by default)
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/update-role`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, role }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateUserDetails = async (userId, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/delete-user/${userId}`,
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
