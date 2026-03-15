import { useMemo, useState } from "react";
import { http } from "../api/http";
import Card from "../components/Card";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const token = useMemo(() => {
    return new URLSearchParams(window.location.search).get("token") || "";
  }, []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function isValidPassword(password) {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    return passwordRegex.test(password);
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (loading) return;

    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (!isValidPassword(newPassword)) {
      toast.error(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { data } = await http.post("/api/admin/reset-password", {
        token,
        newPassword,
        confirmPassword
      });

      toast.success(data?.message || "Password reset successful");
      window.location.href = "/admin/login";
    } catch (err) {
      const details = err?.response?.data?.details;

      if (Array.isArray(details) && details.length) {
        toast.error(details[0]);
      } else {
        toast.error(
          err?.response?.data?.message || "Failed to reset password"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPageWrap">
      <div className="authBox">
        <div className="authLogoWrap">
          <img src="/loginLogo.png" alt="Logo" className="authLogo" />
        </div>

        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Reset Password</div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Enter your new password and confirm it.
          </div>

          <form onSubmit={onSubmit} style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 12 }}>
              <div className="label">New Password</div>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{ paddingRight: 45 }}
                />
                <i
                  className={`fa ${
                    showNewPassword ? "fa-eye-slash" : "fa-eye"
                  }`}
                  onClick={() => setShowNewPassword((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#6B7280",
                    fontSize: 16
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="label">Confirm Password</div>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{ paddingRight: 45 }}
                />
                <i
                  className={`fa ${
                    showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                  }`}
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#6B7280",
                    fontSize: 16
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 10 }}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

        </Card>
      </div>
    </div>
  );
}