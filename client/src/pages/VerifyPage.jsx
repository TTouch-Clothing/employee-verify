// import { useState } from "react";
// import { http } from "../api/http";
// import Card from "../components/Card";
// import Input from "../components/Input";
// import Badge from "../components/Badge";
// import toast from "react-hot-toast";
// import { X } from "lucide-react";

// export default function VerifyPage() {
//   const [employeeId, setEmployeeId] = useState("");
//   const [secret, setSecret] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [previewImage, setPreviewImage] = useState("");

//   async function onVerify(e) {
//     e.preventDefault();
//     setLoading(true);
//     setResult(null);

//     try {
//       const { data } = await http.post("/api/verify", {
//         employeeId,
//         secret
//       });

//       setResult({ ok: true, data });
//       toast.success("Employee verified successfully");
//     } catch (err) {
//       setResult({ ok: false });
//       toast.error(
//         err?.response?.data?.message ||
//           "Employee not found or verification failed"
//       );
//     } finally {
//       setLoading(false);
//     }
//   }

//   const statusTone = (st) =>
//     st === "ACTIVE" ? "green" : st === "INACTIVE" ? "yellow" : "red";

//   function formatDate(value) {
//     if (!value) return "";

//     const date = new Date(value);
//     const day = date.getDate();
//     const month = date.toLocaleString("en-US", {
//       month: "long"
//     });
//     const year = date.getFullYear();

//     return `${day} ${month}, ${year}`;
//   }

//   function getDuration(employee) {
//     const join = formatDate(employee?.joinDate);
//     const end = employee?.endDate
//       ? formatDate(employee.endDate)
//       : "Present";

//     if (join) {
//       return `${join} → ${end}`;
//     }

//     return end;
//   }

//   return (
//     <div>
//       <div>
//         <div className="topbar">
//           <div className="container">
//             <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//               <img
//                 src="/titleImg.png"
//                 alt="TTouch Logo"
//                 style={{
//                   width: 36,
//                   height: 36,
//                   borderRadius: "50%",
//                   objectFit: "cover"
//                 }}
//               />
//               <div style={{ fontWeight: 900 }}>Touch Clothing</div>
//             </div>

//             <div style={{ opacity: 0.9 }}>Employee Verification</div>
//           </div>
//         </div>
//       </div>

//       <div className="container">
//         <div className="h1">Employee Verification</div>
//         <div className="p">
//           Verify employee authenticity using Employee ID and verification detail.
//         </div>

//         <div style={{ display: "flex", justifyContent: "center" }}>
//           <Card style={{ maxWidth: 520, width: "100%", padding: 18 }}>
//             <form onSubmit={onVerify}>
//               <Input
//                 label="Employee ID"
//                 placeholder="TT000123"
//                 value={employeeId}
//                 onChange={(e) => setEmployeeId(e.target.value)}
//               />

//               <Input
//                 label="Date of Birth (YYYY-MM-DD)"
//                 placeholder="1999-08-05"
//                 value={secret}
//                 onChange={(e) => setSecret(e.target.value)}
//               />

//               <button
//                 className="btn btn-primary"
//                 style={{ width: "100%" }}
//                 disabled={loading}
//               >
//                 {loading ? "Verifying..." : "Verify"}
//               </button>

//               <div
//                 style={{
//                   textAlign: "center",
//                   marginTop: 10,
//                   fontSize: 12,
//                   color: "var(--muted)"
//                 }}
//               >
//                 We show limited information for privacy.
//               </div>
//             </form>
//           </Card>
//         </div>

//         <div className="grid grid-2" style={{ marginTop: 18 }}>
//           <Card style={{ padding: 16 }}>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center"
//               }}
//             >
//               <div style={{ fontWeight: 800 }}>Result</div>
//               {!result && <Badge tone="gray">—</Badge>}
//               {result?.ok && <Badge tone="green">VERIFIED</Badge>}
//               {result && !result.ok && <Badge tone="red">NOT FOUND</Badge>}
//             </div>

//             <div style={{ marginTop: 14 }}>
//               {!result && (
//                 <div style={{ color: "var(--muted)", fontSize: 14 }}>
//                   Submit a verification to see result.
//                 </div>
//               )}

//               {result?.ok && (
//                 <div style={{ display: "flex", gap: 14 }}>
//                   <img
//                     src={
//                       result.data.employee.photoUrl ||
//                       "https://via.placeholder.com/80"
//                     }
//                     alt="Employee"
//                     onClick={() =>
//                       setPreviewImage(
//                         result.data.employee.photoUrl ||
//                           "https://via.placeholder.com/600"
//                       )
//                     }
//                     style={{
//                       width: 84,
//                       height: 84,
//                       borderRadius: 14,
//                       objectFit: "cover",
//                       border: "1px solid var(--border)",
//                       cursor: "pointer"
//                     }}
//                   />

