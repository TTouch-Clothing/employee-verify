import mongoose from "mongoose";

const AdminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: "Admin" },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "HR"], default: "ADMIN" },
    profileImageUrl: { type: String, default: "" },

    resetPasswordTokenHash: { type: String, default: "" },
    resetPasswordExpiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("AdminUser", AdminUserSchema);