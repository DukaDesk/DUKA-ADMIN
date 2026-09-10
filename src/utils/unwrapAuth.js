export function unwrapAuth(raw) {
  if (!raw || typeof raw !== "object") return { token: null, admin: {} };
  let cur = raw;
  // unwrap {success, data: {...}} envelope once
  if (cur.success !== undefined && cur.data && typeof cur.data === "object" && !Array.isArray(cur.data)) {
    // only unwrap if data looks like auth payload, not just {message}
    const inner = cur.data;
    if (inner.token || inner.accessToken || inner.access_token || inner.jwt || inner.admin || inner.user || inner.email || inner.role) {
      cur = inner;
    }
  }
  // unwrap nested data.data
  if (cur.data && typeof cur.data === "object" && !Array.isArray(cur.data) && (cur.data.token || cur.data.accessToken || cur.data.admin || cur.data.user)) {
    cur = cur.data;
  }
  const token = cur?.token ?? cur?.accessToken ?? cur?.access_token ?? cur?.jwt ?? null;
  let adminSrc = cur?.admin ?? cur?.user ?? cur?.profile ?? cur?.data?.admin ?? cur?.data?.user ?? null;
  // handle roles array like {roles:["admin"]} or {role:"admin"} at top level
  if (!adminSrc && (cur?.roles || cur?.role)) adminSrc = cur;
  const admin = adminSrc && typeof adminSrc === "object" ? adminSrc : cur;
  const clean = { ...admin };
  // normalize roles array to role string
  if (Array.isArray(clean.roles) && clean.roles[0] && !clean.role) clean.role = clean.roles[0];
  if (Array.isArray(clean.role) && clean.role[0]) clean.role = clean.role[0];
  delete clean.success;
  delete clean.message;
  delete clean.data;
  delete clean.token;
  delete clean.accessToken;
  delete clean.access_token;
  delete clean.jwt;
  delete clean.roles;
  return { token, admin: clean };
}
