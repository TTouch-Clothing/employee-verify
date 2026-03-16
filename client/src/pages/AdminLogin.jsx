import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http, setAuthToken } from "../api/http";
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
      toast.error(
        err?.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPageWrap">
      <div className="authBox">
        <div className="authLogoWrap">
          <img
            src="/loginLogo.png"
            alt="Login Logo"
            className="authLogo"
          />
        </div>

        <Card style={{ width: "100%", padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Admin Login</div>

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
                  className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
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
  );
}