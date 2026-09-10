export function maskEmail(email) {
  if (!email || typeof email !== "string" || !email.includes("@")) return "•••@•••";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local.slice(-1)}@${domain}`;
}
