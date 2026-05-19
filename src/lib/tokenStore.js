/**
 * sessionStorage-backed token store.
 *
 * sessionStorage survives page refresh but is cleared when the tab/browser
 * closes — a better UX trade-off than pure in-memory (lost on refresh) or
 * localStorage (persists indefinitely, higher XSS risk).
 *
 * Holds two tokens issued by ms-auth on login:
 *  - access token (JWT) — sent on every authenticated request via the axios
 *    interceptor; short-lived (15 min).
 *  - refresh token (opaque) — only ever sent on /auth/logout (and, when
 *    slice 7 lands, /auth/refresh). Never attached to other requests.
 *
 * AuthContext is the sole writer; axios interceptors / AuthContext are the
 * sole readers.
 */

const ACCESS_KEY = 'kovera_auth_token';
const REFRESH_KEY = 'kovera_refresh_token';

export const tokenStore = {
    get: () => sessionStorage.getItem(ACCESS_KEY),
    set: (token) => sessionStorage.setItem(ACCESS_KEY, token),
    getRefresh: () => sessionStorage.getItem(REFRESH_KEY),
    setRefresh: (token) => sessionStorage.setItem(REFRESH_KEY, token),
    clear: () => {
        sessionStorage.removeItem(ACCESS_KEY);
        sessionStorage.removeItem(REFRESH_KEY);
    },
};
