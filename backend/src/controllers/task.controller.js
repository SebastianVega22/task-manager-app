// Controlador de Tareas (CRUD)
// - Chequeo de pertenencia y permisos por proyecto (owner/editor/viewer)
// - Registro de actividad (created / updated / status_changed / deleted)
// - En update, agrega projectId a 'changes' para soportar timeline por proyecto

import createError from "http-errors";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { logActivity } from "../utils/audit.js";

/* ===== Helpers de permisos ===== */

// Verifica que el usuario pertenezca al proyecto; retorna el proyecto
async function requireProjectMember(projectId, uid) {
    const p = await Project.findById(projectId);
    if (!p) throw createError(404, "Proyecto no encontrado");

    const isMember =
        String(p.owner) === String(uid) ||
        p.members.some(function(m) { return String(m.user) === String(uid); });

    if (!isMember) throw createError(403, "Sin acceso al proyecto");
    return p;
}

// ¿Puede editar? (owner o editor)
function canEdit(project, uid) {
    return (
        String(project.owner) === String(uid) ||
        project.members.some(function(m) {
            return String(m.user) === String(uid) && (m.role === "editor" || m.role === "owner");
        })
    );
}

// Comparación simple para detectar cambios
function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/* ===== Listar tareas por proyecto ===== */
export async function list(req, res, next) {
    try {
        const projectId = req.params.projectId;
        await requireProjectMember(projectId, req.user.id);

        // filtros opcionales: status, assignedTo
        const q = { projectId: projectId };
        if (req.query && req.query.status) q.status = req.query.status;
        if (req.query && req.query.assignedTo) q.assignedTo = req.query.assignedTo;

        const tasks = await Task.find(q).sort({ createdAt: -1 });
        res.json({ data: tasks });
    } catch (e) { next(e); }
}

/* ===== Crear tarea ===== */
export async function create(req, res, next) {
    try {
        const projectId = req.params.projectId;
        const project = await requireProjectMember(projectId, req.user.id);
        if (!canEdit(project, req.user.id)) throw createError(403, "Sin permiso para crear");

        const body = req.body || {};
        const title = body.title;
        if (!title) throw createError(400, "title es obligatorio");

        const created = await Task.create({
            title: title,
            description: body.description || "",
            priority: body.priority || "medium",
            dueDate: body.dueDate,
            assignedTo: body.assignedTo,
            subtasks: Array.isArray(body.subtasks) ? body.subtasks : [],
            attachments: Array.isArray(body.attachments) ? body.attachments : [],
            projectId: projectId
        });

        await logActivity({
            actor: req.user.id,
            entityType: "task",
            entityId: created._id,
            action: "created",
            changes: { title: created.title, projectId: projectId }
        });

        res.status(201).json({ data: created });
    } catch (e) { next(e); }
}

/* ===== Actualizar tarea ===== */
export async function update(req, res, next) {
    try {
        const id = req.params.id;
        const task = await Task.findById(id);
        if (!task) throw createError(404, "Tarea no encontrada");

        const project = await requireProjectMember(task.projectId, req.user.id);
        if (!canEdit(project, req.user.id)) throw createError(403, "Sin permiso para editar");

        const before = task.toObject();
        const body = req.body || {};

        const FIELDS = [
            "title",
            "description",
            "status",
            "priority",
            "dueDate",
            "assignedTo",
            "subtasks",
            "attachments"
        ];

        for (let i = 0; i < FIELDS.length; i++) {
            const k = FIELDS[i];
            if (Object.prototype.hasOwnProperty.call(body, k)) {
                if (k === "dueDate" && body[k]) {
                    task[k] = new Date(body[k]);
                } else {
                    task[k] = body[k];
                }
            }
        }

        await task.save();

        const changes = {};
        for (let i = 0; i < FIELDS.length; i++) {
            const k = FIELDS[i];
            if (Object.prototype.hasOwnProperty.call(body, k)) {
                if (!deepEqual(before[k], task[k])) {
                    changes[k] = { from: before[k], to: task[k] };
                }
            }
        }

        // Añadimos projectId al registro de cambios para consultas por proyecto
        changes.projectId = task.projectId;

        if (Object.keys(changes).length) {
            const action = (changes.status) ? "status_changed" : "updated";
            await logActivity({
                actor: req.user.id,
                entityType: "task",
                entityId: task._id,
                action: action,
                changes: changes
            });
        }

        res.json({ data: task });
    } catch (e) { next(e); }
}

/* ===== Eliminar tarea ===== */
export async function remove(req, res, next) {
    try {
        const id = req.params.id;
        const task = await Task.findById(id);
        if (!task) throw createError(404, "Tarea no encontrada");

        const project = await requireProjectMember(task.projectId, req.user.id);
        if (!canEdit(project, req.user.id)) throw createError(403, "Sin permiso para eliminar");

        await logActivity({
            actor: req.user.id,
            entityType: "task",
            entityId: task._id,
            action: "deleted",
            changes: {}
        });

        await task.deleteOne();
        res.status(204).send();
    } catch (e) { next(e); }
}