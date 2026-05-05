import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from "@/components/ui";
import {
  Link2,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserX,
  RefreshCw,
  Mail,
  GitBranch,
  Layers,
  Search,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  useNetworkChains,
  useAgentRequests,
  useApproveAgentRequest,
  useRejectAgentRequest,
  useAssignAgent,
} from "@/services/hooks/useAnalytics";

/* ── Helpers ── */
function fmtNum(n) {
  if (n == null) return "—";
  return n.toLocaleString();
}

function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CHAIN_TYPE_LABEL = {
  "swing-buyer": "Swing Buyer",
  "simultaneous-close": "Simultaneous Close",
  "direct": "Direct",
  "rotation": "Rotation",
};

const CHAIN_TYPE_COLOR = {
  "swing-buyer": "bg-blue-500/10 text-blue-400",
  "simultaneous-close": "bg-purple-500/10 text-purple-400",
  "direct": "bg-green-500/10 text-green-400",
  "rotation": "bg-amber-500/10 text-amber-400",
};


/* ── Stat Card ── */
function StatCard({ icon: Icon, title, value, accent = "blue", loading }) {
  const ACCENT = {
    blue:   "bg-blue-500/10 text-blue-400",
    green:  "bg-green-500/10 text-green-400",
    amber:  "bg-amber-500/10 text-amber-400",
    purple: "bg-purple-500/10 text-purple-400",
    red:    "bg-red-500/10 text-red-400",
  };
  const cls = ACCENT[accent] || ACCENT.blue;

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="w-16 h-8 skeleton rounded-lg" />
        <div className="w-24 h-4 skeleton rounded" />
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-surface border border-border p-5 space-y-4 hover:border-border-light transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value ?? "—"}</p>
        <p className="text-sm text-muted mt-0.5">{title}</p>
      </div>
    </div>
  );
}

