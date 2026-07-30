import axios from "axios";

const envBaseURL = import.meta.env.VITE_API_URL;
const isLocalhostTarget =
  typeof envBaseURL === "string" &&
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(envBaseURL);

const resolvedBaseURL =
  import.meta.env.PROD && isLocalhostTarget ? "/api" : envBaseURL || "/api";

const API = axios.create({
  baseURL: resolvedBaseURL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  },
);

export default API;
