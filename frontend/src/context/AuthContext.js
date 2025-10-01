"use client";

import axiosInstance from "@/app/utils/axiosConfig";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          // Fetch user profile to validate token and get user data
          const response = await axiosInstance.get("/users/profile");
          const userData = response.data.data;
          setUser({
            _id: userData._id,
            name: userData.name,
            userName: userData.userName,
            avatar: userData.avatar,
            role: userData.role || "user",
          });
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (err) {
          console.error("Failed to validate token:", err);
          if (err.response?.status === 401) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setUser(null);
          }
        }
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axiosInstance.post("/auth/login", credentials);
      const { accessToken, user: userData } = response.data.data;
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser({
        _id: userData._id,
        name: userData.name,
        userName: userData.userName,
        role: userData.role || "user",
      });
      return response.data;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (err) {
      console.error("Failed to log out:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
