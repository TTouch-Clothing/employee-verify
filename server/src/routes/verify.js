import express from "express";
import bcrypt from "bcryptjs";
import Joi from "joi";
import Employee from "../models/Employee.js";
import VerifyLog from "../models/VerifyLog.js";
import { normalizeEmployeeId, normalizeSecret } from "../utils/normalize.js";

const router = express.Router();

const schema = Joi.object({
  employeeId: Joi.string().min(3).max(40).required(),
  secret: Joi.string().min(2).max(32).required()
});

router.post("/", async (req, res) => {
  try {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const employeeId = normalizeEmployeeId(value.employeeId);
    const secret = normalizeSecret(value.secret);

    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.socket.remoteAddress;

    const userAgent = req.headers["user-agent"] || "";

    const emp = await Employee.findOne({ employeeId }).lean();

    if (!emp) {
      await VerifyLog.create({
        employeeIdAttempted: employeeId,
        result: "NOT_FOUND",
        ip,
        userAgent
      });

      return res.status(404).json({
        verified: false,
        message: "Not found"
      });
    }

    const ok = await bcrypt.compare(secret, emp.verifySecretHash);

    if (!ok) {
      await VerifyLog.create({
        employeeIdAttempted: employeeId,
        result: "MISMATCH",
        ip,
        userAgent
      });

      return res.status(404).json({
        verified: false,
        message: "Not found"
      });
    }

    await VerifyLog.create({
      employeeIdAttempted: employeeId,
      result: "FOUND",
      ip,
      userAgent
    });

    return res.json({
      verified: true,
      employee: {
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        department: emp.department,
        designation: emp.designation,
        status: emp.status,
        photoUrl: emp.photoUrl || "",
        joinDate: emp.joinDate || null,
        endDate: emp.endDate || null
      },
      verifiedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

export default router;