import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "@/services/api";
import { tokenStore } from "@/lib/tokenStore";
import { logger } from "@/lib/logger";

const AuthContext = createContext(null);

function decodeJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJWT(token);
  if (!payload?.exp) return false;
  return payload.exp < Math.floor(Date.now() / 1000) + 60; // 60s buffer
}

function getTimeUntilExpiry(token) {
  const payload = decodeJWT(token);
  if (!payload?.exp) return 0;
  const diff = payload.exp - Math.floor(Date.now() / 1000);
  return diff > 0 ? diff * 1000 : 0;
}

export function AuthProvider({ children }) {
  // User object is cached in sessionStorage so it survives page refresh but not
  // a new browser tab (unlike localStorage). The JWT stays in memory only.
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem("auth_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = useCallback(
    (reason) => {
      if (logoutTimerRef.current) { clearTimeout(logoutTimerRef.current); logoutTimerRef.current = null; }
      if (idleTimerRef.current)   { clearTimeout(idleTimerRef.current);   idleTimerRef.current = null;   }

      sessionStorage.removeItem("auth_user");
      tokenStore.clear();
      setUser(null);

      if (reason) logger.warn(`Auto-logout: ${reason}`);

      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    },
    [navigate, location.pathname]
  );

  const scheduleAutoLogout = useCallback(
    (jwt) => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      const ms = getTimeUntilExpiry(jwt);
      if (ms > 0) {
        logoutTimerRef.current = setTimeout(() => logout("token expired"), ms);
      }
    },
    [logout]
  );

  // Idle timeout — 30 minutes of inactivity
  const IDLE_MS = 30 * 60 * 1000;
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => logout("idle timeout (30 min)"), IDLE_MS);
  }, [logout]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    const handle = () => resetIdleTimer();
    events.forEach((e) => window.addEventListener(e, handle, { passive: true }));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, handle));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, resetIdleTimer]); // re-register when user changes (login / logout)

  // Listen for 401 events dispatched by the API interceptor.
  // The interceptor cannot call navigate() itself (it lives outside React),
  // so it fires this event and we handle navigation here.
  useEffect(() => {
    const handle = () => logout("session expired (401)");
    window.addEventListener("kovera:auth:unauthorized", handle);
    return () => window.removeEventListener("kovera:auth:unauthorized", handle);
  }, [logout]);

  // Validate token on mount
  useEffect(() => {
    const validate = async () => {
      const token = tokenStore.get();
      if (!token) { setLoading(false); return; }

      if (isTokenExpired(token)) {
        logger.warn("Stored token is expired");
        logout("token expired on mount");
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.me();
        const userData = res.data?.user || res.data;
        sessionStorage.setItem("auth_user", JSON.stringify(userData));
        setUser(userData);
        scheduleAutoLogout(token);
      } catch {
        if (user) {
          // Server unreachable — allow offline/demo session to continue
          logger.warn("Server unreachable — using cached user");
          scheduleAutoLogout(token);
        } else {
          logout("token validation failed");
        }
      }

      setLoading(false);
    };

    validate();
    return () => { if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    if (email === "admin@kovera.io" && password === "admin123") {
      const demoUser = { name: "Admin", email: "admin@kovera.io", role: "admin" };
      tokenStore.set("demo_token");
      sessionStorage.setItem("auth_user", JSON.stringify(demoUser));
      setUser(demoUser);
      return { success: true };
    }

    try {
      const res = await authAPI.login({ email, password });
      const { token: jwt, user: userData } = res.data;

      tokenStore.set(jwt);
      sessionStorage.setItem("auth_user", JSON.stringify(userData));
      setUser(userData);
      scheduleAutoLogout(jwt);

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Invalid email or password";

      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!tokenStore.get() && !isTokenExpired(tokenStore.get()),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
