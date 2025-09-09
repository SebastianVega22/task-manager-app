// Controlador de Actividad (historial)
// - Por tarea: incluye eventos de 'task' y (si los hay) de 'comment' relacionados
// - Por proyecto: agrega actividad de sus tareas y comentarios asociados

import createError from "http-errors";
import Activity from "../models/Activity.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";

function isMember(p, uid) {
    return (
        String(p.owner) === String(uid) ||
        p.members.some(function(m) { return String(m.user) === String(uid); })
    );
}

export async function listByTask(req, res, next) {
    try {
        const taskId = req.params.taskId;

        const task = await Task.findById(taskId);
        if (!task) throw createError(404, "Tarea no encontrada");

        const p = await Project.findById(task.projectId);
        if (!p) throw createError(404, "Proyecto no encontrado");
        if (!isMember(p, req.user.id)) throw createError(403, "Sin acceso");

        // Eventos de la tarea y también eventos de comment que apunten a esta tarea (changes.taskId)
        const items = await Activity.find({
                $or: [
                    { entityType: "task", entityId: task._id },
                    { entityType: "comment", "changes.taskId": task._id }
                ]
            })
            .sort({ createdAt: -1 })
            .limit(200)
            .populate("actor", "username email");

        res.json({ data: items });
    } catch (e) {
        next(e);
    }
}

export async function listByProject(req, res, next) {
    try {
        const projectId = req.params.projectId;

        const p = await Project.findById(projectId);
        if (!p) throw createError(404, "Proyecto no encontrado");
        if (!isMember(p, req.user.id)) throw createError(403, "Sin acceso");

        // IDs de todas las tareas del proyecto
        const taskIds = await Task.find({ projectId: p._id }).distinct("_id");

        // Timeline del proyecto:
        // - Eventos con entityType: "project" (si en el futuro los registras)
        // - Eventos de tareas del proyecto
        // - Eventos de comentarios cuyo changes.taskId pertenezca a tareas del proyecto
        const items = await Activity.find({
                $or: [
                    { entityType: "project", entityId: p._id },
                    { entityType: "task", entityId: { $in: taskIds } },
                    { entityType: "comment", "changes.taskId": { $in: taskIds } }
                ]
            })
            .sort({ createdAt: -1 })
            .limit(200)
            .populate("actor", "username email");

        res.json({ data: items });
    } catch (e) {
        next(e);
    }
}