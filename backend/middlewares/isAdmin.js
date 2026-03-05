// isAdmin.js — Must be used AFTER isAuth middleware
// Checks: 1) Admin role/email  2) IP Whitelist (if ADMIN_ALLOWED_IPS is set)

export const isAdmin = (req, res, next) => {
    // --- STEP 1: Role / Identity Check ---
    const isAdminUser =
        req.user?.role === "admin" || req.user?.email === "admin@prince";

    if (!isAdminUser) {
        return res.status(403).json({ message: "Forbidden: Admins only." });
    }

    // --- STEP 2: IP Whitelist Check (only if env var is configured) ---
    const allowedIPsEnv = process.env.ADMIN_ALLOWED_IPS;

    if (allowedIPsEnv && allowedIPsEnv.trim() !== "") {
        const allowedIPs = allowedIPsEnv.split(",").map((ip) => ip.trim());

        // Get real IP — behind reverse proxy (Render, Vercel) use x-forwarded-for
        const rawIP =
            req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.ip ||
            req.socket?.remoteAddress ||
            "";

        // Strip IPv6-mapped IPv4 prefix (e.g. ::ffff:192.168.1.5 → 192.168.1.5)
        const clientIP = rawIP.replace(/^::ffff:/, "");

        if (!allowedIPs.includes(clientIP)) {
            console.warn(
                `[isAdmin] IP BLOCKED: ${clientIP} — not in whitelist [${allowedIPs.join(", ")}]`
            );
            return res.status(403).json({
                message: "Forbidden: Access denied from your IP address.",
            });
        }
    }

    next();
};
