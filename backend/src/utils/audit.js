import Activity from "../models/Activity.js";

export async function logActivity({ actor, entityType, entityId, action, changes = {} }) {
    try {
        await Activity.create({ actor, entityType, entityId, action, changes });
    } catch (e) {
        console.error("audit error:", (e && e.message) ? e.message : e);
    }
}