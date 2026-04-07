import { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 480);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        password,
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
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #f8fafc 100%)",
      }}
    >
      {/* PREMIUM HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          overflow: "hidden",
          backdropFilter: "blur(10px)",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -45,
            left: -30,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.16)",
            filter: "blur(18px)",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: -30,
            bottom: -50,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            filter: "blur(10px)",
          }}
        />

        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: isMobile ? "10px 10px" : "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: isMobile ? 8 : 12,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 8 : 12,
              minWidth: 0,
              flex: 1,
            }}
          >
            <img
              src="/titleImg.png"
              alt="TTouch Logo"
              style={{
                width: isMobile ? 38 : 44,
                height: isMobile ? 38 : 44,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.18)",
                boxShadow: "0 0 18px rgba(99,102,241,0.32)",
                flexShrink: 0,
              }}
            />

            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: isMobile ? 12 : 16,
                  color: "#ffffff",
                  letterSpacing: isMobile ? 0 : 0.4,
                  whiteSpace: "nowrap",
                  lineHeight: 1.1,
                }}
              >
                Touch Clothing
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                padding: isMobile ? "6px 10px" : "7px 14px",
                borderRadius: 999,
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.30)",
                color: "#e2e8f0",
                fontSize: isMobile ? 11 : 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
                lineHeight: 1.1,
              }}
            >
              Employee Verification
            </span>
          </div>
        </div>
      </header>

      {/* CENTER LOGIN */}
      <div
        className="authPageWrap"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "18px 12px" : "32px 16px",
        }}
      >
        <div className="authBox" style={{ width: "100%", maxWidth: 400 }}>
          <Card
            style={{
              width: "100%",
              padding: isMobile ? 18 : 22,
              borderRadius: isMobile ? 18 : 22,
              boxShadow: "0 22px 55px rgba(15, 23, 42, 0.10)",
              border: "1px solid rgba(255,255,255,0.75)",
              background: "rgba(255,255,255,0.94)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: isMobile ? 18 : 22,
                color: "#0f172a",
              }}
            >
              Admin Login
            </div>

            <div
              style={{
                color: "var(--muted)",
                fontSize: isMobile ? 12 : 13,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              Sign in to manage employees with a secure premium dashboard
              experience.
            </div>

            <form onSubmit={onSubmit} style={{ marginTop: 18 }}>
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
                    style={{
                      paddingRight: 45,
                    }}
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
                      fontSize: 16,
                    }}
                  />
                </div>
              </div>

              <button
                style={{
                  width: "100%",
                  marginTop: 12,
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 14,
                  padding: isMobile ? "12px 14px" : "12px 16px",
                  border: "none",
                  outline: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  background:
                    "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                  color: "#ffffff",
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.35)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 14px 35px rgba(15, 23, 42, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 25px rgba(15, 23, 42, 0.35)";
                }}
                disabled={loading}
                type="submit"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </Card>
        </div>
      </div>

      {/* PREMIUM FOOTER */}
      <footer
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#e2e8f0",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: isMobile ? "16px 12px" : "20px 16px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            left: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: -40,
            right: -20,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.18)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: isMobile ? 10 : 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="/titleImg.png"
              alt="Touch Clothing"
              style={{
                width: isMobile ? 38 : 42,
                height: isMobile ? 38 : 42,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.15)",
                flexShrink: 0,
              }}
            />

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: isMobile ? 13 : 15,
                  color: "#ffffff",
                  letterSpacing: 0.3,
                  whiteSpace: "nowrap",
                }}
              >
                Touch Clothing
              </div>

              <div
                style={{
                  fontSize: isMobile ? 11 : 12,
                  color: "rgba(226,232,240,0.8)",
                  marginTop: 2,
                  lineHeight: 1.4,
                }}
              >
                Admin Panel • Secure Employee Management
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: isMobile ? "left" : "right",
              fontSize: isMobile ? 12 : 13,
              color: "rgba(226,232,240,0.9)",
            }}
          >
            <div>© {new Date().getFullYear()} TTouch Clothing (IT Department)</div>
   
          </div>
        </div>
      </footer>
    </div>
  );
}