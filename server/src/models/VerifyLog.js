import mongoose from "mongoose";

const VerifyLogSchema = new mongoose.Schema(
  {
    employeeIdAttempted: { type: String, index: true },
    result: { type: String, enum: ["FOUND", "NOT_FOUND", "MISMATCH"], index: true },
    ip: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("VerifyLog", VerifyLogSchema);
