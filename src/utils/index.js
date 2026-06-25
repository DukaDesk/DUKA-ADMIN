export const NAVY = "#1A1A2E";
export const AMBER = "#F4A026";

export const statusStyles = {
  Active: { bg: "#F0FDF4", color: "#065F46" },
  Suspended: { bg: "#FFF8ED", color: "#92400E" },
  Banned: { bg: "#FEF2F2", color: "#991B1B" },
  Live: { bg: "#F0FDF4", color: "#065F46" },
  Draft: { bg: "#F3F4F6", color: "#6B7280" },
  "Under Review": { bg: "#FFF8ED", color: "#92400E" },
  Rejected: { bg: "#FEF2F2", color: "#991B1B" },
  Resolved: { bg: "#F0FDF4", color: "#065F46" },
};

export const planStyles = {
  Starter: { bg: "#F3F4F6", color: "#6B7280" },
  Growth: { bg: "#FFF8ED", color: "#92400E" },
  Business: { bg: `${NAVY}11`, color: NAVY },
  Enterprise: { bg: "#EDE9FE", color: "#5B21B6" },
};

export const priorityStyles = {
  Critical: { bg: "#FEF2F2", color: "#991B1B", dot: "#E74C3C" },
  High: { bg: "#FFF7ED", color: "#92400E", dot: "#F59E0B" },
  Medium: { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" },
};

export const typeStyles = {
  Fraud: "#E74C3C",
  Harassment: "#E74C3C",
  Spam: "#6B7280",
  "Fake Business": "#F59E0B",
  Scam: "#F59E0B",
};

export const PIE_COLORS = [AMBER, NAVY, "#2ECC71", "#7C3AED", "#E74C3C", "#0D9488"];

export const toastConfig = {
  success: { bg: "#F0FDF4", border: "#2ECC71", text: "#065F46", icon: "✓" },
  error: { bg: "#FEF2F2", border: "#E74C3C", text: "#991B1B", icon: "✕" },
  info: { bg: "#FFF8ED", border: AMBER, text: "#92400E", icon: "ℹ" },
  warning: { bg: "#FFFBEB", border: "#F59E0B", text: "#92400E", icon: "⚠" },
};