/* ── Confirm Dialog ── */
function ConfirmDialog({ open, title, message, confirmLabel, variant = "danger", onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-navy-900 border border-border shadow-elevated p-6 text-center animate-scale-in">
        <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${variant === "danger" ? "bg-red-500/10" : "bg-green-500/10"}`}>
          {variant === "danger"
            ? <XCircle className="w-7 h-7 text-red-400" />
            : <CheckCircle2 className="w-7 h-7 text-green-400" />}
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-muted mb-6">{message}</p>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button
            variant={variant === "danger" ? "danger" : "default"}
            className="flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Agent Request Row ── */
function AgentRequestRow({ req, onApprove, onReject, approving, rejecting }) {
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject,  setConfirmReject]  = useState(false);

  const typeLabel = CHAIN_TYPE_LABEL[req.chainType] || req.chainType || "—";
  const typeCls   = CHAIN_TYPE_COLOR[req.chainType] || "bg-slate-500/10 text-slate-400";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-0 hover:bg-surface-hover transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
        {(req.userName || req.userId)?.charAt(0)?.toUpperCase() || "?"}
      </div>

      {/* User + agent email */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{req.userName || req.userId}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted truncate">{req.agentEmail}</p>
        </div>
      </div>

      {/* Chain context */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-navy-950 border border-border text-xs">
          <Link2 className="w-3 h-3 text-muted-foreground" />
          <span className="text-white font-medium">{req.networkChainId ?? `#${req.chainId}`}</span>
        </div>
        {req.chainType && (
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${typeCls}`}>{typeLabel}</span>
        )}
        {req.chainStatus && (
          <Badge
            variant={req.chainStatus === "completed" ? "success" : req.chainStatus === "broken" ? "danger" : "outline"}
            className="text-[11px]"
          >
            {req.chainStatus}
          </Badge>
        )}
      </div>

      {/* Timestamp */}
      <p className="hidden md:block text-[11px] text-muted-foreground shrink-0 w-16 text-right">{timeAgo(req.createdAt)}</p>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-500 text-white border-0 h-7 px-3 text-xs"
          onClick={() => setConfirmApprove(true)}
          disabled={approving || rejecting}
        >
          {approving
            ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            : <><CheckCircle2 className="w-3 h-3" /> Approve</>}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 h-7 px-3 text-xs"
          onClick={() => setConfirmReject(true)}
          disabled={approving || rejecting}
        >
          {rejecting
            ? <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
            : <><XCircle className="w-3 h-3" /> Reject</>}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmApprove}
        title="Approve Agent Association"
        message={`Associate agent (${req.agentEmail}) with ${req.networkChainId ?? `Chain #${req.chainId}`} and send a Kovera invitation.`}
        confirmLabel="Approve & Invite"
        variant="success"
        loading={approving}
        onConfirm={() => { onApprove(req.id); setConfirmApprove(false); }}
        onCancel={() => setConfirmApprove(false)}
      />
      <ConfirmDialog
        open={confirmReject}
        title="Reject Request"
        message={`Reject agent request from ${req.agentEmail} for ${req.networkChainId ?? `Chain #${req.chainId}`}?`}
        confirmLabel="Reject"
        variant="danger"
        loading={rejecting}
        onConfirm={() => { onReject(req.id); setConfirmReject(false); }}
        onCancel={() => setConfirmReject(false)}
      />
    </div>
  );
}

/* ── Assign Agent Modal ── */
function AssignAgentModal({ participant, onClose, onAssign, loading }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    onAssign(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-navy-900 border border-border shadow-elevated animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Assign Agent</h3>
              <p className="text-xs text-muted truncate max-w-[180px]">{participant.name || participant.userId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-surface-hover transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Participant context */}
          <div className="p-3 rounded-xl bg-navy-950 border border-border space-y-1">
            {participant.address && (
              <p className="text-xs text-muted flex items-center gap-1.5">
                <Mail className="w-3 h-3 shrink-0" /> {participant.address}
              </p>
            )}
            {participant.role && (
              <p className="text-xs text-muted capitalize">
                Role: <span className="text-white">{participant.role}</span>
              </p>
            )}
          </div>

          {/* Email input */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Agent Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="agent@brokerage.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                autoFocus
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-navy-950 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:input-ring hover:border-border-light transition-all"
              />
            </div>
            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
          </div>

          <p className="text-xs text-muted">
            An invitation to join Kovera will be sent to this address. The agent will be associated with this chain node upon confirmation.
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Button variant="outline" className="flex-1" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button className="flex-1" type="submit" disabled={loading || !email.trim()}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Mail className="w-3.5 h-3.5" /> Assign & Invite</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Role accent colors (border top + avatar bg) ── */
const ROLE_ACCENT = {
  buyer:    { bar: "#3b82f6", avatar: "bg-blue-500/20 text-blue-300",   label: "bg-blue-500/10 text-blue-400"   },
  seller:   { bar: "#22c55e", avatar: "bg-green-500/20 text-green-300", label: "bg-green-500/10 text-green-400" },
  landlord: { bar: "#f59e0b", avatar: "bg-amber-500/20 text-amber-300", label: "bg-amber-500/10 text-amber-400" },
  renter:   { bar: "#a855f7", avatar: "bg-purple-500/20 text-purple-300",label: "bg-purple-500/10 text-purple-400"},
};
const DEFAULT_ACCENT = { bar: "#64748b", avatar: "bg-slate-500/20 text-slate-300", label: "bg-slate-500/10 text-slate-400" };

/* ── Single flow node ── */
function FlowNode({ participant, index, onAssign }) {
  const accent  = ROLE_ACCENT[participant.role] || DEFAULT_ACCENT;
  const agented = participant.hasAgent;
  const pending = !agented && participant.pendingAgentEmail;

  const borderCls = agented
    ? "border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.08)]"
    : pending
      ? "border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.12)]"
      : "border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.10)] hover:border-amber-400/50";

  return (
    <div className={`relative flex flex-col w-48 shrink-0 rounded-xl border bg-navy-900 overflow-hidden transition-all group ${borderCls}`}>
      {/* Role color top bar */}
      <div className="h-1 w-full" style={{ background: accent.bar }} />

      <div className="p-3 flex flex-col gap-2.5">
        {/* Avatar + name */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${accent.avatar}`}>
            {(participant.name || participant.userId || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white leading-tight truncate">
              {participant.name || participant.userId}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Node {index + 1}</p>
          </div>
        </div>

        {/* Address */}
        {participant.address && (
          <p className="text-[10px] text-muted leading-snug line-clamp-2">{participant.address}</p>
        )}

        {/* Pending agent request info */}
        {pending && (
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Clock className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-blue-300 leading-tight">Pending Review</p>
              <p className="text-[10px] text-blue-400/80 truncate">{participant.pendingAgentEmail}</p>
            </div>
          </div>
        )}

        {/* Footer: role + agent status */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/50">
          {participant.role && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${accent.label}`}>
              {participant.role}
            </span>
          )}
          {agented ? (
            <span className="flex items-center gap-0.5 text-[10px] text-green-400 font-medium ml-auto">
              <ShieldCheck className="w-3 h-3" /> Agent
            </span>
          ) : pending ? (
            <span className="flex items-center gap-0.5 text-[10px] text-blue-400 font-medium ml-auto">
              <Clock className="w-3 h-3" /> Pending
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-medium ml-auto">
              <UserX className="w-3 h-3" /> Needed
            </span>
          )}
        </div>

        {/* Assign button — only for unagented, non-pending nodes */}
        {!agented && !pending && (
          <button
            onClick={(e) => { e.stopPropagation(); onAssign(participant); }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold
              bg-amber-500/10 text-amber-400 border border-amber-500/20
              hover:bg-amber-500/20 hover:border-amber-400/40
              transition-all cursor-pointer"
          >
            <UserCheck className="w-3 h-3" /> Assign Agent
          </button>
        )}
      </div>
    </div>
  );
}

/* ── SVG arrow connector ── */
function FlowArrow() {
  return (
    <div className="flex items-center shrink-0 px-1">
      <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
        <line x1="0" y1="8" x2="24" y2="8" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 2" />
        <polyline points="20,4 26,8 20,12" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

/* ── Chain Row (expandable with flow diagram) ── */
function ChainRow({ chain, onAssignNode }) {
  const [expanded, setExpanded] = useState(false);
  const participants   = chain.participants ?? [];
  const needsAgent     = participants.some((p) => !p.hasAgent);
  const pendingCount   = participants.filter((p) => p.pendingAgentEmail).length;
  const agentedCount   = participants.filter((p) => p.hasAgent).length;
  const typeCls        = CHAIN_TYPE_COLOR[chain.chainType] || "bg-slate-500/10 text-slate-400";
  const typeLabel      = CHAIN_TYPE_LABEL[chain.chainType] || chain.chainType || "Unknown";
  const hasPending     = pendingCount > 0;
  const outerBorder    = expanded ? "border-border-light" : hasPending ? "border-blue-500/40" : "border-border";

  /* Progress bar: how many nodes are agented */
  const pct = participants.length > 0 ? (agentedCount / participants.length) * 100 : 0;

  return (
    <div className={`rounded-xl border bg-navy-950 overflow-hidden transition-colors ${outerBorder}`}>
      {/* ── Header row ── */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-hover transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold text-white">{chain.chainId}</span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${typeCls}`}>{typeLabel}</span>
          {hasPending && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-400">
              <Clock className="w-3 h-3" />
              {pendingCount} Pending
            </span>
          )}
          {needsAgent && !hasPending && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-400">
              Needs Agent
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Agent progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-navy-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct === 100 ? "#22c55e" : "#f59e0b",
                }}
              />
            </div>
            <span className="text-[11px] text-muted">{agentedCount}/{participants.length}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted">
            <Layers className="w-3.5 h-3.5" />
            <span>{chain.length} nodes</span>
          </div>
        </div>
      </button>

      {/* ── Flow diagram ── */}
      {expanded && (
        <div className="border-t border-border/60 bg-navy-950/50">
          {/* Chain meta strip */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border/40 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              {participants.length} participants
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              {agentedCount} agented
            </span>
            {(participants.length - agentedCount) > 0 && (
              <span className="flex items-center gap-1.5 text-amber-400">
                <UserX className="w-3.5 h-3.5" />
                {participants.length - agentedCount} need agent
              </span>
            )}
            {/* Full progress */}
            <div className="ml-auto flex items-center gap-2">
              <div className="w-28 h-1.5 rounded-full bg-navy-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: pct === 100 ? "#22c55e" : "#f59e0b",
                  }}
                />
              </div>
              <span className="text-[11px]">{Math.round(pct)}%</span>
            </div>
          </div>

          {/* Scrollable node flow */}
          <div className="overflow-x-auto px-4 py-5">
            <div className="flex items-start" style={{ minWidth: "max-content" }}>
              {participants.map((p, i) => (
                <div key={p.userId || i} className="flex items-center">
                  <FlowNode participant={p} index={i} onAssign={onAssignNode} />
                  {i < participants.length - 1 && <FlowArrow />}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 pb-3 text-[10px] text-muted-foreground flex-wrap">
            {Object.entries(ROLE_ACCENT).map(([role, a]) => (
              <span key={role} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: a.bar }} />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-3">
              <span className="flex items-center gap-1 text-green-400"><ShieldCheck className="w-3 h-3" /> Agented</span>
              <span className="flex items-center gap-1 text-amber-400"><UserX className="w-3 h-3" /> Needs Agent</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const REQS_PER_PAGE   = 6;
const CHAINS_PER_PAGE = 10;

/* ── Pagination bar ── */
function Pagination({ page, totalPages, total, perPage, onPage }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  const pages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3)            return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [page - 2, page - 1, page, page + 1, page + 2];
  }, [page, totalPages]);

  return (
    <div className="flex items-center justify-between pt-3 border-t border-border">
      <p className="text-xs text-muted">
        Showing <span className="text-white font-medium">{from}</span>–<span className="text-white font-medium">{to}</span> of{" "}
        <span className="text-white font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => onPage(1)}><ChevronsLeft className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => onPage(p)}
            className={p === page ? "border border-primary/30 text-primary" : ""}
          >
            {p}
          </Button>
        ))}
        <Button variant="ghost" size="icon-sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}><ChevronRightIcon className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon-sm" disabled={page >= totalPages} onClick={() => onPage(totalPages)}><ChevronsRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   CHAIN MANAGEMENT PAGE
   ══════════════════════════════════════════ */
export default function ChainManagementPage() {
  const [chainSearch, setChainSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [reqPage,   setReqPage]   = useState(1);
  const [chainPage, setChainPage] = useState(1);

  const [assignTarget, setAssignTarget] = useState(null); // participant object

  const requestsQ = useAgentRequests();
  const chainsQ   = useNetworkChains({ minLength: 2 });
  const approve   = useApproveAgentRequest();
  const reject    = useRejectAgentRequest();
  const assign    = useAssignAgent();

  const requests = requestsQ.data?.requests ?? [];
  const chains   = chainsQ.data?.chains     ?? [];

  /* ── Stats ── */
  const pendingCount   = requests.length;
  const totalChains    = chains.length;
  const needsAgentCount = chains.filter((c) => c.participants?.some((p) => !p.hasAgent)).length;
  const fullyAgented    = chains.filter((c) => c.participants?.every((p) => p.hasAgent)).length;

  /* ── Filtered chains ── */
  const filteredChains = useMemo(() => {
    return chains.filter((c) => {
      if (chainSearch) {
        const q = chainSearch.toLowerCase();
        const matchId   = c.chainId?.toLowerCase().includes(q);
        const matchType = (CHAIN_TYPE_LABEL[c.chainType] || c.chainType || "").toLowerCase().includes(q);
        const matchName = c.participants?.some((p) => p.name?.toLowerCase().includes(q));
        if (!matchId && !matchType && !matchName) return false;
      }
      if (typeFilter !== "all" && c.chainType !== typeFilter) return false;
      if (agentFilter === "needs-agent")    return c.participants?.some((p) => !p.hasAgent);
      if (agentFilter === "fully-agented")  return c.participants?.every((p) => p.hasAgent);
      return true;
    });
  }, [chains, chainSearch, typeFilter, agentFilter]);

  /* ── Paginated slices ── */
  const reqTotalPages   = Math.max(1, Math.ceil(requests.length / REQS_PER_PAGE));
  const chainTotalPages = Math.max(1, Math.ceil(filteredChains.length / CHAINS_PER_PAGE));

  const pagedRequests = requests.slice((reqPage - 1) * REQS_PER_PAGE, reqPage * REQS_PER_PAGE);
  const pagedChains   = filteredChains.slice((chainPage - 1) * CHAINS_PER_PAGE, chainPage * CHAINS_PER_PAGE);

  /* ── Reset chain page when filters change ── */
  const handleChainSearch = (v) => { setChainSearch(v); setChainPage(1); };
  const handleTypeFilter  = (v) => { setTypeFilter(v);  setChainPage(1); };
  const handleAgentFilter = (v) => { setAgentFilter(v); setChainPage(1); };
  const clearChainFilters = () => { setTypeFilter("all"); setAgentFilter("all"); setChainSearch(""); setChainPage(1); };

  /* ── Chain type options ── */
  const chainTypes = useMemo(() => {
    const types = [...new Set(chains.map((c) => c.chainType).filter(Boolean))];
    return types;
  }, [chains]);

  const refetchAll = () => {
    requestsQ.refetch();
    chainsQ.refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Chain Management</h1>
          <p className="text-muted mt-1 text-sm">
            Review agent association requests and manage chain participants.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetchAll}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          title="Pending Requests"
          value={fmtNum(pendingCount)}
          accent={pendingCount > 0 ? "amber" : "blue"}
          loading={requestsQ.isLoading}
        />
        <StatCard
          icon={GitBranch}
          title="Total Chains"
          value={fmtNum(totalChains)}
          accent="blue"
          loading={chainsQ.isLoading}
        />
        <StatCard
          icon={UserX}
          title="Need Agent"
          value={fmtNum(needsAgentCount)}
          accent="red"
          loading={chainsQ.isLoading}
        />
        <StatCard
          icon={ShieldCheck}
          title="Fully Agented"
          value={fmtNum(fullyAgented)}
          accent="green"
          loading={chainsQ.isLoading}
        />
      </div>

      {/* ══════════════════════════════════════
          PENDING REQUESTS
          ══════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Pending Agent Requests
            {pendingCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400">
                {pendingCount}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsQ.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl skeleton" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">All caught up</p>
              <p className="text-sm text-muted">No pending agent requests.</p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border">
                <div className="w-8 shrink-0" />
                <p className="flex-1 text-xs font-medium text-muted uppercase tracking-wider">User / Agent</p>
                <p className="hidden sm:block text-xs font-medium text-muted uppercase tracking-wider w-48">Chain</p>
                <p className="hidden md:block text-xs font-medium text-muted uppercase tracking-wider w-16 text-right">Time</p>
                <p className="text-xs font-medium text-muted uppercase tracking-wider w-36 text-right">Actions</p>
              </div>
              <div>
                {pagedRequests.map((req) => (
                  <AgentRequestRow
                    key={req.id}
                    req={req}
                    onApprove={(id) => approve.mutate(id)}
                    onReject={(id) => reject.mutate(id)}
                    approving={approve.isPending && approve.variables === req.id}
                    rejecting={reject.isPending  && reject.variables  === req.id}
                  />
                ))}
              </div>
              <Pagination
                page={reqPage}
                totalPages={reqTotalPages}
                total={requests.length}
                perPage={REQS_PER_PAGE}
                onPage={setReqPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════
          ALL CHAINS
          ══════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            All Chains
            <span className="text-xs text-muted font-normal ml-1">({filteredChains.length} shown)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by chain ID, type, or participant…"
                value={chainSearch}
                onChange={(e) => handleChainSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-8 rounded-xl border border-border bg-navy-900 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:input-ring hover:border-border-light transition-all"
              />
              {chainSearch && (
                <button onClick={() => handleChainSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-border bg-navy-900 text-sm text-white focus:outline-none focus:input-ring transition-all cursor-pointer"
            >
              <option value="all">All Types</option>
              {chainTypes.map((t) => (
                <option key={t} value={t}>{CHAIN_TYPE_LABEL[t] || t}</option>
              ))}
            </select>

            {/* Agent filter */}
            <select
              value={agentFilter}
              onChange={(e) => handleAgentFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-border bg-navy-900 text-sm text-white focus:outline-none focus:input-ring transition-all cursor-pointer"
            >
              <option value="all">All Chains</option>
              <option value="needs-agent">Needs Agent</option>
              <option value="fully-agented">Fully Agented</option>
            </select>

            {(typeFilter !== "all" || agentFilter !== "all" || chainSearch) && (
              <Button variant="ghost" size="sm" onClick={clearChainFilters}>
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>

          {/* Chain list */}
          {chainsQ.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded-xl skeleton" />
              ))}
            </div>
          ) : filteredChains.length === 0 ? (
            <div className="py-12 text-center">
              <GitBranch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-white font-medium mb-1">No chains found</p>
              <p className="text-sm text-muted">Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {pagedChains.map((chain) => (
                  <ChainRow key={chain.chainId} chain={chain} onAssignNode={setAssignTarget} />
                ))}
              </div>
              <Pagination
                page={chainPage}
                totalPages={chainTotalPages}
                total={filteredChains.length}
                perPage={CHAINS_PER_PAGE}
                onPage={setChainPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Assign Agent Modal ── */}
      {assignTarget && (
        <AssignAgentModal
          participant={assignTarget}
          loading={assign.isPending}
          onClose={() => { setAssignTarget(null); assign.reset(); }}
          onAssign={(agentEmail) => {
            assign.mutate(
              { userId: assignTarget.userId, agentEmail },
              { onSuccess: () => setAssignTarget(null) }
            );
          }}
        />
      )}
    </div>
  );
}
