import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http, setAuthToken, warmUpApi, shouldWarmApi } from "../api/http";
import Card from "../components/Card";
import Input from "../components/Input";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (shouldWarmApi()) {
        toast.loading("Waking up server...", { id: "warmup" });
        await warmUpApi(true);
        toast.dismiss("warmup");
      }

      const { data } = await http.post("/api/admin/login", {
        email,
        password
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      setAuthToken(data.token);

      toast.success("Login successful");
      navigate("/admin", { replace: true });
    } catch (err) {
      toast.dismiss("warmup");
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--bg)"
      }}
    >
      {/* 🔷 HEADER */}
      <div className="topbar">
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/titleImg.png"
              alt="TTouch Logo"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />
            <div style={{ fontWeight: 900 }}>Touch Clothing</div>
          </div>

          <div style={{ opacity: 0.9 }}>Employee Verification</div>
        </div>
      </div>

      {/* 🔷 CENTER LOGIN */}
      <div
        className="authPageWrap"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px"
        }}
      >
        <div className="authBox" style={{ width: "100%", maxWidth: 380 }}>
          <div className="authLogoWrap">
            <img
              src="/loginLogo.png"
              alt="Login Logo"
              className="authLogo"
            />
          </div>

          <Card style={{ width: "100%", padding: 18 }}>
            <div style={{ fontWeight: 900, fontSize: 20 }}>
              Admin Login
            </div>

            <div
              style={{
                color: "var(--muted)",
                fontSize: 13,
                marginTop: 4
              }}
            >
              Sign in to manage employees.
            </div>

            <form onSubmit={onSubmit} style={{ marginTop: 14 }}>
              <Input
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div style={{ marginBottom: 12 }}>
                <div className="label">Password</div>

                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: 45 }}
                  />

                  <i
                    className={`fa ${
                      showPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                    onClick={() => setShowPassword(!showPassword)}
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
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 10 }}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}