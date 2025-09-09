// Modelo de comentarios: content, author, taskId
import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    content: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true }
}, { timestamps: true });

CommentSchema.index({ taskId: 1, createdAt: 1 });

export default mongoose.model("Comment", CommentSchema);