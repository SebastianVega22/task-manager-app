import jwt from "jsonwebtoken";

export async function register(req, res) {
  const { email, password, username } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "email y password son obligatorios" });
  // Stub: aquí luego crearías el usuario en Mongo (hash, etc.)
  const token = jwt.sign({ sub: email, role: "user" }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
  return res.json({ token, user: { id: "u_" + Date.now(), email, username: username || email.split("@")[0], role: "user" } });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "email y password son obligatorios" });
  // Stub: acepta cualquier combinación (dev). En prod: verifica hash.
  const token = jwt.sign({ sub: email, role: "user" }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
  return res.json({ token, user: { id: "u_1", email, username: "user", role: "user" } });
}

export async function me(req, res) {
  // Requiere middleware auth; payload queda en req.user
  return res.json({ id: req.user?.sub || "u_1", email: req.user?.sub, role: req.user?.role || "user" });
}