//                   <div style={{ flex: 1 }}>
//                     <div style={{ fontSize: 18, fontWeight: 900 }}>
//                       {result.data.employee.fullName}
//                     </div>

//                     <div style={{ color: "var(--muted)", marginTop: 4 }}>
//                       <strong style={{ color: "var(--text)" }}>
//                         Department:
//                       </strong>{" "}
//                       {result.data.employee.department || "-"}
//                     </div>

//                     <div style={{ color: "var(--muted)" }}>
//                       <strong style={{ color: "var(--text)" }}>
//                         Designation:
//                       </strong>{" "}
//                       {result.data.employee.designation || "-"}
//                     </div>

//                     <div style={{ color: "var(--muted)" }}>
//                       <strong style={{ color: "var(--text)" }}>
//                         Duration:
//                       </strong>{" "}
//                       {getDuration(result.data.employee)}
//                     </div>

//                     <div style={{ marginTop: 8 }}>
//                       <Badge tone={statusTone(result.data.employee.status)}>
//                         {result.data.employee.status}
//                       </Badge>
//                     </div>

//                     <div
//                       style={{
//                         marginTop: 10,
//                         fontSize: 12,
//                         color: "var(--muted)"
//                       }}
//                     >
//                       Verified on:{" "}
//                       {new Date(result.data.verifiedAt).toLocaleString()}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {result && !result.ok && (
//                 <div style={{ color: "var(--text)", fontSize: 14 }}>
//                   No employee record found. Please check Employee ID and details.
//                 </div>
//               )}
//             </div>
//           </Card>

//           <Card style={{ padding: 16 }}>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center"
//               }}
//             >
//               <div style={{ fontWeight: 800 }}>Privacy</div>
//               <Badge tone="gray">INFO</Badge>
//             </div>

//             <p
//               style={{
//                 marginTop: 14,
//                 color: "var(--muted)",
//                 lineHeight: 1.6
//               }}
//             >
//               This portal confirms employment authenticity and status only. No
//               personal contact details are displayed. If you need more
//               information, please contact the company HR.
//             </p>
//           </Card>
//         </div>

//         <div className="footer">
//           © {new Date().getFullYear()} T Touch Clothing (IT Department) ·
//           Privacy Notice
//         </div>
//       </div>

//       {previewImage && (
//         <div
//           onClick={() => setPreviewImage("")}
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.75)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             padding: 16,
//             zIndex: 9999
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               position: "relative",
//               maxWidth: "95vw",
//               maxHeight: "95vh",
//               width: "fit-content"
//             }}
//           >
//             <button
//               onClick={() => setPreviewImage("")}
//               style={{
//                 position: "absolute",
//                 top: -14,
//                 right: -14,
//                 width: 38,
//                 height: 38,
//                 borderRadius: "50%",
//                 border: "none",
//                 background: "#fff",
//                 color: "#111",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 cursor: "pointer",
//                 boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
//               }}
//             >
//               <X size={20} />
//             </button>

//             <img
//               src={previewImage}
//               alt="Preview"
//               style={{
//                 display: "block",
//                 maxWidth: "95vw",
//                 maxHeight: "95vh",
//                 width: "auto",
//                 height: "auto",
//                 borderRadius: 16,
//                 objectFit: "contain",
//                 background: "#fff"
//               }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState } from "react";
import { http, warmUpApi, shouldWarmApi } from "../api/http";
import Card from "../components/Card";
import Input from "../components/Input";
import Badge from "../components/Badge";
import toast from "react-hot-toast";
import { X } from "lucide-react";

