import axios from "axios";

// Use different base URLs for development vs production
const isDevelopment = import.meta.env.DEV;
const baseURL = isDevelopment ? "/api/" : "/api/";

const instance = axios.create({
  baseURL: baseURL,
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_AUTH_KEY}`,
  },
});

// Add request interceptor to handle proxy for production
instance.interceptors.request.use(
  (config) => {
    // For production, we'll use the proxy endpoint
    if (!isDevelopment && config.url) {
      const tmdbUrl = `https://api.themoviedb.org/3${config.url}`;
      config.url = `/proxy?url=${encodeURIComponent(tmdbUrl)}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
 