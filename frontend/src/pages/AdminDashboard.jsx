import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { UserData } from "../context/UserContext";

/* ── Google Fonts injection ─────────────────────────────────────────────── */
const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap";
if (!document.head.querySelector('[href*="Plus+Jakarta"]')) document.head.appendChild(FONT_LINK);

const FONT_HEADING = "'Plus Jakarta Sans', 'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";
const FONT_BODY = "'Inter', sans-serif";

// ── Icons ──────────────────────────────────────────────────────────────────
import {
    IoShieldCheckmark, IoBug, IoPeople, IoNewspaper, IoClipboard,
    IoSparkles, IoCheckmarkCircle, IoWarning, IoFlame, IoEye, IoEyeOff,
    IoClose, IoRefresh, IoEllipsisVertical, IoTerminal, IoServer,
    IoPower, IoAlertCircle, IoTrendingUp, IoTime, IoChevronForward,
    IoChatbubble, IoSearch,
} from "react-icons/io5";
import { RiDatabase2Line, RiBugLine, RiSwordLine } from "react-icons/ri";
import { HiOutlineSparkles } from "react-icons/hi2";

const API = import.meta.env.VITE_API_URL;
const SECRET = "WAKED_SECRET_99";

// ── Colour tokens ─────────────────────────────────────────────────────────
const C = {
    bg: "#050505",
    surface: "rgba(255,255,255,0.03)",
    card: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.08)",
    borderPurple: "rgba(139,92,246,0.18)",
    purple: "#a855f7",
    red: "#ef4444",
    green: "#22c55e",
    yellow: "#facc15",
    blue: "#60a5fa",
    orange: "#f97316",
};

// ══════════════════════════════════════════════════════════════════════════
//  TINY HELPERS
// ══════════════════════════════════════════════════════════════════════════

/** Sparkline SVG */
const Sparkline = ({ data = [], color = C.purple }) => {
    if (!data.length) return null;
    const w = 100, h = 32, pad = 2;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => [
        pad + (i / (data.length - 1)) * (w - pad * 2),
        pad + (1 - (v - min) / range) * (h - pad * 2),
    ]);
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8">
            <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${d} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`} fill="url(#sg)" />
            <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

/** Circular Gauge — compact 68×68 with live ms display */
const Gauge = ({ value = 0, max = 500, label = "" }) => {
    const pct = Math.min(value / max, 1);
    const r = 26, cx = 34, cy = 34;
    const circ = 2 * Math.PI * r;
    const dash = circ * (1 - pct);
    const gaugeColor = value < 100 ? C.green : value < 300 ? C.yellow : C.red;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative">
                <svg width="68" height="68" className="-rotate-90">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={gaugeColor} strokeWidth="6"
                        strokeDasharray={circ} strokeDashoffset={dash}
                        strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 4px ${gaugeColor}90)` }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold" style={{ color: gaugeColor, fontFamily: FONT_MONO }}>{value}</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-[11px] font-semibold" style={{ color: gaugeColor, fontFamily: FONT_MONO }}>{value}<span className="text-[9px] text-gray-500 ml-0.5">ms</span></p>
                <p className="text-gray-500 text-[9px] mt-0.5">{label}</p>
            </div>
        </div>
    );
};

/** Status Badge */
const Badge = ({ s }) => {
    const map = {
        open: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", label: "OPEN" },
        in_progress: { bg: "rgba(250,204,21,0.15)", text: "#facc15", label: "IN PROGRESS" },
        resolved: { bg: "rgba(34,197,94,0.15)", text: "#22c55e", label: "FIXED" },
        active: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", label: "ACTIVE" },
        hidden: { bg: "rgba(107,114,128,0.15)", text: "#9ca3af", label: "HIDDEN" },
        burned: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", label: "BURNED" },
    };
    const m = map[s] || map.active;
    return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
            style={{ background: m.bg, color: m.text }}>{m.label}</span>
    );
};

