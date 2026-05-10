import axios from "axios";

/**
 * Kovera Analytics API
 * Base path: /api/analytics
 *
 * Uses a dedicated axios instance WITHOUT auth interceptors because the analytics
 * endpoints are publicly readable — attaching a Bearer token would cause the
 * real Kovera API to reject the request with 401 on some routes.
 *
 * Time-series endpoints accept optional query params:
 *   - from        (ISO 8601) — defaults to 30 days ago
 *   - to          (ISO 8601) — defaults to now
 *   - granularity — "day" | "week" | "month" (default: "day")
 */

const analyticsClient = axios.create({
  baseURL: import.meta.env.VITE_ANALYTICS_BASE_URL || "",
  timeout: 30_000,
});

// ===== Dashboard =====
export const analyticsAPI = {
  getDashboard: (params) =>
    analyticsClient.get("/api/analytics/dashboard", { params }),

  // ── Users ──
  getUserSignups: (params) =>
    analyticsClient.get("/api/analytics/users/signups", { params }),

  getOnboardingFunnel: () =>
    analyticsClient.get("/api/analytics/users/onboarding-funnel"),

  getRolesDistribution: () =>
    analyticsClient.get("/api/analytics/users/roles"),

  getUserActivity: (params) =>
    analyticsClient.get("/api/analytics/users/activity", { params }),

  // ── Engagement ──
  getImpressions: (params) =>
    analyticsClient.get("/api/analytics/engagement/impressions", { params }),

  getSwipeRates: (params) =>
    analyticsClient.get("/api/analytics/engagement/swipe-rates", { params }),

  getFeedDepth: () =>
    analyticsClient.get("/api/analytics/engagement/feed-depth"),

  getDreamBoard: () =>
    analyticsClient.get("/api/analytics/engagement/dream-board"),

  getPreviewConversion: (params) =>
    analyticsClient.get("/api/analytics/engagement/preview-conversion", { params }),

  // ── Agents ──
  getAgentRegistrations: (params) =>
    analyticsClient.get("/api/analytics/agents/registrations", { params }),

  getAgentsByBrokerage: () =>
    analyticsClient.get("/api/analytics/agents/brokerages"),

  getClientRatio: () =>
    analyticsClient.get("/api/analytics/agents/client-ratio"),

  getLicenseCoverage: () =>
    analyticsClient.get("/api/analytics/agents/license-coverage"),

  getClientStatus: () =>
    analyticsClient.get("/api/analytics/agents/client-status"),

  // ── Chains ──
  getChainStatus: (params) =>
    analyticsClient.get("/api/analytics/chains/status", { params }),

  getChainTypes: () =>
    analyticsClient.get("/api/analytics/chains/types"),

  getChainSize: () =>
    analyticsClient.get("/api/analytics/chains/size"),

  // ── Referrals ──
  getReferralVolume: (params) =>
    analyticsClient.get("/api/analytics/referrals/volume", { params }),

  getReferralConversion: () =>
    analyticsClient.get("/api/analytics/referrals/conversion"),

  getReferralLeaderboard: (params) =>
    analyticsClient.get("/api/analytics/referrals/leaderboard", { params }),

  // ── Listings ──
  getListingsOverview: () =>
    analyticsClient.get("/api/analytics/listings/overview"),

  // ── Network / Chain Management ──
  getNetworkChains: (params) =>
    analyticsClient.get("/api/analytics/network/chains", { params }),

  getAgentRequests: () =>
    analyticsClient.get("/api/analytics/agent-requests"),

  sendAgentInvite: (id) =>
    analyticsClient.post(`/api/analytics/agent-requests/${id}/invite`),

  approveAgentRequest: (id) =>
    analyticsClient.post(`/api/analytics/agent-requests/${id}/approve`),

  rejectAgentRequest: (id) =>
    analyticsClient.post(`/api/analytics/agent-requests/${id}/reject`),

  assignAgent: (data) =>
    analyticsClient.post("/api/analytics/agent-requests/assign", data),

  // ── Map coordinates ──
  getListingsMap: () =>
    analyticsClient.get("/api/analytics/listings/map"),

  getChainsMap: () =>
    analyticsClient.get("/api/analytics/chains/map"),
};
