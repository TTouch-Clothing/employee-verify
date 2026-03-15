import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Joi from "joi";
import { requireAuth } from "../middleware/auth.js";
import Employee from "../models/Employee.js";
import AdminUser from "../models/AdminUser.js";
import VerifyLog from "../models/VerifyLog.js";
import { normalizeEmployeeId, normalizeSecret } from "../utils/normalize.js";
import upload from "../middleware/upload.js";
import uploadBufferToCloudinary from "../utils/uploadToCloudinary.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

function requireAdminOnly(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Only ADMIN can perform this action" });
  }
  next();
}

function requireAdminOrHr(req, res, next) {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "HR") {
    return res.status(403).json({ message: "Only ADMIN or HR can perform this action" });
  }
  next();
}

/* =========================
   TEMP SEED ADMIN (POSTMAN)
   ========================= */
router.post("/seed-admin", async (req, res) => {
  try {
    if (process.env.ALLOW_ADMIN_SEED !== "true") {
      return res.status(403).json({ message: "Admin seeding is disabled" });
    }

    const schema = Joi.object({
      name: Joi.string().min(2).max(80).default("Admin"),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required(),
      role: Joi.string().valid("ADMIN", "HR").default("ADMIN")
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        message: "Invalid input",
        details: error.details
      });
    }

    const email = value.email.toLowerCase().trim();

    const exists = await AdminUser.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const passwordHash = await bcrypt.hash(value.password, 10);

    const created = await AdminUser.create({
      name: value.name.trim(),
      email,
      passwordHash,
      role: value.role
    });

    return res.status(201).json({
      message: "Admin created successfully",
      user: {
        id: created._id,
        name: created.name,
        email: created.email,
        role: created.role
      }
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});


//------------------------Admin/ HR Login--------------------//
router.post("/login", async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret missing" });
    }

    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Please Enter Email or Password" });
    }

    const email = value.email.toLowerCase().trim();
    const user = await AdminUser.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Email or Password not match" });
    }

    const ok = await bcrypt.compare(value.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Email or Password not match" });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
  token,
  user: {
    name: user.name,
    email: user.email,
    role: user.role,
    profileImageUrl: user.profileImageUrl || ""
  }
});

  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});


//------------------------Admin/ HR Forgot Password--------------------//
router.post("/forgot-password", async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const email = value.email.toLowerCase().trim();
    const user = await AdminUser.findOne({ email });

    const successMessage =
      "If that email exists, a password reset link has been sent";

    if (!user) {
      return res.json({ message: successMessage });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const expiresMinutes = Number(
      process.env.RESET_PASSWORD_TOKEN_EXPIRES_MINUTES || 15
    );

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/admin/reset-password?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      text: `Open this link to reset your password: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Reset your password</h2>
          <p>Hello ${user.name || "User"},</p>
          <p>Click the button below to reset your password:</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
              Reset Password
            </a>
          </p>
          <p>If the button does not work, use this link:</p>
          <p>${resetLink}</p>
          <p>This link will expire in ${expiresMinutes} minutes.</p>
        </div>
      `
    });

    return res.json({ message: successMessage });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});


//------------------------Admin/ HR reset password--------------------//
router.post("/reset-password", async (req, res) => {
  try {
    const schema = Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string()
        .min(8)
        .max(128)
        .pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_+\-])[A-Za-z\d@$!%*?&.#_+\-]+$/
        )
        .required()
        .messages({
          "string.pattern.base":
            "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
        }),
      confirmPassword: Joi.string()
        .required()
        .valid(Joi.ref("newPassword"))
        .messages({
          "any.only": "Confirm password does not match new password"
        })
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        message: "Invalid input",
        details: error.details.map((d) => d.message)
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(value.token)
      .digest("hex");

    const user = await AdminUser.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const isSameAsOld = await bcrypt.compare(value.newPassword, user.passwordHash);
    if (isSameAsOld) {
      return res.status(400).json({
        message: "New password must be different from old password"
      });
    }

    user.passwordHash = await bcrypt.hash(value.newPassword, 10);
    user.resetPasswordTokenHash = "";
    user.resetPasswordExpiresAt = null;

    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});


