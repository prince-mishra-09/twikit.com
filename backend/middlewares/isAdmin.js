// isAdmin.js — Must be used AFTER isAuth middleware
// Checks: 1) Admin role/email  2) IP Whitelist (if ADMIN_ALLOWED_IPS is set)

export const isAdmin = (req, res, next) => {
    // --- STEP 1: Role / Identity Check ---
    // Check role field OR email match (email selected explicitly in isAuth)
    const adminEmail = process.env.ADMIN_EMAIL || "admin@prince";
    const isAdminUser =
        req.user?.role === "admin" ||
        req.user?.email === "admin@prince" ||
        req.user?.email === adminEmail;

    if (!isAdminUser) {
        console.warn(`[isAdmin] BLOCKED: user=${req.user?.email} role=${req.user?.role} — not admin`);
        return res.status(403).json({
            message: "Forbidden: Admins only.",
            debug: `role=${req.user?.role}, email=${req.user?.email}`,
        });
    }

    // --- STEP 2: IP Whitelist Check (only if env var is configured AND non-empty) ---
    const allowedIPsEnv = process.env.ADMIN_ALLOWED_IPS;

    if (allowedIPsEnv && allowedIPsEnv.trim() !== "") {
        const allowedIPs = allowedIPsEnv.split(",").map((ip) => ip.trim()).filter(Boolean);

        // Get real IP — behind reverse proxy (Render, Vercel) use x-forwarded-for
        const rawIP =
            req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.ip ||
            req.socket?.remoteAddress ||
            "";

        // Strip IPv6-mapped IPv4 prefix (e.g. ::ffff:192.168.1.5 → 192.168.1.5)
        const clientIP = rawIP.replace(/^::ffff:/, "");

        // --- DEBUG LOG FOR REQ.IP AS REQUESTED ---
        console.log(`[isAdmin Debug] IP Check: req.ip="${req.ip}", x-forwarded-for="${req.headers["x-forwarded-for"]}", finalClientIP="${clientIP}"`);

        if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
            console.warn(`[isAdmin] IP BLOCKED: ${clientIP} — not in whitelist [${allowedIPs.join(", ")}]`);
            return res.status(403).json({
                message: "Forbidden: Access denied from your IP address.",
                ip: clientIP,
            });
        }
    }

    // ✅ All checks passed
    next();
};
