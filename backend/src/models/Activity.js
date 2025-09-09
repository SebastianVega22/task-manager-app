// Actividad: quién (actor), qué entidad (task|project|comment), acción, cambios
import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema({
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    entityType: { type: String, enum: ["task", "project", "comment"], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: { type: String, required: true }, // created|updated|deleted|status_changed|commented|due_soon
    changes: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

ActivitySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export default mongoose.model("Activity", ActivitySchema);