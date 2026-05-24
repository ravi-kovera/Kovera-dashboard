import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '@/services/api';
import { tokenStore } from '@/lib/tokenStore';
import { logger } from '@/lib/logger';

const AuthContext = createContext(null);

function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(
                    (c) =>
                        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2),
                )
                .join(''),
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

function isTokenExpired(token) {
    const payload = decodeJWT(token);
    if (!payload?.exp) return false;
    return payload.exp < Math.floor(Date.now() / 1000);
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
            const stored = sessionStorage.getItem('auth_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const logoutTimerRef = useRef(null);
    const idleTimerRef = useRef(null);
    // Guards the mount-time refresh call against React StrictMode's double-
    // invoke of effects in dev. Without it the second call presents an
    // already-rotated refresh token, ms-auth's reuse-detection fires, and
    // the whole session is revoked on every page load.
    const sessionValidatedRef = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();

    const logout = useCallback(
        (reason) => {
            if (logoutTimerRef.current) {
                clearTimeout(logoutTimerRef.current);
                logoutTimerRef.current = null;
            }
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
                idleTimerRef.current = null;
            }

            // Best-effort revoke on the server. Fire-and-forget — we don't
            // want a network failure to block the local sign-out, and the
            // ms-auth endpoint is a 204 no-op for unknown tokens anyway.
            const refreshToken = tokenStore.getRefresh();
            if (refreshToken) {
                authAPI.logout({ refreshToken }).catch(() => {});
            }

            sessionStorage.removeItem('auth_user');
            tokenStore.clear();
            setUser(null);

            if (reason) logger.warn(`Auto-logout: ${reason}`);

            if (location.pathname !== '/login') {
                navigate('/login', { replace: true });
            }
        },
        [navigate, location.pathname],
    );

    const scheduleAutoLogout = useCallback(
        (jwt) => {
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
            const ms = getTimeUntilExpiry(jwt);
            if (ms <= 0) return;

            // Fire 30s before expiry to silently refresh. If the refresh
            // succeeds the new token is stored and a fresh timer is scheduled.
            // Only fall back to logout if the refresh itself fails.
            const fireAt = Math.max(ms - 30_000, 0);
            logoutTimerRef.current = setTimeout(async () => {
                const refreshToken = tokenStore.getRefresh();
                if (!refreshToken) { logout('token expired, no refresh token'); return; }
                try {
                    const { accessToken, refreshToken: nextRefresh, account } =
                        await authAPI.refresh({ refreshToken });
                    tokenStore.set(accessToken);
                    tokenStore.setRefresh(nextRefresh);
                    if (account) sessionStorage.setItem('auth_user', JSON.stringify(account));
                    scheduleAutoLogout(accessToken);
                } catch {
                    logout('token expired, refresh failed');
                }
            }, fireAt);
        },
        [logout],
    );

    // Idle timeout — 30 minutes of inactivity
    const IDLE_MS = 30 * 60 * 1000;
    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(
            () => logout('idle timeout (30 min)'),
            IDLE_MS,
        );
    }, [logout]);

    useEffect(() => {
        if (!tokenStore.get()) return;
        const events = [
            'mousemove',
            'mousedown',
            'keydown',
            'scroll',
            'touchstart',
        ];
        const handle = () => resetIdleTimer();
        events.forEach((e) =>
            window.addEventListener(e, handle, { passive: true }),
        );
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
        const handle = () => logout('session expired (401)');
        window.addEventListener('kovera:auth:unauthorized', handle);
        return () =>
            window.removeEventListener('kovera:auth:unauthorized', handle);
    }, [logout]);

    // Validate the session on mount by hitting /auth/refresh. This is the
    // closest thing ms-auth offers to a "ping me" endpoint until a /me
    // lands — and rotation is a benign side effect (each page reload
    // shortens the live-token window). Branches:
    //   - no refresh token         → unauthenticated, done.
    //   - refresh succeeds         → store new tokens, keep cached user.
    //   - refresh 401              → token revoked or account disabled → log out.
    //   - network error            → if the cached access token is still
    //                                fresh, trust it (offline tolerance);
    //                                otherwise log out.
    useEffect(() => {
        if (sessionValidatedRef.current) return;
        sessionValidatedRef.current = true;

        const refreshToken = tokenStore.getRefresh();
        if (!refreshToken) {
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const {
                    accessToken,
                    refreshToken: nextRefresh,
                    account,
                } = await authAPI.refresh({ refreshToken });
                tokenStore.set(accessToken);
                tokenStore.setRefresh(nextRefresh);
                sessionStorage.setItem('auth_user', JSON.stringify(account));
                setUser(account);
                scheduleAutoLogout(accessToken);
            } catch (error) {
                const status = error?.response?.status;
                if (status === 401) {
                    logout('refresh rejected on mount');
                    return;
                }
                // Network / 5xx: fall back to local trust if the cached
                // access token is still within its TTL.
                const cached = tokenStore.get();
                if (cached && !isTokenExpired(cached)) {
                    logger.warn(
                        'Refresh unreachable; using cached token until expiry',
                    );
                    scheduleAutoLogout(cached);
                } else {
                    logout('refresh failed and cached token expired');
                }
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Translate an ms-auth error envelope into a UI-friendly message.
    // Falls back to a generic copy when the server is unreachable.
    const messageFromError = (error, fallback) => {
        const envelope = error?.response?.data?.error;
        if (envelope?.message) return envelope.message;
        if (envelope?.code) return envelope.code;
        return fallback;
    };

    // Persist the session payload returned by /otp-login/verify (single
    // identity branch) or /otp-login/claim, and prime the auto-logout timer.
    const persistSession = ({ accessToken, refreshToken, account }) => {
        tokenStore.set(accessToken);
        tokenStore.setRefresh(refreshToken);
        sessionStorage.setItem('auth_user', JSON.stringify(account));
        setUser(account);
        scheduleAutoLogout(accessToken);
    };

    const requestLoginCode = async (email) => {
        try {
            await authAPI.otpLoginStart({ email });
            return { success: true };
        } catch (error) {
            const code = error?.response?.data?.error?.code;
            return {
                success: false,
                code,
                error: messageFromError(
                    error,
                    'Could not send a verification code.',
                ),
            };
        }
    };

    const verifyLoginCode = async (email, code) => {
        try {
            const data = await authAPI.otpLoginVerify({ email, code });
            if (data.kind === 'session') {
                persistSession(data);
                return { success: true, kind: 'session' };
            }
            return {
                success: true,
                kind: 'identitySelection',
                identitySelectionToken: data.identitySelectionToken,
                expiresIn: data.expiresIn,
                identities: data.identities,
            };
        } catch (error) {
            const errCode = error?.response?.data?.error?.code;
            return {
                success: false,
                code: errCode,
                error: messageFromError(
                    error,
                    'The verification code is invalid or has expired.',
                ),
            };
        }
    };

    const claimIdentity = async ({ identitySelectionToken, identityId }) => {
        try {
            const data = await authAPI.otpLoginClaim({
                identitySelectionToken,
                identityId,
            });
            persistSession(data);
            return { success: true };
        } catch (error) {
            const code = error?.response?.data?.error?.code;
            return {
                success: false,
                code,
                error: messageFromError(
                    error,
                    'Could not complete sign-in. Please start over.',
                ),
            };
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated:
            !!tokenStore.get() && !isTokenExpired(tokenStore.get()),
        requestLoginCode,
        verifyLoginCode,
        claimIdentity,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
