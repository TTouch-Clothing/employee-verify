import { useEffect, useState } from "react";
import { http } from "../api/http";
import Card from "../components/Card";
import Input from "../components/Input";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

const DEPARTMENTS = [
  "ALL",
  "Information Technology",
  "Distribution",
  "Customer Support Service",
  "Content",
  "Moderator"
];

function tone(st) {
  return st === "ACTIVE" ? "green" : st === "INACTIVE" ? "yellow" : "red";
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month}, ${year}`;
}

function getDuration(item) {
  const join = item?.joinDate ? formatDate(item.joinDate) : "-";
  const end = item?.endDate ? formatDate(item.endDate) : "Present";
  return `${join} → ${end}`;
}

export default function EmployeesPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [department, setDepartment] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 10
  });

  async function load(nextPage = 1) {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set("search", search.trim());
      if (status !== "ALL") qs.set("status", status);
      if (department !== "ALL") qs.set("department", department);
      qs.set("page", nextPage);
      qs.set("limit", limit);

      const { data } = await http.get(`/api/admin/employees?${qs.toString()}`);
      const loadedItems = data.items || [];

      setItems(loadedItems);
      setPagination({
        total: data.total ?? loadedItems.length,
        totalPages: data.totalPages ?? 1,
        page: data.page ?? nextPage,
        limit: data.limit ?? limit
      });
      setPage(data.page ?? nextPage);
    } catch (error) {
      console.error("Failed to load employees:", error);
      toast.error("Failed to load employees");
      setItems([]);
      setPagination({
        total: 0,
        totalPages: 1,
        page: 1,
        limit
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  async function saveEmployee(payload) {
    try {
      if (modal.mode === "add") {
        await http.post("/api/admin/employees", payload, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        toast.success("Employee added successfully");
      } else {
        await http.put(`/api/admin/employees/${modal.item._id}`, payload, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        toast.success("Employee updated successfully");
      }

      setModal(null);
      load(page);
    } catch (ex) {
      console.error(ex);

      if (Array.isArray(ex?.response?.data?.details)) {
        toast.error(
          ex.response.data.details.map((d) => d.message || d).join(", ")
        );
      } else {
        toast.error(ex?.response?.data?.message || "Failed to save employee");
      }

      throw ex;
    }
  }

  function removeEmployee(item) {
    setDeleteTarget(item);
  }

  async function confirmDeleteEmployee() {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      setActionLoadingId(deleteTarget._id);

      await http.delete(`/api/admin/employees/${deleteTarget._id}`);
      toast.success("Employee deleted successfully");

      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      setDeleteTarget(null);
      await load(nextPage);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(error?.response?.data?.message || "Failed to delete employee");
    } finally {
      setDeleteLoading(false);
      setActionLoadingId("");
    }
  }

  function handleSearch() {
    load(1);
  }

  return (
    <div>
      <div className="employeesPageHeader">
        <div style={{ fontSize: 22, fontWeight: 950 }}>Employees</div>
        <button
          className="btn btn-primary employeesAddBtn"
          onClick={() => setModal({ mode: "add" })}
          type="button"
        >
          + Add Employee
        </button>
      </div>

      <Card style={{ padding: 14, marginTop: 14 }}>
        <div className="employeesFilterGrid">
          <div>
            <Input
              label="Search (ID or Name)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="TT-000123 or Name"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>

          <div>
            <div className="label">Department</div>
            <select
              className="input"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {DEPARTMENTS.map((dep) => (
                <option key={dep} value={dep}>
                  {dep === "ALL" ? "All Departments" : dep}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="label">Status</div>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>

          <div>
            <button
              className="btn employeesSearchBtn"
              onClick={handleSearch}
              type="button"
              style={{
                width: "100%",
                background: "var(--green)",
                color: "#fff",
                border: "none"
              }}
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 0, marginTop: 14 }}>
        <div className="tableWrap">
          <table className="table employeesTable">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Photo</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Updated</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((it) => (
                <tr key={it._id}>
                  <td style={{ fontWeight: 800 }}>{it.employeeId}</td>

                  <td>
                    <img
                      src={
                        it.photoUrl ||
                        "https://via.placeholder.com/56?text=No+Image"
                      }
                      alt={it.fullName}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 10,
                        objectFit: "cover",
                        border: "1px solid var(--border)"
                      }}
                    />
                  </td>

                  <td>{it.fullName}</td>
                  <td>{it.department}</td>
                  <td>{it.designation}</td>

                  <td>
                    <Badge tone={tone(it.status)}>{it.status}</Badge>
                  </td>

                  <td>{new Date(it.updatedAt).toLocaleDateString()}</td>

                  <td>
                    <div className="employeeActionGroup">
                      <button
                        className="iconActionBtn"
                        onClick={() => setShowModal(it)}
                        disabled={actionLoadingId === it._id}
                        title="Show Details"
                        type="button"
                      >
                        <i className="fa fa-eye" />
                      </button>

                      <button
                        className="iconActionBtn edit"
                        onClick={() => setModal({ mode: "edit", item: it })}
                        disabled={actionLoadingId === it._id}
                        title="Edit Employee"
                        type="button"
                      >
                        <i className="fa fa-pen" />
                      </button>

                      <button
                        className="iconActionBtn delete"
                        onClick={() => removeEmployee(it)}
                        disabled={actionLoadingId === it._id}
                        title="Delete Employee"
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
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ color: "var(--muted)" }}>
                    No employees found.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="8" style={{ color: "var(--muted)" }}>
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="employeesPaginationBar">
          <div style={{ color: "var(--muted)", fontSize: 14 }}>
            Total: {pagination.total || items.length}
          </div>

          <div className="employeesPaginationControls">
            <button
              className="btn btn-ghost"
              onClick={() => load(page - 1)}
              disabled={page <= 1 || loading}
              type="button"
            >
              Prev
            </button>

            <div className="employeesPageIndicator">
              {pagination.page} / {pagination.totalPages}
            </div>

            <button
              className="btn btn-ghost"
              onClick={() => load(page + 1)}
              disabled={page >= pagination.totalPages || loading}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {modal && (
        <EmployeeModal
          modal={modal}
          onClose={() => setModal(null)}
          onSave={saveEmployee}
        />
      )}

      {showModal && (
        <EmployeeDetailsModal
          item={showModal}
          onClose={() => setShowModal(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          item={deleteTarget}
          loading={deleteLoading}
          onClose={() => {
            if (!deleteLoading) setDeleteTarget(null);
          }}
          onConfirm={confirmDeleteEmployee}
        />
      )}
    </div>
  );
}

function EmployeeModal({ modal, onClose, onSave }) {
  const isEdit = modal.mode === "edit";
  const it = modal.item || {};

  const departmentOptions = DEPARTMENTS.filter((d) => d !== "ALL");

  const [employeeId, setEmployeeId] = useState(it.employeeId || "");
  const [fullName, setFullName] = useState(it.fullName || "");
  const [department, setDepartment] = useState(
    it.department || "Information Technology"
  );
  const [designation, setDesignation] = useState(it.designation || "");
  const [status, setStatus] = useState(it.status || "ACTIVE");
  const [secret, setSecret] = useState("");
  const [joinDate, setJoinDate] = useState(
    it.joinDate ? new Date(it.joinDate).toISOString().slice(0, 10) : ""
  );
  const [endDate, setEndDate] = useState(
    it.endDate ? new Date(it.endDate).toISOString().slice(0, 10) : ""
  );
  const [isPresent, setIsPresent] = useState(!it.endDate);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(it.photoUrl || "");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();

      if (!isEdit) {
        formData.append("employeeId", employeeId.trim());
        formData.append("secret", secret.trim());
      }

      formData.append("fullName", fullName.trim());
      formData.append("department", department);
      formData.append("designation", designation.trim());
      formData.append("status", status);

      if (joinDate) formData.append("joinDate", joinDate);

      if (!isPresent && endDate) {
        formData.append("endDate", endDate);
      }

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      await onSave(formData);
    } catch (ex) {
      console.error(ex);
    } finally {
      setSaving(false);
    }
  }

  function handlePresentChange(e) {
    const checked = e.target.checked;
    setIsPresent(checked);
    if (checked) {
      setEndDate("");
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);

    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(it.photoUrl || "");
    }
  }

  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modal card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div style={{ fontWeight: 950, fontSize: 18 }}>
            {isEdit ? "Edit Employee" : "Add Employee"}
          </div>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form onSubmit={submit}>
          {!isEdit && (
            <>
              <Input
                label="Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="TT-000123"
              />
              <Input
                label="Date of Birth (YYYY-MM-DD)"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="1999-08-05"
              />
            </>
          )}

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div style={{ marginBottom: 12 }}>
            <div className="label">Department</div>
            <select
              className="input"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departmentOptions.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />

          <div style={{ marginBottom: 12 }}>
            <div className="label">Status</div>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="TERMINATED">TERMINATED</option>
            </select>
          </div>

          <Input
            label="Join Date"
            type="date"
            value={joinDate}
            onChange={(e) => setJoinDate(e.target.value)}
          />

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8
              }}
            >
              <div className="label" style={{ margin: 0 }}>
                Present
              </div>

              <label
                style={{
                  position: "relative",
                  display: "inline-flex",
                  width: 46,
                  height: 26,
                  cursor: "pointer"
                }}
              >
                <input
                  type="checkbox"
                  checked={isPresent}
                  onChange={handlePresentChange}
                  style={{ display: "none" }}
                />
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: isPresent ? "#2563EB" : "#CBD5E1",
                    borderRadius: 999,
                    transition: "0.2s"
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: isPresent ? 23 : 3,
                    width: 20,
                    height: 20,
                    background: "#fff",
                    borderRadius: "50%",
                    transition: "0.2s",
                    boxShadow: "0 1px 2px rgba(0,0,0,.2)"
                  }}
                />
              </label>
            </div>

            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isPresent}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="label">Employee Photo</div>
            <input
              className="input"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handlePhotoChange}
              style={{ padding: "10px 12px", height: "auto" }}
            />
          </div>

          {photoPreview && (
            <div style={{ marginBottom: 12 }}>
              <div className="label">
                {photoFile ? "Selected Photo Preview" : "Current Photo"}
              </div>
              <img
                src={photoPreview}
                alt="Employee preview"
                style={{
                  width: 120,
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid var(--border)"
                }}
              />
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EmployeeDetailsModal({ item, onClose }) {
  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div
        className="modal card"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 700 }}
      >
        <div className="modalHeader">
          <div style={{ fontWeight: 950, fontSize: 18 }}>Employee Details</div>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="employeeDetailsGrid">
          <div className="employeeDetailsPhotoWrap">
            <img
              src={
                item.photoUrl || "https://via.placeholder.com/120?text=No+Image"
              }
              alt={item.fullName}
              style={{
                width: 120,
                height: 120,
                borderRadius: 16,
                objectFit: "cover",
                border: "1px solid var(--border)"
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
              {item.fullName}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <strong>Employee ID:</strong> {item.employeeId}
              </div>
              <div>
                <strong>Department:</strong> {item.department}
              </div>
              <div>
                <strong>Designation:</strong> {item.designation}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <Badge tone={tone(item.status)}>{item.status}</Badge>
              </div>
              <div>
                <strong>Join Date:</strong> {formatDate(item.joinDate)}
              </div>
              <div>
                <strong>End Date:</strong>{" "}
                {item.endDate ? formatDate(item.endDate) : "Present"}
              </div>
              <div>
                <strong>Duration:</strong> {getDuration(item)}
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

function DeleteConfirmModal({ item, loading, onClose, onConfirm }) {
  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div
        className="modal card deleteConfirmModal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="deleteConfirmInner">
          <div className="deleteConfirmIcon">
            <i className="fa fa-trash" />
          </div>

          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>
            Delete Employee?
          </div>

          <div
            style={{
              color: "var(--muted)",
              lineHeight: 1.6,
              marginBottom: 20
            }}
          >
            Are you sure you want to delete
            <br />
            <strong>
              {item.employeeId} - {item.fullName}
            </strong>
            ?
          </div>

          <div className="deleteConfirmActions">
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