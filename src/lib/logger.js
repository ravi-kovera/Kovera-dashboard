/**
 * Environment-gated logger.
 * All output is suppressed in production builds (import.meta.env.PROD).
 * Use this everywhere instead of bare console.warn / console.info.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  warn:  (...args) => isDev && console.warn("[Kovera]", ...args),
  info:  (...args) => isDev && console.info("[Kovera]", ...args),
  error: (...args) => isDev && console.error("[Kovera]", ...args),
  debug: (...args) => isDev && console.debug("[Kovera]", ...args),
};
