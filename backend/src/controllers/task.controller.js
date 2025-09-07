import createError from "http-errors";
import Task from "../models/Task.js";
import Project from "../models/Project.js";

const canReadProject = async(projectId, uid) => {
    const p = await Project.findById(projectId);
    if (!p) throw createError(404, "Proyecto no encontrado");
    const ok = String(p.owner) === String(uid) || p.members.some(m => String(m.user) === String(uid));
    if (!ok) throw createError(403, "Sin acceso al proyecto");
    return p;
};

const canWrite = (p, uid) =>
    String(p.owner) === String(uid) ||
    p.members.some(m => String(m.user) === String(uid) && (m.role === "editor" || m.role === "owner"));

export async function list(req, res, next) {
    try {
        const { projectId } = req.params;
        await canReadProject(projectId, req.user.id);
        const tasks = await Task.find({ projectId }).sort({ createdAt: -1 });
        res.json({ data: tasks });
    } catch (e) { next(e); }
}

export async function create(req, res, next) {
    try {
        const { projectId } = req.params;
        const p = await canReadProject(projectId, req.user.id);
        if (!canWrite(p, req.user.id)) throw createError(403, "Sin permiso para crear");
        const { title, description, priority, dueDate, assignedTo, subtasks = [] } = req.body || {};
        if (!title) throw createError(400, "title es obligatorio");
        const created = await Task.create({ title, description, priority, dueDate, assignedTo, subtasks, projectId });
        res.status(201).json({ data: created });
    } catch (e) { next(e); }
}

export async function update(req, res, next) {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) throw createError(404, "Tarea no encontrada");
        const p = await canReadProject(task.projectId, req.user.id);
        if (!canWrite(p, req.user.id)) throw createError(403, "Sin permiso para editar");

        const fields = ["title", "description", "status", "priority", "dueDate", "assignedTo", "subtasks", "attachments"];
        for (const k of fields)
            if (k in req.body) task[k] = req.body[k];
        await task.save();
        res.json({ data: task });
    } catch (e) { next(e); }
}

export async function remove(req, res, next) {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) throw createError(404, "Tarea no encontrada");
        const p = await canReadProject(task.projectId, req.user.id);
        if (!canWrite(p, req.user.id)) throw createError(403, "Sin permiso para eliminar");
        await task.deleteOne();
        res.status(204).send();
    } catch (e) { next(e); }
}