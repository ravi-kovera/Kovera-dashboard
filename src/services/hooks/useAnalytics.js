import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsAPI } from "@/services/api/analytics";

function defaultDateRange() {
  const to = new Date().toISOString();
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return { from, to };
}

// ═══════════════════════════════════════════════
//  Dashboard
// ═══════════════════════════════════════════════

export function useDashboardSummary(params) {
  return useQuery({
    queryKey: ["analytics", "dashboard", params],
    queryFn: () => analyticsAPI.getDashboard(params).then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false, // stop polling when tab is backgrounded
  });
}

// ═══════════════════════════════════════════════
//  Users
// ═══════════════════════════════════════════════

export function useUserSignups(params) {
  return useQuery({
    queryKey: ["analytics", "user-signups", params],
    queryFn: () => analyticsAPI.getUserSignups(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useOnboardingFunnel() {
  return useQuery({
    queryKey: ["analytics", "onboarding-funnel"],
    queryFn: () => analyticsAPI.getOnboardingFunnel().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useRolesDistribution() {
  return useQuery({
    queryKey: ["analytics", "roles-distribution"],
    queryFn: () => analyticsAPI.getRolesDistribution().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useUserActivity(params) {
  return useQuery({
    queryKey: ["analytics", "user-activity", params],
    queryFn: () => analyticsAPI.getUserActivity(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════
//  Engagement
// ═══════════════════════════════════════════════

export function useImpressions(params) {
  return useQuery({
    queryKey: ["analytics", "impressions", params],
    queryFn: () => analyticsAPI.getImpressions(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useSwipeRates(params) {
  return useQuery({
    queryKey: ["analytics", "swipe-rates", params],
    queryFn: () => analyticsAPI.getSwipeRates(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useFeedDepth() {
  return useQuery({
    queryKey: ["analytics", "feed-depth"],
    queryFn: () => analyticsAPI.getFeedDepth().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useDreamBoard() {
  return useQuery({
    queryKey: ["analytics", "dream-board"],
    queryFn: () => analyticsAPI.getDreamBoard().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function usePreviewConversion(params) {
  return useQuery({
    queryKey: ["analytics", "preview-conversion", params],
    queryFn: () => analyticsAPI.getPreviewConversion(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════
//  Agents
// ═══════════════════════════════════════════════

export function useAgentRegistrations(params) {
  return useQuery({
    queryKey: ["analytics", "agent-registrations", params],
    queryFn: () => analyticsAPI.getAgentRegistrations(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useAgentsByBrokerage() {
  return useQuery({
    queryKey: ["analytics", "agents-brokerage"],
    queryFn: () => analyticsAPI.getAgentsByBrokerage().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useClientRatio() {
  return useQuery({
    queryKey: ["analytics", "client-ratio"],
    queryFn: () => analyticsAPI.getClientRatio().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useLicenseCoverage() {
  return useQuery({
    queryKey: ["analytics", "license-coverage"],
    queryFn: () => analyticsAPI.getLicenseCoverage().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useClientStatus() {
  return useQuery({
    queryKey: ["analytics", "client-status"],
    queryFn: () => analyticsAPI.getClientStatus().then((r) => r.data),
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════
//  Chains
// ═══════════════════════════════════════════════

export function useChainStatus(params) {
  return useQuery({
    queryKey: ["analytics", "chain-status", params],
    queryFn: () => analyticsAPI.getChainStatus(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useChainTypes() {
  return useQuery({
    queryKey: ["analytics", "chain-types"],
    queryFn: () => analyticsAPI.getChainTypes().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useChainSize() {
  return useQuery({
    queryKey: ["analytics", "chain-size"],
    queryFn: () => analyticsAPI.getChainSize().then((r) => r.data),
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════
//  Referrals
// ═══════════════════════════════════════════════

export function useReferralVolume(params) {
  return useQuery({
    queryKey: ["analytics", "referral-volume", params],
    queryFn: () => analyticsAPI.getReferralVolume(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useReferralConversion() {
  return useQuery({
    queryKey: ["analytics", "referral-conversion"],
    queryFn: () => analyticsAPI.getReferralConversion().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useReferralLeaderboard(params) {
  return useQuery({
    queryKey: ["analytics", "referral-leaderboard", params],
    queryFn: () => analyticsAPI.getReferralLeaderboard(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════
//  Listings
// ═══════════════════════════════════════════════

export function useListingsOverview() {
  return useQuery({
    queryKey: ["analytics", "listings-overview"],
    queryFn: () => analyticsAPI.getListingsOverview().then((r) => r.data),
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════
//  Chain Management
// ═══════════════════════════════════════════════

export function useNetworkChains(params) {
  return useQuery({
    queryKey: ["analytics", "network-chains", params],
    queryFn: () => analyticsAPI.getNetworkChains(params).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useAgentRequests() {
  return useQuery({
    queryKey: ["analytics", "agent-requests"],
    queryFn: () => analyticsAPI.getAgentRequests().then((r) => r.data),
    staleTime: 15_000,
  });
}

export function useSendAgentInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => analyticsAPI.sendAgentInvite(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "agent-requests"] });
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "success", title: "Invite Sent", message: "Onboarding invitation sent to agent." },
      }));
    },
    onError: (err) => {
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "error", title: "Error", message: err?.response?.data?.error || "Failed to send invite." },
      }));
    },
  });
}

export function useApproveAgentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => analyticsAPI.approveAgentRequest(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "agent-requests"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "network-chains"] });
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "success", title: "Approved", message: "Agent approved and invitation sent." },
      }));
    },
    onError: () => {
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "error", title: "Error", message: "Failed to approve agent request." },
      }));
    },
  });
}

export function useRejectAgentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => analyticsAPI.rejectAgentRequest(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "agent-requests"] });
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "success", title: "Rejected", message: "Agent request has been rejected." },
      }));
    },
    onError: () => {
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "error", title: "Error", message: "Failed to reject agent request." },
      }));
    },
  });
}

export function useAssignAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, agentEmail }) =>
      analyticsAPI.assignAgent({ userId, agentEmail }).then((r) => r.data),
    onSuccess: (_, { agentEmail }) => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "network-chains"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "agent-requests"] });
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "success", title: "Agent Assigned", message: `Invitation sent to ${agentEmail}.` },
      }));
    },
    onError: () => {
      window.dispatchEvent(new CustomEvent("kovera:toast", {
        detail: { type: "error", title: "Error", message: "Failed to assign agent." },
      }));
    },
  });
}

export { defaultDateRange };
