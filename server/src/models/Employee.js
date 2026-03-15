import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },

    department: {
      type: String,
      required: true,
      enum: [
        "Information Technology",
        "Distribution",
        "Customer Support Service",
        "Content",
        "Moderator"
      ]
    },

    designation: { type: String, required: true },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "TERMINATED"],
      default: "ACTIVE",
      index: true
    },

    verifySecretHash: { type: String, required: true },
    photoUrl: { type: String, default: "" },
    joinDate: { type: Date },
    endDate: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Employee", EmployeeSchema);