// tasks: title, description, status, priority, dueDate, assignedTo, subtasks, attachments, comments, projectId
import mongoose from "mongoose";

const SubtaskSchema = new mongoose.Schema({ title: { type: String, required: true }, done: { type: Boolean, default: false } }, { _id: false });

const AttachmentSchema = new mongoose.Schema({ name: String, type: String, size: Number, url: String }, { _id: false });

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["todo", "in_progress", "done"], default: "todo", index: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    dueDate: { type: Date },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subtasks: { type: [SubtaskSchema], default: [] },
    attachments: { type: [AttachmentSchema], default: [] },
    comments: { type: [mongoose.Schema.Types.ObjectId], ref: "Comment", default: [] },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true }
}, { timestamps: true });

TaskSchema.index({ projectId: 1, dueDate: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model("Task", TaskSchema);