import createError from "http-errors";
import Project from "../models/Project.js";

const isMember = (p, uid) =>
    String(p.owner) === String(uid) || p.members.some(m => String(m.user) === String(uid));

const canEdit = (p, uid) =>
    String(p.owner) === String(uid) ||
    p.members.some(m => String(m.user) === String(uid) && (m.role === "editor" || m.role === "owner"));

export async function list(req, res, next) {
    try {
        const uid = req.user.id;
        const projects = await Project.find({ $or: [{ owner: uid }, { "members.user": uid }] })
            .sort({ updatedAt: -1 });
        res.json({ data: projects });
    } catch (e) { next(e); }
}

export async function create(req, res, next) {
    try {
        const uid = req.user.id;
        const { name, members = [] } = req.body || {};
        if (!name) throw createError(400, "name es obligatorio");
        const project = await Project.create({
            name,
            owner: uid,
            members: members.map(m => ({ user: m.user, role: m.role || "viewer" }))
        });
        res.status(201).json({ data: project });
    } catch (e) { next(e); }
}

export async function detail(req, res, next) {
    try {
        const p = await Project.findById(req.params.id);
        if (!p) throw createError(404, "Proyecto no encontrado");
        if (!isMember(p, req.user.id)) throw createError(403, "Sin acceso al proyecto");
        res.json({ data: p });
    } catch (e) { next(e); }
}

export async function update(req, res, next) {
    try {
        const p = await Project.findById(req.params.id);
        if (!p) throw createError(404, "Proyecto no encontrado");
        if (!canEdit(p, req.user.id)) throw createError(403, "Sin permiso para editar");

        const { name, members } = req.body || {};
        if (name) p.name = name;
        if (Array.isArray(members)) p.members = members.map(m => ({ user: m.user, role: m.role || "viewer" }));
        await p.save();
        res.json({ data: p });
    } catch (e) { next(e); }
}

export async function remove(req, res, next) {
    try {
        const p = await Project.findById(req.params.id);
        if (!p) throw createError(404, "Proyecto no encontrado");
        if (String(p.owner) !== String(req.user.id)) throw createError(403, "Solo owner puede eliminar");
        await p.deleteOne();
        res.status(204).send();
    } catch (e) { next(e); }
}