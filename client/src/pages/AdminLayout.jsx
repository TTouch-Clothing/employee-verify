import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "null");

  function active(path) {
    return loc.pathname === path
      ? { background: "rgba(255,255,255,.10)", color: "#fff" }
      : null;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("adminUser");
    navigate("/admin/login", { replace: true });
  }

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="adminLayoutWrap">
      <div className="mobileTopbar">
        <button
          className="hamburgerBtn"
          onClick={toggleMenu}
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <i className={`fa ${menuOpen ? "fa-times" : "fa-bars"}`} />
        </button>

        <div className="mobileTopbarTitle">Admin Panel</div>

        <div className="mobileTopbarSpacer" />
      </div>

      {menuOpen && (
        <div
          className="mobileSidebarOverlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`adminSidebar ${menuOpen ? "open" : ""}`}>
        <div className="adminSidebarHeader">
          <span>Admin Panel</span>

          <button
            className="sidebarCloseBtn"
            onClick={() => setMenuOpen(false)}
            type="button"
            aria-label="Close sidebar"
          >
            <i className="fa fa-times" />
          </button>
        </div>

        <Link
          to="/admin"
          style={{
            padding: "12px 20px",
            textDecoration: "none",
            color: "#fff",
            ...active("/admin")
          }}
        >
          <i className="fa fa-home" style={{ marginRight: 10 }} />
          Dashboard
        </Link>

        <Link
          to="/admin/employees"
          style={{
            padding: "12px 20px",
            textDecoration: "none",
            color: "#fff",
            ...active("/admin/employees")
          }}
        >
          <i className="fa fa-users" style={{ marginRight: 10 }} />
          Employees
        </Link>

        <Link
          to="/admin/logs"
          style={{
            padding: "12px 20px",
            textDecoration: "none",
            color: "#fff",
            ...active("/admin/logs")
          }}
        >
          <i className="fa fa-history" style={{ marginRight: 10 }} />
          Verification Logs
        </Link>

        <Link
          to="/admin/change-password"
          style={{
            padding: "12px 20px",
            textDecoration: "none",
            color: "#fff",
            ...active("/admin/change-password")
          }}
        >
          <i className="fa fa-key" style={{ marginRight: 10 }} />
          Change Password
        </Link>

        <div style={{ marginTop: "auto", padding: "0 12px 12px" }}>
          {adminUser && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                marginBottom: 12,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.06)",
                borderRadius: 12
              }}
            >
              <img
                src={
                  adminUser.profileImageUrl ||
                  "https://via.placeholder.com/40?text=U"
                }
                alt={adminUser.name || "User"}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid rgba(255,255,255,.15)"
                }}
              />

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {adminUser.name || "Admin User"}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,.7)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textTransform: "uppercase"
                  }}
                >
                  {adminUser.role || ""}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            style={{
              width: "100%",
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.12)",
              color: "#fff",
              textAlign: "left",
              padding: "12px 16px",
              cursor: "pointer",
              fontSize: 14,
              borderRadius: 12
            }}
          >
            <i className="fa fa-sign-out" style={{ marginRight: 10 }} />
            Logout
          </button>
        </div>
      </aside>

      <main className="adminMainContent">
        <Outlet />
      </main>
    </div>
  );
}