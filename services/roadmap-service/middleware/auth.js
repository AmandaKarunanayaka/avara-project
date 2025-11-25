import jwt from "jsonwebtoken";

export function requireUser(req, res, next) {
    try {
        const auth = req.headers.authorization || "";
        const [scheme, token] = auth.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({ error: "Unauthorized: missing bearer token" });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const rawId = payload.sub || payload.userId || payload.id;
        if (!rawId) {
            return res.status(401).json({ error: "Unauthorized: token missing user id" });
        }

        req.user = {
            id: rawId,
            email: payload.email || undefined,
            roles: payload.roles || undefined,
        };

        return next();
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized: invalid or expired token" });
    }
}
