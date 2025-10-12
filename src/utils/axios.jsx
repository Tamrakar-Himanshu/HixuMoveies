import axios from "axios";

const instance = axios.create({
  baseURL: "/api/",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_AUTH_KEY}`,
  },
});

export default instance;
 