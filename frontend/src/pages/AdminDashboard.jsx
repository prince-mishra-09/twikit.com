import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { UserData } from "../context/UserContext";
import {
    IoShieldCheckmark, IoClose, IoRefresh, IoBug, IoPeople, IoNewspaper,
    IoSparkles, IoClipboard, IoCheckmarkCircle, IoEye, IoEyeOff,
    IoFlame, IoWarning, IoTrash, IoSearch, IoChevronDown
} from "react-icons/io5";

const API = import.meta.env.VITE_API_URL;
const SECRET_KEY = "WAKED_SECRET_99";

// ─── Small helpers ──────────────────────────────────────────────────────────
const Badge = ({ status }) => {
    const colors = {
        open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        resolved: "bg-green-500/20 text-green-400 border-green-500/30",
        active: "bg-green-500/20 text-green-400 border-green-500/30",
        hidden: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        burned: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[status] || "bg-gray-500/20 text-gray-400"}`}>
            {status?.replace("_", " ")}
        </span>
    );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "22" }}>
            <Icon className="text-2xl" style={{ color }} />
        </div>
        <div>
            <p className="text-gray-400 text-xs font-medium">{label}</p>
            <p className="text-white text-2xl font-bold">{value ?? "—"}</p>
        </div>
    </div>
);

// ─── TABS ────────────────────────────────────────────────────────────────────
const TABS = [
    { id: "stats", label: "Overview", icon: IoSparkles },
    { id: "bugs", label: "Bug Tickets", icon: IoBug },
    { id: "users", label: "Users", icon: IoPeople },
    { id: "content", label: "Content", icon: IoNewspaper },
    { id: "audit", label: "Audit Logs", icon: IoClipboard },
];

// ─── AdminDashboard ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading } = UserData();
    const [tab, setTab] = useState("stats");
    const [stats, setStats] = useState(null);
    const [bugs, setBugs] = useState([]);
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [bugFilter, setBugFilter] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [fetching, setFetching] = useState(false);

    // ── Secret key guard ──
    useEffect(() => {
        if (searchParams.get("key") !== SECRET_KEY) {
            navigate("/*", { replace: true });
        }
    }, [searchParams, navigate]);

    // ── Admin check ──
    useEffect(() => {
        if (!loading && user && user.role !== "admin" && user.email !== "admin@prince") {
            navigate("/", { replace: true });
        }
    }, [user, loading, navigate]);

    const api = useCallback(async (method, url, data) => {
        const res = await axios({ method, url: `${API}${url}`, data, withCredentials: true });
        return res.data;
    }, []);

    // ── Fetch stats ──
    const fetchStats = useCallback(async () => {
        try { setStats(await api("get", "/api/admin/stats")); }
        catch { toast.error("Could not load stats"); }
    }, [api]);

    // ── Fetch bugs ──
    const fetchBugs = useCallback(async (status = "") => {
        setFetching(true);
        try {
            const data = await api("get", `/api/admin/bugs${status ? `?status=${status}` : ""}`);
            setBugs(data.bugs || []);
        } catch { toast.error("Could not load bugs"); }
        finally { setFetching(false); }
    }, [api]);

    // ── Fetch users ──
    const fetchUsers = useCallback(async (search = "") => {
        setFetching(true);
        try {
            const data = await api("get", `/api/admin/users${search ? `?search=${search}` : ""}`);
            setUsers(data.users || []);
        } catch { toast.error("Could not load users"); }
        finally { setFetching(false); }
    }, [api]);

    // ── Fetch audit logs ──
    const fetchAuditLogs = useCallback(async () => {
        setFetching(true);
        try {
            const data = await api("get", "/api/admin/audit-logs");
            setAuditLogs(data.logs || []);
        } catch { toast.error("Could not load logs"); }
        finally { setFetching(false); }
    }, [api]);

    useEffect(() => {
        if (!user) return;
        fetchStats();
    }, [user, fetchStats]);

    useEffect(() => {
        if (tab === "bugs") fetchBugs(bugFilter);
        if (tab === "users") fetchUsers(userSearch);
        if (tab === "audit") fetchAuditLogs();
    }, [tab]);

    // ── Actions ──
    const handleMarkFixed = async (bugId) => {
        try {
            await api("post", `/api/admin/bugs/${bugId}/mark-fixed`);
            toast.success("Marked as fixed! User notified 🚀");
            fetchBugs(bugFilter);
            fetchStats();
        } catch (e) { toast.error(e?.response?.data?.message || "Failed"); }
    };

    const handleBugStatusChange = async (bugId, status) => {
        try {
            await api("patch", `/api/admin/bugs/${bugId}/status`, { status });
            toast.success(`Status updated to '${status}'`);
            fetchBugs(bugFilter);
        } catch { toast.error("Failed to update status"); }
    };

    const handleShadowBan = async (userId) => {
        try {
            const res = await api("patch", `/api/admin/users/${userId}/shadow-ban`);
            toast.success(res.message);
            fetchUsers(userSearch);
        } catch { toast.error("Failed"); }
    };

    const handlePostStatus = async (postId, status) => {
        try {
            await api("patch", `/api/admin/posts/${postId}/status`, { status });
            toast.success(`Post → ${status}`);
        } catch { toast.error("Failed"); }
    };

    const handleAuraStatus = async (auraId, status) => {
        try {
            await api("patch", `/api/admin/aurax/${auraId}/status`, { status });
            toast.success(`AuraX → ${status}`);
        } catch { toast.error("Failed"); }
    };

    if (loading || !user) return null;

    return (
        <div className="min-h-screen text-white" style={{ background: "#0d0d0d" }}>
            {/* Top nav */}
            <div className="sticky top-0 z-50 border-b flex items-center gap-3 px-6 py-4" style={{ background: "rgba(13,13,13,0.9)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>
                    <IoShieldCheckmark className="text-xl text-white" />
                </div>
                <div>
                    <h1 className="text-white font-bold text-lg leading-none">Admin Control Center</h1>
                    <p className="text-gray-500 text-xs">xwaked.com • Logged in as {user?.name}</p>
                </div>
                <button onClick={fetchStats} className="ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all" title="Refresh">
                    <IoRefresh className="text-xl" />
                </button>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Tab bar */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
                            style={{
                                background: tab === t.id ? "rgba(168,85,247,0.2)" : "transparent",
                                color: tab === t.id ? "#a855f7" : "#6b7280",
                                border: tab === t.id ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
                            }}
                        >
                            <t.icon className="text-base" />{t.label}
                        </button>
                    ))}
                </div>

                {/* ── OVERVIEW ── */}
                {tab === "stats" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <StatCard label="Open Bugs" value={stats?.open} icon={IoBug} color="#facc15" />
                        <StatCard label="In Progress" value={stats?.inProgress} icon={IoWarning} color="#60a5fa" />
                        <StatCard label="Resolved" value={stats?.resolved} icon={IoCheckmarkCircle} color="#4ade80" />
                        <StatCard label="Total Bugs" value={stats?.total} icon={IoClipboard} color="#a78bfa" />
                        <StatCard label="Burn Rate" value={stats?.burnRate != null ? `${stats.burnRate}%` : "—"} icon={IoFlame} color="#f97316" />
                        <StatCard label="Total Users" value={stats?.totalUsers} icon={IoPeople} color="#38bdf8" />
                    </div>
                )}

                {/* ── BUG TICKETS ── */}
                {tab === "bugs" && (
                    <div>
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {["", "open", "in_progress", "resolved"].map(s => (
                                <button key={s} onClick={() => { setBugFilter(s); fetchBugs(s); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                    style={{
                                        background: bugFilter === s ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.05)",
                                        color: bugFilter === s ? "#a855f7" : "#9ca3af",
                                        border: bugFilter === s ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.08)",
                                    }}>
                                    {s || "All"}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-col gap-3">
                            {fetching && <p className="text-gray-500 text-sm">Loading...</p>}
                            {!fetching && bugs.length === 0 && <p className="text-gray-500 text-sm">No tickets found.</p>}
                            {bugs.map(bug => (
                                <div key={bug._id} className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-orange-400 font-bold text-sm">#{bug.ticketId}</span>
                                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{bug.category}</span>
                                            <Badge status={bug.status} />
                                        </div>
                                        <p className="text-gray-500 text-xs">{new Date(bug.createdAt).toLocaleString()}</p>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed">{bug.description}</p>
                                    {bug.metadata && (
                                        <p className="text-gray-600 text-xs">
                                            📱 {bug.metadata.deviceType} · {bug.metadata.os} · {bug.metadata.browser}
                                            {bug.metadata.urlLocation && ` · 🔗 ${bug.metadata.urlLocation}`}
                                        </p>
                                    )}
                                    {bug.userId && (
                                        <p className="text-gray-500 text-xs">
                                            👤 {bug.userId.name} (@{bug.userId.username})
                                        </p>
                                    )}
                                    <div className="flex gap-2 flex-wrap">
                                        {bug.status !== "resolved" && (
                                            <button onClick={() => handleMarkFixed(bug._id)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-80"
                                                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                                                ✅ Mark as Fixed
                                            </button>
                                        )}
                                        {bug.status === "open" && (
                                            <button onClick={() => handleBugStatusChange(bug._id, "in_progress")}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 hover:bg-blue-500/10 transition-all"
                                                style={{ border: "1px solid rgba(96,165,250,0.3)" }}>
                                                🔵 Set In-Progress
                                            </button>
                                        )}
                                        {bug.status !== "open" && bug.status !== "resolved" && (
                                            <button onClick={() => handleBugStatusChange(bug._id, "open")}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-yellow-400 hover:bg-yellow-500/10 transition-all"
                                                style={{ border: "1px solid rgba(250,204,21,0.3)" }}>
                                                ↩ Reopen
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── USERS ── */}
                {tab === "users" && (
                    <div>
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <IoSearch className="text-gray-500 flex-shrink-0" />
                                <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                    placeholder="Search users by name or username..."
                                    className="bg-transparent text-sm text-white placeholder-gray-600 outline-none flex-1"
                                    onKeyDown={e => e.key === "Enter" && fetchUsers(userSearch)} />
                            </div>
                            <button onClick={() => fetchUsers(userSearch)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.3)" }}>
                                Search
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {fetching && <p className="text-gray-500 text-sm">Loading...</p>}
                            {users.map(u => (
                                <div key={u._id} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    <img src={u.profilePic?.url || "/images/avatar.png"} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-sm truncate">{u.name}</p>
                                        <p className="text-gray-500 text-xs">@{u.username} · {u.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {u.isShadowBanned && <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">Shadow Banned</span>}
                                        {u.role === "admin" && <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">Admin</span>}
                                        <button onClick={() => handleShadowBan(u._id)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                            style={{
                                                background: u.isShadowBanned ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                                                color: u.isShadowBanned ? "#4ade80" : "#f87171",
                                                border: u.isShadowBanned ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
                                            }}>
                                            {u.isShadowBanned ? "Unban" : "Shadow Ban"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── CONTENT ── */}
                {tab === "content" && (
                    <div className="flex flex-col gap-6">
                        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <p className="text-gray-400 text-sm mb-3">
                                💡 Use the <strong>Admin Controls</strong> inside each post/AuraX card directly from the Feed and AuraX pages.
                                Or paste a Post/AuraX ID below to change its status.
                            </p>
                            <ContentStatusChanger type="post" handler={handlePostStatus} />
                            <div className="mt-4 border-t border-white/5 pt-4">
                                <ContentStatusChanger type="aurax" handler={handleAuraStatus} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── AUDIT LOGS ── */}
                {tab === "audit" && (
                    <div className="flex flex-col gap-2">
                        {fetching && <p className="text-gray-500 text-sm">Loading...</p>}
                        {auditLogs.length === 0 && !fetching && <p className="text-gray-500 text-sm">No audit logs yet.</p>}
                        {auditLogs.map(log => (
                            <div key={log._id} className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                    <IoShieldCheckmark className="text-purple-400 text-sm" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-semibold">{log.action}</p>
                                    <p className="text-gray-500 text-xs">
                                        by {log.adminId?.name || "Admin"} · {log.targetType} ·{" "}
                                        {log.details && typeof log.details === "object" &&
                                            Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(", ")}
                                    </p>
                                </div>
                                <p className="text-gray-600 text-xs flex-shrink-0">{new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Content Status Changer Sub-Component ────────────────────────────────────
const ContentStatusChanger = ({ type, handler }) => {
    const [id, setId] = useState("");
    const [status, setStatus] = useState("hidden");

    return (
        <div>
            <p className="text-white font-semibold text-sm mb-2">{type === "post" ? "📰 Feed Post" : "✨ AuraX Post"} Status</p>
            <div className="flex gap-2 flex-wrap">
                <input value={id} onChange={e => setId(e.target.value)} placeholder={`${type === "post" ? "Post" : "AuraX"} ID...`}
                    className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-gray-600 outline-none px-3 py-2 rounded-xl"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }} />
                <select value={status} onChange={e => setStatus(e.target.value)}
                    className="text-sm text-white px-3 py-2 rounded-xl outline-none"
                    style={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <option value="active">active</option>
                    <option value="hidden">hidden</option>
                    <option value="burned">burned</option>
                </select>
                <button
                    onClick={() => { if (!id.trim()) return toast.error("Enter a valid ID"); handler(id.trim(), status); setId(""); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>
                    Apply
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
