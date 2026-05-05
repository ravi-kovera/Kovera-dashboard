/**
 * sessionStorage-backed token store.
 *
 * sessionStorage survives page refresh but is cleared when the tab/browser
 * closes — a better UX trade-off than pure in-memory (lost on refresh) or
 * localStorage (persists indefinitely, higher XSS risk).
 *
 * AuthContext is the sole writer; axios interceptors are the sole readers.
 */

const KEY = "kovera_auth_token";

export const tokenStore = {
  get:   ()        => sessionStorage.getItem(KEY),
  set:   (token)   => sessionStorage.setItem(KEY, token),
  clear: ()        => sessionStorage.removeItem(KEY),
};
