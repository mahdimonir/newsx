import { API_URL } from "@/server";
import axios from "axios";
import { refreshAccessToken } from "./auth";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("Axios Request:", {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
      });
    }
    // Check if running in browser environment
    if (typeof window !== "undefined" && window.localStorage) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Axios Request Error:", error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("Axios Response:", {
        url: response.config.url,
        status: response.status,
      });
    }
    return response;
  },
  async (error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Axios Response Error:", {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    const originalRequest = error.config;

    // Allow retry for 401 only once, skip for DELETE and repeated GET
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.method !== "delete" &&
      !(
        originalRequest.method === "get" &&
        originalRequest.url.includes("/posts")
      )
    ) {
      originalRequest._retry = true;
      try {
        // Ensure refreshAccessToken is called only in browser
        if (typeof window !== "undefined" && window.localStorage) {
          const newAccessToken = await refreshAccessToken();
          localStorage.setItem("token", newAccessToken);
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          if (process.env.NODE_ENV !== "production") {
            console.log(
              "Retrying request with new token:",
              originalRequest.url
            );
          }
          return axiosInstance(originalRequest);
        }
      } catch (err) {
        console.error("Failed to refresh token:", err);
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem("token");
        }
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
