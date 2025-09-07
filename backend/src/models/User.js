// users: username, email, password, preferences
// (Define el schema real cuando USE_DB=1)
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 6, select: false },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

UserSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.comparePassword = function(plain) {
    return bcrypt.compare(plain, this.password);
};

UserSchema.set("toJSON", {
    transform(_doc, ret) { delete ret.password;
        delete ret.__v; return ret; }
});

export default mongoose.model("User", UserSchema);