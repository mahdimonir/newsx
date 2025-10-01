import { API_URL } from "@/server";
import axios from "axios";

export const refreshAccessToken = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/refresh-token`,
      {},
      { withCredentials: true }
    );
    const newAccessToken = response.data.accessToken;
    localStorage.setItem("token", newAccessToken); // Update token in localStorage
    return newAccessToken;
  } catch (err) {
    console.error("Failed to refresh access token:", err);
    localStorage.removeItem("token"); // Remove invalid token
    throw err;
  }
};