export default function VerifyPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  async function onVerify(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      if (shouldWarmApi()) {
        toast.loading("Server is waking up...", { id: "warmup" });
        await warmUpApi(true);
        toast.dismiss("warmup");
      }

      const { data } = await http.post("/api/verify", {
        employeeId,
        secret
      });

      setResult({ ok: true, data });
      toast.success("Employee verified successfully");
    } catch (err) {
      toast.dismiss("warmup");
      setResult({ ok: false });

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Employee not found or verification failed"
      );
    } finally {
      setLoading(false);
    }
  }

  const statusTone = (st) =>
    st === "ACTIVE" ? "green" : st === "INACTIVE" ? "yellow" : "red";

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", {
      month: "long"
    });
    const year = date.getFullYear();

    return `${day} ${month}, ${year}`;
  }

  function getDuration(employee) {
    const join = formatDate(employee?.joinDate);
    const end = employee?.endDate ? formatDate(employee.endDate) : "Present";

    if (join) {
      return `${join} → ${end}`;
    }

    return end;
  }

  function formatVerifiedAt(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString("en-BD", {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  return (
    <div>
      <div>
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
      </div>

      <div className="container">
        <div className="h1">Employee Verification</div>
        <div className="p">
          Verify employee authenticity using Employee ID and verification detail.
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Card style={{ maxWidth: 520, width: "100%", padding: 18 }}>
            <form onSubmit={onVerify}>
              <Input
                label="Employee ID"
                placeholder="TT000123"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />

              <Input
                label="Date of Birth (YYYY-MM-DD)"
                placeholder="1999-08-05"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />

              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={loading}
              >
                {loading ? "Please wait..." : "Verify"}
              </button>

              <div
                style={{
                  textAlign: "center",
                  marginTop: 10,
                  fontSize: 12,
                  color: "var(--muted)"
                }}
              >
                We show limited information for privacy.
              </div>
            </form>
          </Card>
        </div>

        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <Card style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ fontWeight: 800 }}>Result</div>
              {!result && <Badge tone="gray">—</Badge>}
              {result?.ok && <Badge tone="green">VERIFIED</Badge>}
              {result && !result.ok && <Badge tone="red">NOT FOUND</Badge>}
            </div>

            <div style={{ marginTop: 14 }}>
              {!result && (
                <div style={{ color: "var(--muted)", fontSize: 14 }}>
                  Submit a verification to see result.
                </div>
              )}

              {result?.ok && (
                <div style={{ display: "flex", gap: 14 }}>
                  <img
                    src={
                      result.data.employee.photoUrl ||
                      "https://via.placeholder.com/80"
                    }
                    alt="Employee"
                    onClick={() =>
                      setPreviewImage(
                        result.data.employee.photoUrl ||
                          "https://via.placeholder.com/600"
                      )
                    }
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 14,
                      objectFit: "cover",
                      border: "1px solid var(--border)",
                      cursor: "pointer"
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>
                      {result.data.employee.fullName}
                    </div>

                    <div style={{ color: "var(--muted)", marginTop: 4 }}>
                      <strong style={{ color: "var(--text)" }}>
                        Department:
                      </strong>{" "}
                      {result.data.employee.department || "-"}
                    </div>

                    <div style={{ color: "var(--muted)" }}>
                      <strong style={{ color: "var(--text)" }}>
                        Designation:
                      </strong>{" "}
                      {result.data.employee.designation || "-"}
                    </div>

                    <div style={{ color: "var(--muted)" }}>
                      <strong style={{ color: "var(--text)" }}>
                        Duration:
                      </strong>{" "}
                      {getDuration(result.data.employee)}
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <Badge tone={statusTone(result.data.employee.status)}>
                        {result.data.employee.status}
                      </Badge>
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        color: "var(--muted)"
                      }}
                    >
                      Verified on: {formatVerifiedAt(result.data.verifiedAt)}
                    </div>
                  </div>
                </div>
              )}

              {result && !result.ok && (
                <div style={{ color: "var(--text)", fontSize: 14 }}>
                  No employee record found. Please check Employee ID and details.
                </div>
              )}
            </div>
          </Card>

          <Card style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ fontWeight: 800 }}>Privacy</div>
              <Badge tone="gray">INFO</Badge>
            </div>

            <p
              style={{
                marginTop: 14,
                color: "var(--muted)",
                lineHeight: 1.6
              }}
            >
              This portal confirms employment authenticity and status only. No
              personal contact details are displayed. If you need more
              information, please contact the company HR.
            </p>
          </Card>
        </div>

        <div className="footer">
          © {new Date().getFullYear()} T Touch Clothing (IT Department) ·
          Privacy Notice
        </div>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage("")}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "95vw",
              maxHeight: "95vh",
              width: "fit-content"
            }}
          >
            <button
              onClick={() => setPreviewImage("")}
              style={{
                position: "absolute",
                top: -14,
                right: -14,
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "none",
                background: "#fff",
                color: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
              }}
            >
              <X size={20} />
            </button>

            <img
              src={previewImage}
              alt="Preview"
              style={{
                display: "block",
                maxWidth: "95vw",
                maxHeight: "95vh",
                width: "auto",
                height: "auto",
                borderRadius: 16,
                objectFit: "contain",
                background: "#fff"
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}