import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { http } from "../api/http";
import Card from "../components/Card";
import Input from "../components/Input";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

function roleTone(role) {
  return role === "ADMIN" ? "green" : "yellow";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function PasswordField({ label, value, onChange, placeholder = "" }) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ marginBottom: 12 }}>
      <div className="label">{label}</div>

      <div style={{ position: "relative" }}>
        <input
          className="input"
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ paddingRight: 45 }}
        />

        <i
          className={`fa ${show ? "fa-eye-slash" : "fa-eye"}`}
          onClick={() => setShow(!show)}
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
  );
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create cropped image"));
          return;
        }

        const file = new File([blob], `profile-${Date.now()}.png`, {
          type: "image/png"
        });

        resolve({
          file,
          previewUrl: URL.createObjectURL(blob)
        });
      },
      "image/png",
      1
    );
  });
}

function CropImageModal({ imageSrc, onClose, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = (_, croppedAreaPixelsValue) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  };

  async function handleSave() {
    if (!croppedAreaPixels) return;

    try {
      setSaving(true);
      const result = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(result);
    } catch {
      toast.error("Failed to crop image");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div
        className="modal card cropModal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <div style={{ fontWeight: 950, fontSize: 18 }}>Crop Profile Photo</div>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="cropContainer">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="label">Zoom</div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div className="cropActionRow">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Cropping..." : "Crop & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImagePickerWithCrop({
  label,
  photoPreview,
  setPhotoPreview,
  setPhotoFile
}) {
  const inputRef = useRef(null);
  const [tempImageSrc, setTempImageSrc] = useState("");

  function handlePhotoChange(e) {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setTempImageSrc(imageUrl);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleCropSave(result) {
    setPhotoFile(result.file);
    setPhotoPreview(result.previewUrl);
    setTempImageSrc("");
  }

  function removeSelectedPhoto() {
    setPhotoFile(null);
    setPhotoPreview("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div className="label">{label}</div>

        <input
          ref={inputRef}
          className="fileInputNice"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handlePhotoChange}
        />
      </div>

      {photoPreview && (
        <div style={{ marginBottom: 12 }}>
          <div className="label">Selected Photo Preview</div>

          <div className="imagePreviewBox">
            <img
              src={photoPreview}
              alt="Profile preview"
              className="imagePreviewThumb"
            />

            <button
              type="button"
              className="imageRemoveBtn"
              onClick={removeSelectedPhoto}
            >
              <i className="fa fa-times" />
            </button>
          </div>
        </div>
      )}

      {tempImageSrc && (
        <CropImageModal
          imageSrc={tempImageSrc}
          onClose={() => setTempImageSrc("")}
          onSave={handleCropSave}
        />
      )}
    </>
  );
}

export default function AdminDashboard() {
  const currentUser = JSON.parse(localStorage.getItem("adminUser") || "null");
  const isAdmin = currentUser?.role === "ADMIN";

  const [stats, setStats] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const userLimit = 5;

  const [userPagination, setUserPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 5
  });

  async function loadStats() {
    try {
      const { data } = await http.get("/api/admin/stats");
      setStats(data);
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("adminUser");
        toast.error("Session expired. Please login again.");
        window.location.href = "/admin/login";
        return;
      }

      setStats({ error: true });
    }
  }

  async function loadUsers(page = 1) {
    setUsersLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("page", page);
      qs.set("limit", userLimit);
      if (userSearch.trim()) qs.set("search", userSearch.trim());

      const { data } = await http.get(`/api/admin/users?${qs.toString()}`);
      const items = data.items || [];

      setUsers(items);
      setUserPagination({
        total: data.total ?? items.length,
        totalPages: data.totalPages ?? 1,
        page: data.page ?? page,
        limit: data.limit ?? userLimit
      });
      setUserPage(data.page ?? page);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load users");
      setUsers([]);
      setUserPagination({
        total: 0,
        totalPages: 1,
        page: 1,
        limit: userLimit
      });
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
    loadUsers(1);
  }, []);

  function deleteUser(user) {
    setDeleteTarget(user);
  }

  async function confirmDeleteUser() {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      setActionLoadingId(deleteTarget._id);

      await http.delete(`/api/admin/users/${deleteTarget._id}`);
      toast.success("User deleted successfully");

      const nextPage =
        users.length === 1 && userPage > 1 ? userPage - 1 : userPage;

      setDeleteTarget(null);
      await loadUsers(nextPage);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
      setActionLoadingId("");
    }
  }

  async function createUser(formData) {
    try {
      await http.post("/api/admin/users", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("User created successfully");
      setShowCreateModal(false);
      setUserSearch("");
      await loadUsers(1);
    } catch (error) {
      if (Array.isArray(error?.response?.data?.details)) {
        toast.error(error.response.data.details.join(", "));
      } else {
        toast.error(error?.response?.data?.message || "Failed to create user");
      }
      throw error;
    }
  }

  async function updateUser(id, formData) {
    try {
      setActionLoadingId(id);

      await http.put(`/api/admin/users/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("User updated successfully");
      setShowEditModal(null);
      await loadUsers(userPage);
    } catch (error) {
      if (Array.isArray(error?.response?.data?.details)) {
        toast.error(error.response.data.details.join(", "));
      } else {
        toast.error(error?.response?.data?.message || "Failed to update user");
      }
      throw error;
    } finally {
      setActionLoadingId("");
    }
  }

  function handleSearch() {
    loadUsers(1);
  }

  if (!stats) {
    return (
      <div style={{ padding: 20, fontWeight: 700, color: "var(--muted)" }}>
        Loading dashboard...
      </div>
    );
  }

  if (stats.error) {
    return (
      <div style={{ padding: 20, color: "var(--red)", fontWeight: 700 }}>
        Failed to load dashboard data.
      </div>
    );
  }

  const box = (title, value, color) => (
    <Card style={{ padding: 14 }}>
      <div
        style={{
          color: "var(--muted)",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: ".06em",
          textTransform: "uppercase"
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 950,
          marginTop: 6,
          color: color || "var(--text)"
        }}
      >
        {value}
      </div>
    </Card>
  );

  const departmentCard = (title, info) => (
    <Card style={{ padding: 14 }}>
      <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>
        {title}
      </div>

      <div style={{ color: "var(--text)", fontWeight: 700 }}>
        Total: {info?.total ?? 0}
      </div>

      <div style={{ color: "var(--green)", marginTop: 6, fontWeight: 700 }}>
        Active: {info?.active ?? 0}
      </div>

      <div style={{ color: "var(--yellow)", marginTop: 6, fontWeight: 700 }}>
        Inactive: {info?.inactive ?? 0}
      </div>
    </Card>
  );

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 14 }}>
        Dashboard
      </div>

      <div className="grid grid-2">
        {box("Total Employees", stats.total)}
        {box("Active Employees", stats.active, "var(--green)")}
        {box("Verifications Today", stats.verifyToday, "var(--green)")}
        {box("Failed Attempts Today", stats.failedToday, "var(--red)")}
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 14 }}>
          Department Overview
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16
          }}
        >
          {departmentCard(
            "Information Technology",
            stats.departments?.informationTechnology
          )}
          {departmentCard("Distribution", stats.departments?.distribution)}
          {departmentCard(
            "Customer Support Service",
            stats.departments?.customerSupport
          )}
          {departmentCard("Content", stats.departments?.content)}
          {departmentCard("Moderator", stats.departments?.moderator)}
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 950 }}>Admin / HR List</div>

        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Add Admin / HR
          </button>
        )}
      </div>

      <Card style={{ padding: 14, marginTop: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 140px",
            gap: 12,
            alignItems: "center"
          }}
        >
          <div>
            <Input
              label="Search Admin / HR"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name or email"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>

          <div style={{ paddingTop: 0 }}>
            <button
              className="btn"
              onClick={handleSearch}
              style={{
                width: "100%",
                background: "var(--green)",
                color: "#fff",
                border: "none",
                marginTop: "1px"
              }}
            >
              {usersLoading ? "Loading..." : "Search"}
            </button>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 0, marginTop: 14 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((it) => (
                <tr key={it._id}>
                  <td>
                    <img
                      src={
                        it.profileImageUrl ||
                        "https://via.placeholder.com/56?text=No+Image"
                      }
                      alt={it.name}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        objectFit: "cover",
                        border: "1px solid var(--border)"
                      }}
                    />
                  </td>

                  <td style={{ fontWeight: 800 }}>{it.name}</td>
                  <td>{it.email}</td>
                  <td>
                    <Badge tone={roleTone(it.role)}>{it.role}</Badge>
                  </td>
                  <td>{formatDate(it.createdAt)}</td>

                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "center",
                        alignItems: "center"
                      }}
                    >
                      <button
                        className="iconActionBtn"
                        onClick={() => setShowUserModal(it)}
                        disabled={actionLoadingId === it._id}
                        title="Show Details"
                        type="button"
                      >
                        <i className="fa fa-eye" />
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            className="iconActionBtn edit"
                            onClick={() => setShowEditModal(it)}
                            disabled={actionLoadingId === it._id}
                            title="Edit User"
                            type="button"
                          >
                            <i
                              className={
                                actionLoadingId === it._id
                                  ? "fa fa-spinner fa-spin"
                                  : "fa fa-pencil"
                              }
                            />
                          </button>

                          <button
                            className="iconActionBtn delete"
                            onClick={() => deleteUser(it)}
                            disabled={actionLoadingId === it._id}
                            title="Delete User"
                            type="button"
                          >
                            <i
                              className={
                                actionLoadingId === it._id
                                  ? "fa fa-spinner fa-spin"
                                  : "fa fa-trash"
                              }
                            />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!usersLoading && users.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ color: "var(--muted)" }}>
                    No users found.
                  </td>
                </tr>
              )}

              {usersLoading && (
                <tr>
                  <td colSpan="6" style={{ color: "var(--muted)" }}>
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 14,
            borderTop: "1px solid var(--border)",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <div style={{ color: "var(--muted)", fontSize: 14 }}>
            Total: {userPagination.total || users.length}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn btn-ghost"
              onClick={() => loadUsers(userPage - 1)}
              disabled={userPage <= 1 || usersLoading}
            >
              Prev
            </button>

            <div style={{ minWidth: 90, textAlign: "center", fontWeight: 700 }}>
              {userPagination.page} / {userPagination.totalPages}
            </div>

            <button
              className="btn btn-ghost"
              onClick={() => loadUsers(userPage + 1)}
              disabled={userPage >= userPagination.totalPages || usersLoading}
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {isAdmin && showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSave={createUser}
        />
      )}

      {isAdmin && showEditModal && (
        <EditUserModal
          item={showEditModal}
          loading={actionLoadingId === showEditModal._id}
          onClose={() => setShowEditModal(null)}
          onSave={updateUser}
        />
      )}

      {showUserModal && (
        <UserDetailsModal
          item={showUserModal}
          onClose={() => setShowUserModal(null)}
        />
      )}

      {deleteTarget && isAdmin && (
        <DeleteConfirmModal
          user={deleteTarget}
          loading={deleteLoading}
          onClose={() => {
            if (!deleteLoading) setDeleteTarget(null);
          }}
          onConfirm={confirmDeleteUser}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("HR");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("role", role);
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      await onSave(formData);
    } catch {
      //
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modal card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div style={{ fontWeight: 950, fontSize: 18 }}>Add Admin / HR</div>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form onSubmit={submit}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div style={{ marginBottom: 12 }}>
            <div className="label">Role</div>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="HR">HR</option>
            </select>
          </div>

          <PasswordField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <PasswordField
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <ImagePickerWithCrop
            label="Profile Photo"
            photoPreview={photoPreview}
            setPhotoPreview={setPhotoPreview}
            setPhotoFile={setPhotoFile}
          />

          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ item, loading, onClose, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [role, setRole] = useState(item?.role || "HR");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(item?.profileImageUrl || "");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("role", role);

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      await onSave(item._id, formData);
    } catch {
      //
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modal card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div style={{ fontWeight: 950, fontSize: 18 }}>Edit Admin / HR</div>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            type="button"
            disabled={saving || loading}
          >
            Close
          </button>
        </div>

        <form onSubmit={submit}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input label="Email" value={item?.email || ""} disabled />

          <div style={{ marginBottom: 12 }}>
            <div className="label">Role</div>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="HR">HR</option>
            </select>
          </div>

          <ImagePickerWithCrop
            label="Profile Photo"
            photoPreview={photoPreview}
            setPhotoPreview={setPhotoPreview}
            setPhotoFile={setPhotoFile}
          />

          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={saving || loading}
          >
            {saving || loading ? "Updating..." : "Update"}
          </button>
        </form>
      </div>
    </div>
  );
}

function UserDetailsModal({ item, onClose }) {
  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div
        className="modal card"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 700 }}
      >
        <div className="modalHeader">
          <div style={{ fontWeight: 950, fontSize: 18 }}>Admin / HR Details</div>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: 18,
            alignItems: "start"
          }}
        >
          <div>
            <img
              src={
                item.profileImageUrl ||
                "https://via.placeholder.com/120?text=No+Image"
              }
              alt={item.name}
              style={{
                width: 120,
                height: 120,
                borderRadius: 18,
                objectFit: "cover",
                border: "1px solid var(--border)"
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
              {item.name}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <strong>Email:</strong> {item.email}
              </div>
              <div>
                <strong>Role:</strong>{" "}
                <Badge tone={roleTone(item.role)}>{item.role}</Badge>
              </div>
              <div>
                <strong>Created:</strong> {formatDate(item.createdAt)}
              </div>
              <div>
                <strong>Updated:</strong> {formatDate(item.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ user, loading, onClose, onConfirm }) {
  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div
        className="modal card"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 460, padding: 24 }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center"
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: 16,
              background: "rgba(220,38,38,.12)",
              color: "var(--red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              marginBottom: 16
            }}
          >
            <i className="fa fa-trash" />
          </div>

          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>
            Delete User?
          </div>

          <div
            style={{
              color: "var(--muted)",
              lineHeight: 1.6,
              marginBottom: 20
            }}
          >
            Are you sure you want to delete <strong>{user.name}</strong>
            <br />({user.email})?
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              width: "100%",
              justifyContent: "center"
            }}
          >
            <button
              className="btn btn-ghost"
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ minWidth: 120 }}
            >
              Cancel
            </button>

            <button
              className="btn"
              type="button"
              onClick={onConfirm}
              disabled={loading}
              style={{
                minWidth: 120,
                background: "var(--red)",
                color: "#fff",
                border: "none"
              }}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}