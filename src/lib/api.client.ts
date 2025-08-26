import axios from "axios";
import { API_URL } from "../../src/config/api";

const token = localStorage.getItem("token");
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});

export default apiClient;
