import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return res.status(401).json({ message: "No autorizado" });
    try {
        const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET || "dev-secret");
        req.user = { id: payload.sub, email: payload.email, role: payload.role || "user" };
        next();
    } catch {
        return res.status(401).json({ message: "Token inválido" });
    }
}