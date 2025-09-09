// Controlador de Comentarios
// - Valida pertenencia al proyecto de la tarea
// - Crea / lista / elimina comentarios
// - Registra actividad (commented / deleted) incluyendo taskId en 'changes'

import createError from "http-errors";
import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { logActivity } from "../utils/audit.js";

// Helper: asegura que el usuario pertenece al proyecto de la tarea
async function ensureProjectAccessByTask(taskId, uid) {
    const task = await Task.findById(taskId);
    if (!task) throw createError(404, "Tarea no encontrada");

    const p = await Project.findById(task.projectId);
    if (!p) throw createError(404, "Proyecto no encontrado");

    const isMember =
        String(p.owner) === String(uid) ||
        p.members.some(function(m) { return String(m.user) === String(uid); });

    if (!isMember) throw createError(403, "Sin acceso al proyecto");
    return { task: task, project: p };
}

export async function list(req, res, next) {
    try {
        const taskId = req.params.taskId;
        await ensureProjectAccessByTask(taskId, req.user.id);

        const comments = await Comment.find({ taskId: taskId })
            .sort({ createdAt: 1 })
            .populate("author", "username email");

        res.json({ data: comments });
    } catch (e) {
        next(e);
    }
}

export async function create(req, res, next) {
    try {
        const taskId = req.params.taskId;
        const result = await ensureProjectAccessByTask(taskId, req.user.id);
        const task = result.task;

        const content = (req.body && req.body.content) ? req.body.content : "";
        if (!content) throw createError(400, "content es obligatorio");

        const c = await Comment.create({
            content: content,
            taskId: task._id,
            author: req.user.id
        });

        // registra actividad en la TAREA (incluye taskId en 'changes')
        await logActivity({
            actor: req.user.id,
            entityType: "task",
            entityId: task._id,
            action: "commented",
            changes: { commentId: c._id, content: content, taskId: task._id }
        });

        res.status(201).json({ data: c });
    } catch (e) {
        next(e);
    }
}

export async function remove(req, res, next) {
    try {
        const id = req.params.id;
        const c = await Comment.findById(id);
        if (!c) throw createError(404, "Comentario no encontrado");
        if (String(c.author) !== String(req.user.id))
            throw createError(403, "Solo el autor puede eliminar");

        await c.deleteOne();

        // registra actividad de eliminación de comentario (incluye taskId)
        await logActivity({
            actor: req.user.id,
            entityType: "comment",
            entityId: c._id,
            action: "deleted",
            changes: { taskId: c.taskId }
        });

        res.status(204).send();
    } catch (e) {
        next(e);
    }
}