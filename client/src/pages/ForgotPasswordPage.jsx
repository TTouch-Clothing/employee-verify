import { useState } from "react";
import { http } from "../api/http";
import Card from "../components/Card";
import Input from "../components/Input";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await http.post("/api/admin/forgot-password", {
        email
      });

      toast.success(data?.message || "Reset link sent");
      setDone(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send reset link");
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
          <div style={{ fontWeight: 900, fontSize: 20 }}>Forgot Password</div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Enter your admin email to receive a password reset link.
          </div>

          <form onSubmit={onSubmit} style={{ marginTop: 14 }}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 10 }}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          {done && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 12,
                background: "#eff6ff",
                color: "#1e3a8a",
                fontSize: 14,
                lineHeight: 1.5
              }}
            >
              If the email exists, a password reset link has been sent. Please
              check your inbox and spam folder.
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <a href="/admin/login" style={{ color: "#1d4ed8", fontWeight: 700 }}>
              Back to Login
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}