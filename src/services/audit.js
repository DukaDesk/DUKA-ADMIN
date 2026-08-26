const STORAGE_KEY = "dukadesk_admin_audit";
const MAX_EVENTS = 100;

export function recordAuditEvent({ admin, action, target, metadata = {} }) {
  const event = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: new Date().toISOString(),
    actor: admin?.email || "unknown",
    role: admin?.role || "unknown",
    action,
    target,
    metadata,
  };

  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    localStorage.setItem(STORAGE_KEY, JSON.stringify([event, ...current].slice(0, MAX_EVENTS)));
  } catch {
    // Audit persistence must never prevent a user from completing an authorized action.
  }

  return event;
}

export function getAuditEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