/** Stat Card — icon left · value right · rounded-3xl */
const StatCard = ({ label, value, icon: Icon, color, sub }) => (
    <div className="relative overflow-hidden flex items-center gap-4 px-5 py-4"
        style={{
            background: C.card,
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 24,
            boxShadow: `0 0 40px ${color}14`,
            backdropFilter: "blur(12px)",
        }}>
        {/* Ambient glow blob */}
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
            style={{ background: color, opacity: 0.08, filter: "blur(20px)", transform: "translate(6px,-6px)" }} />
        {/* Icon */}
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}1a`, boxShadow: `0 0 16px ${color}50` }}>
            <Icon className="text-xl" style={{ color }} />
        </div>
        {/* Text */}
        <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-gray-500 mb-0.5"
                style={{ fontFamily: FONT_BODY }}>{label}</p>
            <p className="text-white font-bold text-2xl leading-none"
                style={{ fontFamily: FONT_MONO, color: "#fff" }}>{value ?? "—"}</p>
            {sub && <p className="text-gray-600 text-[10px] mt-1">{sub}</p>}
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════
//  SIDEBAR
// ══════════════════════════════════════════════════════════════════════════
const TABS = [
    { id: "overview", icon: IoTrendingUp, label: "Overview" },
    { id: "bugs", icon: IoBug, label: "Bug Tickets" },
    { id: "content", icon: IoNewspaper, label: "Content" },
    { id: "users", icon: IoPeople, label: "Users" },
    { id: "audit", icon: IoClipboard, label: "Audit Logs" },
    { id: "health", icon: IoServer, label: "System Health" },
];

const Sidebar = ({ tab, setTab, bugCount }) => (
    <div className="fixed left-0 top-0 h-screen flex flex-col items-center py-6 gap-2 z-50"
        style={{
            width: 64,
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(255,255,255,0.07)",
        }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", boxShadow: "0 0 20px #a855f766, 0 0 40px #a855f733" }}>
            <IoShieldCheckmark className="text-white text-lg" />
        </div>
        {TABS.map(t => (
            <div key={t.id} className="relative group w-full flex justify-center">
                <button onClick={() => setTab(t.id)}
                    title={t.label}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative"
                    style={{
                        background: tab === t.id ? "rgba(168,85,247,0.18)" : "transparent",
                        boxShadow: tab === t.id
                            ? "0 0 14px rgba(168,85,247,0.7), 0 0 28px rgba(168,85,247,0.3)"
                            : "none",
                        color: tab === t.id ? C.purple : "rgba(255,255,255,0.25)",
                    }}>
                    <t.icon className="text-xl" />
                    {t.id === "bugs" && bugCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                            style={{ background: C.red, boxShadow: `0 0 8px ${C.red}80` }}>
                            {bugCount > 9 ? "9+" : bugCount}
                        </span>
                    )}
                </button>
                {/* Hover label */}
                <div className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap pointer-events-none
                    opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 z-50"
                    style={{ background: "rgba(20,15,35,0.95)", border: "1px solid rgba(168,85,247,0.25)", boxShadow: "0 4px 20px rgba(0,0,0,0.6)", fontFamily: FONT_BODY }}>
                    {t.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(20,15,35,0.95)]" />
                </div>
            </div>
        ))}
    </div>
);

// ══════════════════════════════════════════════════════════════════════════
//  LIVE SYSTEM AUDIT FEED
// ══════════════════════════════════════════════════════════════════════════
const ACTION_COLOR_MAP = {
    SHADOW_BAN_USER: { color: C.red, emoji: "🚫" },
    UNBAN_USER: { color: C.green, emoji: "✅" },
    MARK_BUG_FIXED: { color: C.green, emoji: "🐛" },
    CHANGE_BUG_STATUS: { color: C.yellow, emoji: "🔄" },
    CHANGE_POST_STATUS: { color: C.blue, emoji: "📄" },
    CHANGE_AURAX_STATUS: { color: C.purple, emoji: "✨" },
    MAINTENANCE_ON: { color: C.red, emoji: "⚠️" },
    MAINTENANCE_OFF: { color: C.green, emoji: "🟢" },
};

const LiveAuditFeed = ({ api }) => {
    const [entries, setEntries] = useState([]);
    const [pulse, setPulse] = useState(false);

    const load = useCallback(async () => {
        try {
            const d = await api("get", "/api/admin/audit-logs");
            setEntries((d.logs || []).slice(0, 8));
            setPulse(true);
            setTimeout(() => setPulse(false), 600);
        } catch { /* silent */ }
    }, [api]);

    useEffect(() => {
        load();
        const id = setInterval(load, 30000);
        return () => clearInterval(id);
    }, [load]);

    const fmt = (iso) => new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });

    return (
        <div className="rounded-3xl p-5 flex flex-col gap-3"
            style={{ background: C.card, border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
                        style={{ boxShadow: "0 0 6px #22c55e" }} />
                    <h3 className="text-white text-sm font-bold" style={{ fontFamily: FONT_HEADING }}>Live System Audit</h3>
                </div>
                <button onClick={load} className="text-gray-600 hover:text-purple-400 transition-colors p-1 rounded-lg hover:bg-white/5">
                    <IoRefresh className={`text-sm ${pulse ? "animate-spin" : ""}`} />
                </button>
            </div>
            {entries.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-4">No recent actions yet.</p>
            ) : (
                <div className="flex flex-col gap-1">
                    {entries.map((log, i) => {
                        const meta = ACTION_COLOR_MAP[log.action] || { color: C.purple, emoji: "⚡" };
                        const label = log.action.replace(/_/g, " ").toLowerCase();
                        return (
                            <div key={log._id || i}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-white/5"
                                style={{ borderLeft: `2px solid ${meta.color}70` }}>
                                <span className="text-[10px] flex-shrink-0 tabular-nums" style={{ fontFamily: FONT_MONO, color: "#4b5563" }}>{fmt(log.createdAt)}</span>
                                <span className="text-sm flex-shrink-0">{meta.emoji}</span>
                                <p className="text-xs text-gray-300 flex-1 min-w-0 truncate">
                                    <span className="font-semibold" style={{ color: C.purple }}>@{log.adminId?.username || "admin"}</span>
                                    {" "}<span className="text-gray-500">{label}</span>
                                    {log.details?.targetUser && (
                                        <span className="text-gray-400"> · @{log.details.targetUser}</span>
                                    )}
                                </p>
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.color, boxShadow: `0 0 5px ${meta.color}` }} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  OVERVIEW PAGE
// ══════════════════════════════════════════════════════════════════════════
const Overview = ({ stats, health, api }) => (
    <div className="flex flex-col gap-6">
        {/* 4-col stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Open Bugs" value={stats?.open} icon={IoBug} color={C.red}
                sub={`${stats?.inProgress || 0} in progress`} />
            <StatCard label="Resolved" value={stats?.resolved} icon={IoCheckmarkCircle} color={C.green}
                sub={`Burn rate ${stats?.burnRate || 0}%`} />
            <StatCard label="Total Users" value={stats?.totalUsers} icon={IoPeople} color={C.blue} />
            <StatCard label="AuraX Posts" value={health?.counts?.auras} icon={HiOutlineSparkles} color={C.purple}
                sub="Active in last 24h" />
        </div>

        {/* Monitoring — always side by side */}
        <div className="grid grid-cols-2 gap-4">
            {/* DB Latency */}
            <div className="rounded-3xl p-5" style={{ background: C.card, border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(12px)" }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-5 flex items-center gap-2"
                    style={{ fontFamily: FONT_BODY }}>
                    <RiDatabase2Line className="text-base text-purple-400" /> Database Latency
                </p>
                <div className="flex items-center justify-around gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <Gauge value={health?.dbLatency ?? 0} max={500} label="MongoDB" />
                        <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">MongoDB</p>
                    </div>
                    <div className="w-px h-16 bg-white/5" />
                    <div className="flex flex-col items-center gap-2">
                        <Gauge value={health?.redisLatency ?? 0} max={100} label="Redis" />
                        <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Redis</p>
                    </div>
                </div>
            </div>

            {/* Server Info */}
            <div className="rounded-3xl p-5 flex flex-col gap-2" style={{ background: C.card, border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(12px)" }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2 flex items-center gap-2"
                    style={{ fontFamily: FONT_BODY }}>
                    <IoServer className="text-base text-purple-400" /> Server Info
                </p>
                {health && [
                    ["Uptime", `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`],
                    ["Node.js", health.nodeVersion],
                    ["Environment", health.env],
                    ["Heap Used", `${Math.round(health.memory?.heapUsed / 1024 / 1024)} MB`],
                    ["Total Posts", health.counts?.posts],
                    ["Total Bugs", health.counts?.bugs],
                ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-1.5 border-b border-white/5">
                        <span className="text-gray-500 text-xs" style={{ fontFamily: FONT_BODY }}>{k}</span>
                        <span className="text-white text-xs font-semibold" style={{ fontFamily: FONT_MONO }}>{v}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Live System Audit Feed */}
        <LiveAuditFeed api={api} />
    </div>
);

// ══════════════════════════════════════════════════════════════════════════
//  BUG TICKETS — Kanban + Table
// ══════════════════════════════════════════════════════════════════════════

/** Terminal metadata popup */
const MetadataPopup = ({ meta, ticketId, onClose }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: "#0d0f12", border: "1px solid rgba(34,197,94,0.3)", boxShadow: "0 0 60px rgba(34,197,94,0.1)" }}>
            {/* Terminal title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5"
                style={{ background: "#111418" }}>
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <p className="text-green-400 text-xs font-mono ml-2">ticket://metadata — {ticketId}</p>
                <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white transition-colors">
                    <IoClose />
                </button>
            </div>
            {/* JSON content */}
            <div className="p-5 font-mono text-xs leading-relaxed overflow-auto max-h-80">
                <pre className="text-green-400 whitespace-pre-wrap">
                    {JSON.stringify(meta, null, 2)}
                </pre>
            </div>
        </div>
    </div>
);

const BugTickets = ({ api }) => {
    const [bugs, setBugs] = useState([]);
    const [filter, setFilter] = useState("open");
    const [loading, setLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(null); // bug._id
    const [metaPopup, setMetaPopup] = useState(null);

    const fetch = useCallback(async (status) => {
        setLoading(true);
        try {
            const data = await api("get", `/api/admin/bugs?status=${status}`);
            setBugs(data.bugs || []);
        } catch { toast.error("Failed to load bugs"); }
        finally { setLoading(false); }
    }, [api]);

    useEffect(() => { fetch(filter); }, [filter]);

    const markFixed = async (bug) => {
        try {
            await api("post", `/api/admin/bugs/${bug._id}/mark-fixed`);
            toast.success(`✅ ${bug.ticketId} marked as fixed!`);
            fetch(filter);
        } catch (e) { toast.error(e?.response?.data?.message || "Failed"); }
    };

    const setStatus = async (bug, status) => {
        try {
            await api("patch", `/api/admin/bugs/${bug._id}/status`, { status });
            toast.success("Status updated");
            fetch(filter);
        } catch { toast.error("Failed"); }
    };

    const COLS = [
        { key: "open", label: "Open", color: C.red },
        { key: "in_progress", label: "In Progress", color: C.yellow },
        { key: "resolved", label: "Fixed", color: C.green },
    ];

    return (
        <div>
            {/* Filter tabs */}
            <div className="flex gap-2 mb-5">
                {COLS.map(c => (
                    <button key={c.key} onClick={() => setFilter(c.key)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                        style={{
                            background: filter === c.key ? `${c.color}22` : "rgba(255,255,255,0.04)",
                            color: filter === c.key ? c.color : "#6b7280",
                            border: `1px solid ${filter === c.key ? c.color + "44" : "rgba(255,255,255,0.06)"}`,
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: c.color }} />
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Data table */}
            {loading ? (
                <div className="text-gray-500 text-sm animate-pulse py-8 text-center">Loading tickets...</div>
            ) : bugs.length === 0 ? (
                <div className="text-center py-16">
                    <IoBug className="text-5xl text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No {filter.replace("_", " ")} tickets.</p>
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                                {["Ticket", "Category", "Description", "Reporter", "Date", "Status", "Actions"].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bugs.map((bug, i) => (
                                <tr key={bug._id}
                                    style={{
                                        background: i % 2 === 0 ? C.card : "rgba(22,22,31,0.6)",
                                        borderBottom: `1px solid rgba(255,255,255,0.04)`,
                                    }}>
                                    <td className="px-4 py-3">
                                        <span className="font-bold text-xs" style={{ color: C.orange }}>#{bug.ticketId}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-gray-300">{bug.category}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300 max-w-xs">
                                        <p className="truncate" title={bug.description}>{bug.description}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {bug.userId ? `@${bug.userId.username}` : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                        {new Date(bug.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3"><Badge s={bug.status} /></td>
                                    <td className="px-4 py-3">
                                        <div className="relative">
                                            <button onClick={() => setMenuOpen(menuOpen === bug._id ? null : bug._id)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                                <IoEllipsisVertical />
                                            </button>
                                            {menuOpen === bug._id && (
                                                <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-50 min-w-[180px]"
                                                    style={{ background: "#1e1b2e", border: `1px solid ${C.border}`, boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
                                                    {bug.status !== "resolved" && (
                                                        <button onClick={() => { markFixed(bug); setMenuOpen(null); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-green-400 hover:bg-green-500/10 transition-colors">
                                                            <IoCheckmarkCircle /> Mark as Fixed
                                                        </button>
                                                    )}
                                                    {bug.status === "open" && (
                                                        <button onClick={() => { setStatus(bug, "in_progress"); setMenuOpen(null); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                                                            <IoWarning /> Set In-Progress
                                                        </button>
                                                    )}
                                                    <button onClick={() => { setMetaPopup(bug); setMenuOpen(null); }}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors">
                                                        <IoTerminal /> View Metadata
                                                    </button>
                                                    {bug.status !== "open" && (
                                                        <button onClick={() => { setStatus(bug, "open"); setMenuOpen(null); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition-colors">
                                                            <IoRefresh /> Reopen
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {metaPopup && (
                <MetadataPopup
                    meta={{ ...metaPopup.metadata, description: metaPopup.description, reporter: metaPopup.userId?.username }}
                    ticketId={metaPopup.ticketId}
                    onClose={() => setMetaPopup(null)}
                />
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  CONTENT MODERATION — Dual Column
// ══════════════════════════════════════════════════════════════════════════
const ContentCard = ({ item, type, onAction }) => {
    const [hovered, setHovered] = useState(false);
    const img = type === "post" ? item?.post?.url : item?.media?.url;
    const isVideo = type === "post" ? item?.type === "reel" : item?.type === "video";
    const owner = type === "post" ? item.owner : item.authorId;

    return (
        <div className="rounded-xl overflow-hidden relative group cursor-pointer"
            style={{ background: C.card, border: `1px solid ${item.status !== "active" ? "rgba(239,68,68,0.3)" : C.border}` }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}>
            {/* Media */}
            <div className="relative aspect-square bg-black/30">
                {img ? (
                    isVideo
                        ? <video src={img} className="w-full h-full object-cover" muted playsInline loop />
                        : <img src={img} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-400 text-xs px-3 text-center leading-relaxed line-clamp-4">
                            {item.caption || item.description || "Text post"}
                        </p>
                    </div>
                )}

                {/* Hover overlay */}
                <div className={`absolute inset-0 flex items-center justify-center gap-3 transition-all duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}
                    style={{ background: "rgba(0,0,0,0.75)" }}>
                    <button onClick={() => onAction(item._id, "hidden", type)}
                        className="flex flex-col items-center gap-1 transition-all hover:scale-110 group/btn">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(156,163,175,0.2)", border: "1px solid rgba(156,163,175,0.3)" }}>
                            <IoEyeOff className="text-xl text-gray-300" />
                        </div>
                        <span className="text-gray-300 text-[10px] font-semibold">HIDE</span>
                    </button>
                    <button onClick={() => onAction(item._id, "burned", type)}
                        className="flex flex-col items-center gap-1 transition-all hover:scale-110 group/btn">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", boxShadow: "0 0 20px rgba(239,68,68,0.3)" }}>
                            <IoFlame className="text-xl text-red-400" />
                        </div>
                        <span className="text-red-400 text-[10px] font-semibold">NUKE</span>
                    </button>
                    {item.status !== "active" && (
                        <button onClick={() => onAction(item._id, "active", type)}
                            className="flex flex-col items-center gap-1 transition-all hover:scale-110">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)" }}>
                                <IoEye className="text-xl text-green-400" />
                            </div>
                            <span className="text-green-400 text-[10px] font-semibold">RESTORE</span>
                        </button>
                    )}
                </div>

                {/* Non-active banner */}
                {item.status !== "active" && (
                    <div className="absolute top-2 left-2"><Badge s={item.status} /></div>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 flex items-center gap-2">
                {owner?.profilePic?.url
                    ? <img src={owner.profilePic.url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-6 h-6 rounded-full bg-purple-500/30 flex-shrink-0" />}
                <p className="text-gray-400 text-xs truncate">@{owner?.username || "anon"}</p>
                {owner?.isShadowBanned && (
                    <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-bold">BANNED</span>
                )}
            </div>
        </div>
    );
};

const ContentModeration = ({ api }) => {
    const [posts, setPosts] = useState([]);
    const [auras, setAuras] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [p, a] = await Promise.all([
                api("get", "/api/admin/posts?limit=20"),
                api("get", "/api/admin/aurax?limit=20"),
            ]);
            setPosts(p.posts || []);
            setAuras(a.auras || []);
        } catch { toast.error("Failed to load content"); }
        finally { setLoading(false); }
    }, [api]);

    useEffect(() => { fetchAll(); }, []);

    const handleAction = async (id, status, type) => {
        try {
            const endpoint = type === "post" ? `/api/admin/posts/${id}/status` : `/api/admin/aurax/${id}/status`;
            await api("patch", endpoint, { status });
            const emoji = status === "burned" ? "🔥" : status === "hidden" ? "👁" : "✅";
            toast.success(`${emoji} ${type === "post" ? "Post" : "AuraX"} → ${status}`);
            fetchAll();
        } catch { toast.error("Action failed"); }
    };

    if (loading) return <div className="text-gray-500 text-sm animate-pulse py-16 text-center">Loading content...</div>;

    return (
        <div className="grid grid-cols-2 gap-6">
            {/* Feed Posts */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <IoNewspaper className="text-blue-400" />
                    <h3 className="text-white font-bold">Feed Posts</h3>
                    <span className="text-gray-500 text-xs bg-white/5 px-2 py-0.5 rounded-full">{posts.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {posts.map(p => <ContentCard key={p._id} item={p} type="post" onAction={handleAction} />)}
                </div>
            </div>

            {/* AuraX Posts */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <HiOutlineSparkles className="text-purple-400" />
                    <h3 className="text-white font-bold">AuraX Posts</h3>
                    <span className="text-gray-500 text-xs bg-white/5 px-2 py-0.5 rounded-full">{auras.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {auras.map(a => <ContentCard key={a._id} item={a} type="aurax" onAction={handleAction} />)}
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  USERS — Grid with Shadow Ban Toggle
// ══════════════════════════════════════════════════════════════════════════
const UserGrid = ({ api }) => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async (q = "") => {
        setLoading(true);
        try {
            const data = await api("get", `/api/admin/users?search=${q}&limit=24`);
            setUsers(data.users || []);
        } catch { toast.error("Failed to load users"); }
        finally { setLoading(false); }
    }, [api]);

    useEffect(() => { fetch(); }, []);

    const toggleBan = async (u) => {
        try {
            const res = await api("patch", `/api/admin/users/${u._id}/shadow-ban`);
            toast.success(res.message);
            fetch(search);
        } catch { toast.error("Failed"); }
    };

    return (
        <div>
            <div className="flex gap-3 mb-5">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <IoSearch className="text-gray-500 flex-shrink-0" />
                    <input value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && fetch(search)}
                        placeholder="Search by name or username..."
                        className="bg-transparent text-sm text-white placeholder-gray-600 outline-none flex-1" />
                </div>
                <button onClick={() => fetch(search)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 4px 15px rgba(168,85,247,0.3)" }}>
                    Search
                </button>
            </div>

            {loading ? (
                <div className="text-gray-500 text-sm animate-pulse py-16 text-center">Loading users...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {users.map(u => (
                        <div key={u._id} className="rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden transition-all duration-300"
                            style={{
                                background: C.card,
                                border: u.isShadowBanned
                                    ? "1.5px solid rgba(239,68,68,0.6)"
                                    : `1px solid ${C.border}`,
                                boxShadow: u.isShadowBanned ? "0 0 20px rgba(239,68,68,0.15)" : "none",
                            }}>
                            {/* Shadow ban warning strip */}
                            {u.isShadowBanned && (
                                <div className="absolute top-0 left-0 right-0 py-0.5 text-center text-[9px] font-black tracking-widest text-red-400"
                                    style={{ background: "rgba(239,68,68,0.2)", borderBottom: "1px solid rgba(239,68,68,0.3)" }}>
                                    ⚠ SHADOW BANNED
                                </div>
                            )}
                            <img src={u.profilePic?.url || "https://cdn-icons-png.flaticon.com/512/1077/1077114.png"}
                                alt={u.name}
                                className={`w-16 h-16 rounded-full object-cover mt-2 ${u.isShadowBanned ? "grayscale opacity-60" : ""}`}
                                style={{ border: u.isShadowBanned ? "2px solid rgba(239,68,68,0.5)" : "2px solid rgba(168,85,247,0.3)" }} />
                            <div className="text-center">
                                <p className="text-white font-semibold text-sm truncate max-w-full">{u.name}</p>
                                <p className="text-gray-500 text-xs">@{u.username}</p>
                            </div>
                            {u.role === "admin" && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
                                    style={{ background: "rgba(168,85,247,0.15)", color: C.purple }}>ADMIN</span>
                            )}
                            {/* Shadow Ban Toggle */}
                            <button onClick={() => toggleBan(u)}
                                className="w-full py-2 rounded-xl text-xs font-bold transition-all duration-300 mt-auto"
                                style={u.isShadowBanned ? {
                                    background: "rgba(34,197,94,0.12)",
                                    color: C.green,
                                    border: "1px solid rgba(34,197,94,0.3)",
                                } : {
                                    background: "rgba(239,68,68,0.08)",
                                    color: C.red,
                                    border: "1px solid rgba(239,68,68,0.2)",
                                }}>
                                {u.isShadowBanned ? "✅ Unban" : "🚫 Shadow Ban"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  AUDIT LOGS
// ══════════════════════════════════════════════════════════════════════════
const ACTION_ICONS = {
    SHADOW_BAN_USER: { icon: RiSwordLine, color: C.red },
    UNBAN_USER: { icon: IoCheckmarkCircle, color: C.green },
    MARK_BUG_FIXED: { icon: IoBug, color: C.green },
    CHANGE_BUG_STATUS: { icon: IoBug, color: C.yellow },
    CHANGE_POST_STATUS: { icon: IoNewspaper, color: C.blue },
    CHANGE_AURAX_STATUS: { icon: HiOutlineSparkles, color: C.purple },
    MAINTENANCE_ON: { icon: IoPower, color: C.red },
    MAINTENANCE_OFF: { icon: IoPower, color: C.green },
};

const AuditLogs = ({ api }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        api("get", "/api/admin/audit-logs")
            .then(d => setLogs(d.logs || []))
            .catch(() => toast.error("Failed to load logs"))
            .finally(() => setLoading(false));
    }, [api]);

    if (loading) return <div className="text-gray-500 text-sm animate-pulse py-16 text-center">Loading logs...</div>;
    if (!logs.length) return (
        <div className="text-center py-16">
            <IoClipboard className="text-5xl text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No audit actions yet.</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-2">
            {logs.map(log => {
                const meta = ACTION_ICONS[log.action] || { icon: IoAlertCircle, color: C.purple };
                const Icon = meta.icon;
                return (
                    <div key={log._id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: C.card, border: `1px solid ${C.border}` }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${meta.color}18` }}>
                            <Icon className="text-sm" style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold">{log.action.replace(/_/g, " ")}</p>
                            <p className="text-gray-500 text-xs truncate">
                                by <span className="text-purple-400">@{log.adminId?.username || "admin"}</span>
                                {log.details && Object.entries(log.details).length > 0 &&
                                    ` · ${Object.entries(log.details).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(", ")}`}
                            </p>
                        </div>
                        <div className="text-gray-600 text-xs flex-shrink-0 flex items-center gap-1">
                            <IoTime className="text-xs" />
                            {new Date(log.createdAt).toLocaleString()}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  SYSTEM HEALTH
// ══════════════════════════════════════════════════════════════════════════
const SystemHealth = ({ health, refresh }) => {
    if (!health) return <div className="text-gray-500 text-sm animate-pulse py-16 text-center">Pinging servers...</div>;
    const { dbLatency, redisLatency, counts, uptime, memory, nodeVersion, env } = health;
    const uptimeH = Math.floor(uptime / 3600);
    const uptimeM = Math.floor((uptime % 3600) / 60);

    const rows = [
        { label: "MongoDB Latency", value: `${dbLatency}ms`, ok: dbLatency < 200 },
        { label: "Redis Latency", value: redisLatency != null ? `${redisLatency}ms` : "N/A", ok: (redisLatency || 0) < 50 },
        { label: "Server Uptime", value: `${uptimeH}h ${uptimeM}m`, ok: true },
        { label: "Node.js Version", value: nodeVersion, ok: true },
        { label: "Environment", value: env, ok: env === "production" },
        { label: "Heap Used", value: `${Math.round(memory?.heapUsed / 1024 / 1024)} MB`, ok: memory?.heapUsed < 400 * 1024 * 1024 },
        { label: "Heap Total", value: `${Math.round(memory?.heapTotal / 1024 / 1024)} MB`, ok: true },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-bold flex items-center gap-2"><IoServer className="text-purple-400" /> Server Status</h3>
                    <button onClick={refresh} className="text-gray-500 hover:text-purple-400 transition-colors p-1">
                        <IoRefresh />
                    </button>
                </div>
                {rows.map(r => (
                    <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">{r.label}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium">{r.value}</span>
                            <div className={`w-2 h-2 rounded-full ${r.ok ? "bg-green-400" : "bg-red-400"}`}
                                style={{ boxShadow: r.ok ? "0 0 6px rgba(34,197,94,0.8)" : "0 0 6px rgba(239,68,68,0.8)" }} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <h3 className="text-white font-bold flex items-center gap-2 mb-2"><RiDatabase2Line className="text-purple-400" /> Database Counts</h3>
                {[
                    { label: "Total Users", value: counts?.users, color: C.blue },
                    { label: "Total Posts", value: counts?.posts, color: C.green },
                    { label: "AuraX Posts", value: counts?.auras, color: C.purple },
                    { label: "Bug Tickets", value: counts?.bugs, color: C.orange },
                ].map(r => (
                    <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">{r.label}</span>
                        <span className="font-bold text-lg" style={{ color: r.color }}>{r.value ?? "—"}</span>
                    </div>
                ))}
                <div className="mt-3 flex gap-3">
                    <Gauge value={health.dbLatency} max={500} />
                    <div className="flex-1 flex flex-col justify-center">
                        <p className="text-gray-400 text-xs mb-1">DB Response</p>
                        <p className="text-white font-bold text-2xl" style={{ color: health.dbLatency < 100 ? C.green : health.dbLatency < 300 ? C.yellow : C.red }}>
                            {health.dbLatency}ms
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                            {health.dbLatency < 100 ? "🟢 Excellent" : health.dbLatency < 300 ? "🟡 Normal" : "🔴 Slow"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading: userLoading } = UserData();
    const [tab, setTab] = useState("overview");
    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [maintenance, setMaintenance] = useState(false);
    const [killLoading, setKillLoading] = useState(false);

    // ── Secret key + admin guard ──
    useEffect(() => {
        if (searchParams.get("key") !== SECRET) navigate("/*", { replace: true });
    }, [searchParams, navigate]);

    useEffect(() => {
        if (!userLoading) {
            if (!user) {
                // If not logged in, redirect to login page
                navigate("/login", { replace: true });
            } else if (user.role !== "admin" && user.email !== "admin@prince") {
                // If logged in but not an admin, redirect to home
                navigate("/", { replace: true });
            }
        }
    }, [user, userLoading, navigate]);

    // ── API helper ──
    const api = useCallback(async (method, url, data) => {
        const res = await axios({ method, url: `${API}${url}`, data, withCredentials: true });
        return res.data;
    }, []);

    // ── Initial fetch ──
    const loadStats = useCallback(() =>
        api("get", "/api/admin/stats").then(setStats).catch(() => { }), [api]);

    const loadHealth = useCallback(() =>
        api("get", "/api/admin/system-health").then(setHealth).catch(() => { }), [api]);

    const loadMaintenance = useCallback(() =>
        api("get", "/api/admin/maintenance").then(d => setMaintenance(d.enabled)).catch(() => { }), [api]);

    useEffect(() => {
        if (!user) return;
        loadStats();
        loadHealth();
        loadMaintenance();
    }, [user, loadStats, loadHealth, loadMaintenance]);

    // ── Kill switch ──
    const handleKillSwitch = async () => {
        setKillLoading(true);
        try {
            const res = await api("post", "/api/admin/maintenance", { enabled: !maintenance });
            setMaintenance(res.enabled);
            toast(res.message, { icon: res.enabled ? "⚠️" : "✅" });
        } catch { toast.error("Failed to toggle maintenance"); }
        finally { setKillLoading(false); }
    };

    if (userLoading || !user) return null;

    const openBugs = stats?.open || 0;

    return (
        <div className="min-h-screen text-white font-sans" style={{ background: C.bg, fontFamily: FONT_BODY }}>
            {/* ── Sidebar ── */}
            <Sidebar tab={tab} setTab={setTab} bugCount={openBugs} />

            {/* ── Main content area ── */}
            <div style={{ marginLeft: 64, minHeight: "100vh" }}>
                {/* ── Top Navbar ── */}
                <div className="sticky top-0 z-40 px-8 py-4"
                    style={{ background: "rgba(5,5,5,0.8)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="max-w-7xl w-[95%] mx-auto flex items-center gap-4">
                        {/* Page title */}
                        <div>
                            <h1 className="text-white font-bold text-lg leading-none tracking-tight" style={{ fontFamily: FONT_HEADING }}>
                                {TABS.find(t => t.id === tab)?.label || "Admin"}
                            </h1>
                            <p className="text-gray-500 text-[11px] mt-1 uppercase tracking-widest font-semibold font-mono" style={{ fontFamily: FONT_MONO }}>XWAKED COMMAND CENTER</p>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* ⚡ Global Kill Switch */}
                        <div className="flex items-center gap-3 bg-white/[0.02] px-3 py-1.5 rounded-2xl border border-white/5 shadow-sm">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold tracking-widest uppercase transition-colors"
                                    style={{ color: maintenance ? C.red : C.green, fontFamily: FONT_BODY }}>
                                    {maintenance ? "ACTIVE" : "NORMAL"}
                                </span>
                                <span className="text-gray-600 text-[9px] font-medium tracking-wide uppercase">Kill Switch</span>
                            </div>
                            <button onClick={handleKillSwitch} disabled={killLoading}
                                className="relative w-12 h-6 rounded-full transition-all duration-300 flex items-center px-0.5"
                                style={{
                                    background: maintenance ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.15)",
                                    border: maintenance ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(34,197,94,0.3)",
                                }}>
                                <div className="w-5 h-5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center transform"
                                    style={{
                                        background: maintenance ? C.red : C.green,
                                        transform: maintenance ? "translateX(24px)" : "translateX(0)",
                                        boxShadow: maintenance ? `0 0 10px ${C.red}` : `0 0 10px ${C.green}`
                                    }}>
                                </div>
                            </button>
                        </div>

                        {/* Admin profile */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl ml-2"
                            style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)" }}>
                            <img src={user?.profilePic?.url || "https://cdn-icons-png.flaticon.com/512/1077/1077114.png"}
                                alt="" className="w-7 h-7 rounded-full object-cover" />
                            <div>
                                <p className="text-purple-300 text-[11px] font-bold leading-none tracking-wide">{user?.name}</p>
                                <p className="text-purple-500/70 text-[9px] uppercase tracking-widest font-semibold mt-0.5" style={{ fontFamily: FONT_MONO }}>SYSADMIN</p>
                            </div>
                            <IoShieldCheckmark className="text-purple-400 text-sm ml-1" />
                        </div>
                    </div>
                </div>

                {/* ── Page content wrapped in wider container ── */}
                <div className="p-8">
                    <div className="max-w-7xl w-[95%] mx-auto">
                        {tab === "overview" && <Overview stats={stats} health={health} api={api} />}
                        {tab === "bugs" && <BugTickets api={api} />}
                        {tab === "content" && <ContentModeration api={api} />}
                        {tab === "users" && <UserGrid api={api} />}
                        {tab === "audit" && <AuditLogs api={api} />}
                        {tab === "health" && <SystemHealth health={health} refresh={loadHealth} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
