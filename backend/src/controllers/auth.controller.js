import jwt from "jsonwebtoken";
import createError from "http-errors";
import User from "../models/User.js";

const sign = (user) => {
    const payload = { sub: String(user._id), email: user.email, role: "user" };
    const secret = process.env.JWT_SECRET || "dev-secret";
    return jwt.sign(payload, secret, { expiresIn: "7d" });
};

export async function register(req, res, next) {
    try {
        const { email, password, username } = req.body || {};
        if (!email || !password || !username)
            throw createError(400, "username, email y password son obligatorios");

        const exists = await User.findOne({ email });
        if (exists) throw createError(409, "Email ya registrado");

        const user = await User.create({ email, password, username });
        res.status(201).json({ token: sign(user), user: user.toJSON() });
    } catch (e) { next(e); }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) throw createError(400, "email y password son obligatorios");

        const user = await User.findOne({ email }).select("+password");
        if (!user || !(await user.comparePassword(password)))
            throw createError(401, "Credenciales inválidas");

        res.json({ token: sign(user), user: user.toJSON() });
    } catch (e) { next(e); }
}

export async function me(req, res, next) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) throw createError(404, "Usuario no encontrado");
        res.json(user.toJSON());
    } catch (e) { next(e); }
}