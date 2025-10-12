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

export default instance;
 