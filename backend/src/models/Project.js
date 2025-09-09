import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema({
    // OJO: quitamos "index: true" para evitar duplicado
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "editor", "viewer"], default: "viewer" }
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    // OJO: quitamos "index: true" aquí también
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [MemberSchema], default: [] }
}, { timestamps: true });

// Deja SOLO estos índices explícitos
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ "members.user": 1 });

export default mongoose.model("Project", ProjectSchema);