import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }
  const token = auth.slice(7);
  try {
    const secret = process.env.JWT_SECRET || "dev-secret";
    const payload = jwt.verify(token, secret);
    req.user = payload; // disponible en controllers
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}
