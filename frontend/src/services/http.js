// src/services/http.js
import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000", // use .env if you deploy later
  timeout: 10000,
  withCredentials: true, // keep this true; allows cookies if you ever switch to httpOnly later
});

// attach token before every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// handle responses & errors globally
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    if (status === 401) {
      // means token expired or invalid
      console.warn("JWT expired or invalid, redirecting to login...");
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");
      sessionStorage.setItem("justLoggedOut", "true");

      // optional: prevent loop if you're already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default http;

