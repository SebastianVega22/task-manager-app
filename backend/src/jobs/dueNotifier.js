import cron from "node-cron";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { logActivity } from "../utils/audit.js";

// Job: recordatorios de vencimiento.
// Config (en .env):
//   DUE_NOTIFIER_CRON -> por defecto: "*/15 * * * *"
//   DUE_NOTIFIER_LOOKAHEAD_HOURS -> por defecto: 24
export function initDueNotifier() {
    const cronExpr = process.env.DUE_NOTIFIER_CRON || "*/15 * * * *";
    const lookAhead = Number(process.env.DUE_NOTIFIER_LOOKAHEAD_HOURS || 24);

    cron.schedule(cronExpr, async() => {
        const now = new Date();
        const inH = new Date(now.getTime() + lookAhead * 60 * 60 * 1000);

        try {
            const tasks = await Task.find({
                status: { $ne: "done" },
                dueDate: { $gte: now, $lte: inH }
            }).select("title dueDate assignedTo projectId");

            for (const t of tasks) {
                // destinatario: assignedTo o owner del proyecto
                let target = t.assignedTo;
                if (!target) {
                    const p = await Project.findById(t.projectId).select("owner");
                    target = p ? p.owner : null;
                }

                let user = null;
                if (target) {
                    user = await User.findById(target).select("email username");
                }

                const dueISO = t.dueDate ? t.dueDate.toISOString() : "";
                const email = user && user.email ? user.email : "N/A";
                console.log('[REMINDER] "' + t.title + '" vence ' + dueISO + ' → notify ' + email);

                // registra actividad "due_soon"
                await logActivity({
                    actor: user && user._id ? user._id : null,
                    entityType: "task",
                    entityId: t._id,
                    action: "due_soon",
                    changes: { dueDate: t.dueDate }
                });
            }
        } catch (e) {
            console.error("due-notifier error:", (e && e.message) ? e.message : e);
        }
    });
}