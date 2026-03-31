import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE?.trim();

export const http = axios.create({
  baseURL,
  timeout: 70000
});

let lastWarmAt = 0;
let warmingPromise = null;

export function setAuthToken(token) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
}

function getStoredToken() {
  return localStorage.getItem("token");
}

http.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("adminUser");
      delete http.defaults.headers.common.Authorization;
    }

    return Promise.reject(error);
  }
);

export function shouldWarmApi(maxIdleMs = 10 * 60 * 1000) {
  return Date.now() - lastWarmAt > maxIdleMs;
}

export async function warmUpApi(force = false) {
  if (!baseURL) return;

  if (!force && !shouldWarmApi()) {
    return;
  }

  if (warmingPromise) {
    return warmingPromise;
  }

  warmingPromise = http
    .get("/health", {
      timeout: 65000,
      headers: {
        "Cache-Control": "no-cache"
      }
    })
    .then(() => {
      lastWarmAt = Date.now();
    })
    .catch(() => {
      // ignore warm-up error silently
    })
    .finally(() => {
      warmingPromise = null;
    });

  return warmingPromise;
}