/* =========================
   PROTECTED ROUTES
   ========================= */
router.use(requireAuth);

//------------------------Get All Admin & Hr--------------------//

router.get("/users",requireAdminOrHr, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 5), 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") }
      ];
    }

    const [items, total] = await Promise.all([
      AdminUser.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminUser.countDocuments(filter)
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1)
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/* =========================
   CREATE ADMIN / HR
   ========================= */
router.post("/users", requireAdminOnly, upload.single("photo"), async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(2).max(80).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required(),
      confirmPassword: Joi.string()
        .required()
        .valid(Joi.ref("password"))
        .messages({
          "any.only": "Confirm password does not match password"
        }),
      role: Joi.string().valid("ADMIN", "HR").default("HR")
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        message: "Invalid input",
        details: error.details.map((d) => d.message)
      });
    }

    const email = value.email.toLowerCase().trim();

    const exists = await AdminUser.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(value.password, 10);

    let profileImageUrl = "";

    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
        public_id: `admin-${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
        overwrite: true
      });

      profileImageUrl = uploadResult.secure_url;
    }

    const created = await AdminUser.create({
      name: value.name.trim(),
      email,
      passwordHash,
      role: value.role,
      profileImageUrl
    });

    return res.status(201).json({
      message: "User created successfully",
      item: {
        _id: created._id,
        name: created.name,
        email: created.email,
        role: created.role,
        profileImageUrl: created.profileImageUrl,
        createdAt: created.createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/* =========================
   CREATE ADMIN / HR
   ========================= */

  router.put("/users/:id", requireAdminOnly, upload.single("photo"), async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(2).max(80).required(),
      role: Joi.string().valid("ADMIN", "HR").required()
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        message: "Invalid input",
        details: error.details.map((d) => d.message)
      });
    }

    const userId = req.params.id;

    const existingUser = await AdminUser.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let profileImageUrl = existingUser.profileImageUrl || "";

    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
        public_id: `admin-${existingUser.email.replace(/[^a-zA-Z0-9]/g, "_")}`,
        overwrite: true
      });

      profileImageUrl = uploadResult.secure_url;
    }

    const updated = await AdminUser.findByIdAndUpdate(
      userId,
      {
        name: value.name.trim(),
        role: value.role,
        profileImageUrl
      },
      {
        new: true,
        runValidators: true
      }
    );

    return res.json({
      message: "User updated successfully",
      item: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        profileImageUrl: updated.profileImageUrl,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      }
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});


/* =========================
   DELETE ADMIN / HR
   ========================= */
router.delete("/users/:id", requireAdminOnly, async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user.sub) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await AdminUser.findByIdAndDelete(req.params.id);

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});



/* =========================
   CHANGE ADMIN PASSWORD
   ========================= */
router.patch("/change-password", async (req, res) => {
  try {
    const schema = Joi.object({
      currentPassword: Joi.string().min(6).max(128).required(),

      newPassword: Joi.string()
        .min(8)
        .max(128)
        .pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_+\-])[A-Za-z\d@$!%*?&.#_+\-]+$/
        )
        .required()
        .messages({
          "string.pattern.base":
            "New password must be at least 8 characters and include uppercase, lowercase, number, and special character"
        }),

      confirmPassword: Joi.string()
        .required()
        .valid(Joi.ref("newPassword"))
        .messages({
          "any.only": "Confirm password does not match new password"
        })
    });

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        message: "Invalid input",
        details: error.details.map((d) => d.message)
      });
    }

    const admin = await AdminUser.findById(req.user.sub);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(
      value.currentPassword,
      admin.passwordHash
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const isSameAsOld = await bcrypt.compare(
      value.newPassword,
      admin.passwordHash
    );

    if (isSameAsOld) {
      return res.status(400).json({
        message: "New password must be different from current password"
      });
    }

    const newPasswordHash = await bcrypt.hash(value.newPassword, 10);

    admin.passwordHash = newPasswordHash;
    await admin.save();

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/* =========================
   LOGOUT
   ========================= */
router.post("/logout", async (_req, res) => {
  return res.json({ message: "Logged out successfully" });
});

/* =========================
   DASHBOARD STATS
   ========================= */
router.get("/stats", async (req, res) => {
  try {

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    const total = await Employee.countDocuments();
    const active = await Employee.countDocuments({ status: "ACTIVE" });

    const verifyToday = await VerifyLog.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      success: true
    });

    const failedToday = await VerifyLog.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      success: false
    });

    // Information Technology
    const itTotal = await Employee.countDocuments({
      department: "Information Technology"
    });

    const itActive = await Employee.countDocuments({
      department: "Information Technology",
      status: "ACTIVE"
    });

    const itInactive = await Employee.countDocuments({
      department: "Information Technology",
      status: { $ne: "ACTIVE" }
    });

    // Distribution
    const distributionTotal = await Employee.countDocuments({
      department: "Distribution"
    });

    const distributionActive = await Employee.countDocuments({
      department: "Distribution",
      status: "ACTIVE"
    });

    const distributionInactive = await Employee.countDocuments({
      department: "Distribution",
      status: { $ne: "ACTIVE" }
    });

    // Customer Support
    const supportTotal = await Employee.countDocuments({
      department: "Customer Support Service"
    });

    const supportActive = await Employee.countDocuments({
      department: "Customer Support Service",
      status: "ACTIVE"
    });

    const supportInactive = await Employee.countDocuments({
      department: "Customer Support Service",
      status: { $ne: "ACTIVE" }
    });

    // Content
    const contentTotal = await Employee.countDocuments({
      department: "Content"
    });

    const contentActive = await Employee.countDocuments({
      department: "Content",
      status: "ACTIVE"
    });

    const contentInactive = await Employee.countDocuments({
      department: "Content",
      status: { $ne: "ACTIVE" }
    });

    // Moderator
    const moderatorTotal = await Employee.countDocuments({
      department: "Moderator"
    });

    const moderatorActive = await Employee.countDocuments({
      department: "Moderator",
      status: "ACTIVE"
    });

    const moderatorInactive = await Employee.countDocuments({
      department: "Moderator",
      status: { $ne: "ACTIVE" }
    });

    res.json({
      total,
      active,
      verifyToday,
      failedToday,

      departments: {
        informationTechnology: {
          total: itTotal,
          active: itActive,
          inactive: itInactive
        },

        distribution: {
          total: distributionTotal,
          active: distributionActive,
          inactive: distributionInactive
        },

        customerSupport: {
          total: supportTotal,
          active: supportActive,
          inactive: supportInactive
        },

        content: {
          total: contentTotal,
          active: contentActive,
          inactive: contentInactive
        },

        moderator: {
          total: moderatorTotal,
          active: moderatorActive,
          inactive: moderatorInactive
        }
      }

    });

  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/* =========================
   GET EMPLOYEES
   ========================= */
router.get("/employees", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim().toUpperCase();
    const department = String(req.query.department || "").trim();

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      filter.$or = [
        { employeeId: new RegExp(search, "i") },
        { fullName: new RegExp(search, "i") }
      ];
    }

    if (["ACTIVE", "INACTIVE", "TERMINATED"].includes(status)) {
      filter.status = status;
    }

    if (
      department &&
      department !== "ALL" &&
      [
        "Information Technology",
        "Distribution",
        "Customer Support Service",
        "Content",
        "Moderator"
      ].includes(department)
    ) {
      filter.department = department;
    }

    const [items, total] = await Promise.all([
      Employee.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter)
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1)
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/* =========================
   CREATE EMPLOYEE
   ========================= */
router.post("/employees", upload.single("photo"), async (req, res) => {
  try {
    const allowedDepartments = [
      "Information Technology",
      "Distribution",
      "Customer Support Service",
      "Content",
      "Moderator"
    ];

    const schema = Joi.object({
      employeeId: Joi.string().min(3).max(40).required(),
      fullName: Joi.string().min(2).max(120).required(),
      department: Joi.string()
        .valid(...allowedDepartments)
        .required(),
      designation: Joi.string().min(2).max(80).required(),
      status: Joi.string()
        .valid("ACTIVE", "INACTIVE", "TERMINATED")
        .default("ACTIVE"),
      secret: Joi.string().min(2).max(32).required(),
      photoUrl: Joi.string().allow("").max(500).optional(),
      joinDate: Joi.date().optional(),
      endDate: Joi.date().allow(null).optional()
    });

    const payload = {
      ...req.body,
      joinDate: req.body.joinDate || undefined,
      endDate: req.body.endDate || undefined
    };

    const { error, value } = schema.validate(payload, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        message: "Invalid input",
        details: error.details
      });
    }

    const employeeId = normalizeEmployeeId(value.employeeId);
    const secret = normalizeSecret(value.secret);
    const verifySecretHash = await bcrypt.hash(secret, 10);

    let finalPhotoUrl = value.photoUrl || "";

    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
        public_id: employeeId,
        overwrite: true
      });

      finalPhotoUrl = uploadResult.secure_url;
    }

    const created = await Employee.create({
      employeeId,
      fullName: value.fullName.trim(),
      department: value.department.trim(),
      designation: value.designation.trim(),
      status: value.status,
      verifySecretHash,
      photoUrl: finalPhotoUrl,
      joinDate: value.joinDate,
      endDate: value.endDate ?? null
    });

    return res.status(201).json({ item: created });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Employee ID already exists" });
    }

    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/* =========================
   UPDATE EMPLOYEE
   ========================= */
router.put("/employees/:id", upload.single("photo"), async (req, res) => {
  try {
    const allowedDepartments = [
      "Information Technology",
      "Distribution",
      "Customer Support Service",
      "Content",
      "Moderator"
    ];

    const schema = Joi.object({
      fullName: Joi.string().min(2).max(120).required(),
      department: Joi.string()
        .valid(...allowedDepartments)
        .required(),
      designation: Joi.string().min(2).max(80).required(),
      status: Joi.string().valid("ACTIVE", "INACTIVE", "TERMINATED").required(),
      photoUrl: Joi.string().allow("").max(500).optional(),
      joinDate: Joi.date().allow(null).optional(),
      endDate: Joi.date().allow(null).optional()
    });

    const payload = {
      ...req.body,
      joinDate: req.body.joinDate || null,
      endDate: req.body.endDate || null
    };

    const { error, value } = schema.validate(payload, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        message: "Invalid input",
        details: error.details
      });
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Not found" });
    }

    let finalPhotoUrl = value.photoUrl || employee.photoUrl || "";

    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
        public_id: employee.employeeId,
        overwrite: true
      });

      finalPhotoUrl = uploadResult.secure_url;
    }

    employee.fullName = value.fullName.trim();
    employee.department = value.department.trim();
    employee.designation = value.designation.trim();
    employee.status = value.status;
    employee.photoUrl = finalPhotoUrl;
    employee.joinDate = value.joinDate ?? null;
    employee.endDate = value.endDate ?? null;

    await employee.save();

    return res.json({ item: employee });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/* =========================
   DELETE EMPLOYEE
   ========================= */
router.delete("/employees/:id", async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/* =========================
   UPDATE EMPLOYEE SECRET
   ========================= */
router.patch("/employees/:id/secret", async (req, res) => {
  try {
    const schema = Joi.object({
      secret: Joi.string().min(2).max(32).required()
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const verifySecretHash = await bcrypt.hash(
      normalizeSecret(value.secret),
      10
    );

    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { verifySecretHash },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/* =========================
   VERIFY LOGS
   ========================= */
router.get("/logs", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);

    const items = await VerifyLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

export default router;