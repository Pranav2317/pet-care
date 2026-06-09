// API utility functions for authentication

const API_BASE_URL = "/api";

// Store token in localStorage
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem("token");
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem("token");
};

// Set user info in localStorage
export const setUserInfo = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

// Get user info from localStorage
export const getUserInfo = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// Register user
export const registerUser = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      setToken(result.token);
      setUserInfo(result.user);
      return { success: true, message: result.message, user: result.user };
    } else {
      return { success: false, message: result.message || "Registration failed" };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Login user
export const loginUser = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      setToken(result.token);
      setUserInfo(result.user);
      return { success: true, message: result.message, user: result.user };
    } else {
      return {
        success: false,
        message: result.message || "Login failed",
      };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    const token = getToken();
    if (!token) return;

    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    removeToken();
    localStorage.removeItem("user");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const token = getToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (result.success) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Redirect to login if not authenticated
export const requireAuth = () => {
  if (!isAuthenticated()) {
    window.location.href = "/auth/login";
  }
};
