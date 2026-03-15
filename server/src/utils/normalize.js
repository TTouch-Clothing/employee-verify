export function normalizeEmployeeId(v) {
  return String(v || "").trim().toUpperCase();
}
export function normalizeSecret(v) {
  return String(v || "").trim();
}
