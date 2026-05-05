import axios from "axios";
import { tokenStore } from "@/lib/tokenStore";

// Re-export analytics module for convenience
export { analyticsAPI } from "./analytics";

export const api = axios.create({
  baseURL: import.meta.env.VITE_ANALYTICS_BASE_URL || "",
  timeout: 30_000,
  // Content-Type is intentionally omitted here — axios sets it automatically on
  // requests that have a body (POST/PUT/PATCH). Declaring it globally causes
  // GET requests to include the header, which triggers a CORS preflight that
  // the server may not handle for every route.
});

// Request interceptor — attach in-memory auth token (never reads localStorage)
api.interceptors.request.use(
  (config) => {
    const token = tokenStore.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — centralised error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Dispatch an event so AuthContext (inside the React tree) can call navigate()
      // instead of us doing a hard window.location redirect that bypasses React Router.
      window.dispatchEvent(new CustomEvent("kovera:auth:unauthorized"));
    }

    if (status === 403) {
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "error", title: "Access Denied", message: "You do not have permission for this action." },
      }));
    }

    if (status != null && status >= 500) {
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "error", title: "Server Error", message: "An unexpected server error occurred. Please try again." },
      }));
    }

    return Promise.reject(error);
  }
);

// ===== Auth API =====
export const authAPI = {
  login:  (credentials) => api.post("/admin/login", credentials),
  logout: ()            => api.post("/admin/logout"),
  me:     ()            => api.get("/admin/me"),
};

// ===== Users API =====
export const usersAPI = {
  getAll:       (params)       => api.get("/users",            { params }),
  getById:      (id)           => api.get(`/users/${id}`),
  create:       (data)         => api.post("/users",           data),
  update:       (id, data)     => api.put(`/users/${id}`,      data),
  delete:       (id)           => api.delete(`/users/${id}`),
  updateStatus: (id, status)   => api.patch(`/users/${id}/status`, { status }),
};

// ===== Agents API =====
export const agentsAPI = {
  getAll:  (params)       => api.get("/agents",             { params }),
  getById: (id)           => api.get(`/agents/${id}`),
  create:  (data)         => api.post("/agents",            data),
  update:  (id, data)     => api.put(`/agents/${id}`,       data),
  delete:  (id)           => api.delete(`/agents/${id}`),
  verify:  (id, status)   => api.patch(`/agents/${id}/verify`, { status }),
};

// ===== Search API =====
export const searchAPI = {
  query: (params) => api.get("/search", { params }),
};

// ===== Dashboard / Stats API =====
export const statsAPI = {
  getUsersCount:     () => api.get("/stats/users/count"),
  getAgentsCount:    () => api.get("/stats/agents/count"),
  getPropertiesCount:() => api.get("/stats/properties/count"),
  getActiveTrades:   () => api.get("/stats/trades/active"),
  getPropertyLikes:  () => api.get("/stats/properties/likes"),
  getActiveUsers:    () => api.get("/stats/users/active"),
  getAll:            () => api.get("/stats/dashboard"),
};

export const dashboardAPI = {
  getStats:    () => api.get("/dashboard/stats"),
  getActivity: () => api.get("/dashboard/activity"),
};

// ===== Properties API =====
export const propertiesAPI = {
  getAll:       (params)       => api.get("/properties",          { params }),
  getById:      (id)           => api.get(`/properties/${id}`),
  create:       (data)         => api.post("/properties",         data),
  update:       (id, data)     => api.put(`/properties/${id}`,    data),
  delete:       (id)           => api.delete(`/properties/${id}`),
  updateStatus: (id, status)   => api.patch(`/properties/${id}/status`, { status }),
};

// ===== Trades API =====
export const tradesAPI = {
  getAll:  (params)   => api.get("/trades",        { params }),
  getById: (id)       => api.get(`/trades/${id}`),
  create:  (data)     => api.post("/trades",       data),
  update:  (id, data) => api.put(`/trades/${id}`,  data),
};
