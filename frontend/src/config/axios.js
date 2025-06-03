// axios.js - Axios instance for API requests
import axios from "axios";

// Create an axios instance with base URL from environment variable
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Request Interceptor: Attach JWT token from localStorage to every request if available
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Export the configured axios instance
export default axiosInstance;