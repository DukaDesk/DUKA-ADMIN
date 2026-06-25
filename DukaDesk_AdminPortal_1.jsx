import { useState } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";


// ═══════════════════════════════════════════
// AdminLogin
// ═══════════════════════════════════════════

const NAVY = "#1A1A2E", AMBER = "#F4A026";

export default function AdminLogin({ onLogin, showToast }) {
  const [step, setStep]       = useState("credentials"); // credentials | 2fa
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleCredentials = (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your credentials."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("2fa"); }, 1200);
  };

  const handleOtp = (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ name: "Super Admin", email, role: "super_admin" });
      showToast("Welcome back, Super Admin!", "success");
    }, 1000);
  };

  const handleOtpInput = (val, idx) => {
    const next = [...otp];
    next[idx] = val.replace(/\D/, "").slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Left panel */}
      <div style={{ width: 520, background: NAVY, minHeight: "100vh", display: "flex", flexDirection: "column", padding: "48px 56px", position: "sticky", top: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 64 }}>
          <div style={{ width: 38, height: 38, background: AMBER, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: NAVY, fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20 }}>D</span>
          </div>
          <div>
            <span style={{ color: "#fff", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20 }}>DukaDesk</span>
            <div style={{ background: "#E74C3C", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, display: "inline-block", marginLeft: 8 }}>ADMIN</div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 44, color: "#fff", margin: "0 0 16px", lineHeight: 1.1 }}>
            Platform <span style={{ color: AMBER }}>Command</span> Centre
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: 17, margin: "0 0 48px", lineHeight: 1.6 }}>
            Full visibility and control over every merchant, user, app, and transaction on DukaDesk.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { icon: "👥", label: "48,204 Users", sub: "Merchants & consumers" },
              { icon: "📱", label: "1,592 Live Apps", sub: "Active mini-apps" },
              { icon: "💰", label: "₦9.2M MRR", sub: "Monthly recurring revenue" },
              { icon: "🛡️", label: "23 Open Reports", sub: "Awaiting moderation" },
            ].map((stat, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, background: "rgba(244,160,38,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{stat.icon}</div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{stat.label}</div>
                  <div style={{ color: "#6B7280", fontSize: 12 }}>{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 48, padding: "16px", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 10 }}>
          <div style={{ color: "#FCA5A5", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>🔒 Restricted Access</div>
          <div style={{ color: "#9CA3AF", fontSize: 12 }}>This portal is for authorised DukaDesk team members only. Unauthorised access is prohibited.</div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {step === "credentials" && (
            <>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 30, color: NAVY, margin: "0 0 8px" }}>Admin Sign In</h2>
              <p style={{ color: "#6B7280", fontSize: 15, margin: "0 0 32px" }}>Enter your credentials to access the admin portal.</p>

              {error && <ErrBanner msg={error} />}

              <form onSubmit={handleCredentials}>
                <Field label="Admin Email" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="admin@dukadesk.com" />
                <div style={{ position: "relative" }}>
                  <Field label="Password" type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }} placeholder="Your secure password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, top: 38, background: "none", border: "none", color: "#6B7280", fontSize: 13, cursor: "pointer" }}>{showPw ? "Hide" : "Show"}</button>
                </div>
                <div style={{ textAlign: "right", marginBottom: 24 }}>
                  <span style={{ color: AMBER, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Forgot password?</span>
                </div>
                <PrimaryBtn loading={loading}>{loading ? "Verifying..." : "Continue →"}</PrimaryBtn>
              </form>

              <div style={{ marginTop: 24, padding: 16, background: "#F9FAFB", borderRadius: 10, border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, fontWeight: 600 }}>Demo credentials</div>
                <div style={{ fontSize: 13, color: "#374151" }}>
                  Email: <strong>admin@dukadesk.com</strong><br />
                  Password: <strong>any value works</strong>
                </div>
                <button onClick={() => { setEmail("admin@dukadesk.com"); setPassword("admin123"); }} style={{ marginTop: 8, background: AMBER, color: NAVY, border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Auto-fill</button>
              </div>
            </>
          )}

          {step === "2fa" && (
            <>
              <div style={{ width: 64, height: 64, background: "#FFF8ED", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 0 20px" }}>🔐</div>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 30, color: NAVY, margin: "0 0 8px" }}>Two-Factor Authentication</h2>
              <p style={{ color: "#6B7280", fontSize: 15, margin: "0 0 8px" }}>Enter the 6-digit code sent to</p>
              <p style={{ color: NAVY, fontWeight: 600, fontSize: 15, margin: "0 0 32px" }}>{email}</p>

              {error && <ErrBanner msg={error} />}

              <form onSubmit={handleOtp}>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
                  {otp.map((v, i) => (
                    <input
                      key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={v}
                      onChange={e => handleOtpInput(e.target.value, i)}
                      onKeyDown={e => handleOtpKeyDown(e, i)}
                      style={{ width: 52, height: 60, textAlign: "center", fontSize: 24, fontWeight: 700, fontFamily: "'Sora',sans-serif", border: `2px solid ${v ? AMBER : "#E5E7EB"}`, borderRadius: 10, outline: "none", color: NAVY, background: v ? "#FFF8ED" : "#fff", transition: "all 0.15s" }}
                      onFocus={e => e.target.style.borderColor = AMBER}
                      onBlur={e => e.target.style.borderColor = v ? AMBER : "#E5E7EB"}
                    />
                  ))}
                </div>
                <PrimaryBtn loading={loading}>{loading ? "Verifying..." : "Verify & Sign In"}</PrimaryBtn>
              </form>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button onClick={() => { setOtp(["1","2","3","4","5","6"]); showToast("Code auto-filled for demo", "info"); }} style={{ background: AMBER, color: NAVY, border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 }}>Demo: Auto-fill code</button>
                <button onClick={() => setStep("credentials")} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 13, cursor: "pointer" }}>← Back</button>
              </div>

              <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#9CA3AF" }}>
                Didn't receive it? <span style={{ color: AMBER, cursor: "pointer", fontWeight: 500 }}>Resend code</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>{label}</label>
      <input style={{ width: "100%", height: 52, border: `1px solid ${error ? "#E74C3C" : "#E5E7EB"}`, borderRadius: 8, padding: "0 14px", fontSize: 15, color: NAVY, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#fff" }} {...props}
        onFocus={e => e.target.style.borderColor = AMBER}
        onBlur={e => e.target.style.borderColor = error ? "#E74C3C" : "#E5E7EB"} />
      {error && <p style={{ color: "#E74C3C", fontSize: 12, margin: "4px 0 0" }}>⚠ {error}</p>}
    </div>
  );
}

function PrimaryBtn({ children, loading }) {
  return (
    <button type="submit" disabled={loading} style={{ width: "100%", height: 52, background: loading ? "#D1D5DB" : AMBER, color: NAVY, border: "none", borderRadius: 28, fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16, cursor: loading ? "wait" : "pointer" }}>
      {children}
    </button>
  );
}

function ErrBanner({ msg }) {
  return (
    <div style={{ background: "#FEF2F2", border: "1px solid #E74C3C", borderRadius: 8, padding: "12px 16px", color: "#991B1B", fontSize: 14, marginBottom: 20 }}>⚠ {msg}</div>
  );
}


// ═══════════════════════════════════════════
// AdminSidebar
// ═══════════════════════════════════════════

const NAVY = "#1A1A2E", AMBER = "#F4A026";

const navItems = [
  { id: "dashboard", icon: "📊", label: "Overview" },
  { id: "users",     icon: "👥", label: "Users" },
  { id: "merchants", icon: "🏪", label: "Merchants" },
  { id: "apps",      icon: "📱", label: "Apps", badge: 8 },
  { id: "reports",   icon: "🛡️", label: "Moderation", badge: 23, badgeColor: "#E74C3C" },
  { id: "revenue",   icon: "💰", label: "Revenue" },
  { id: "waitlist",  icon: "📋", label: "Waitlist" },
  { id: "settings",  icon: "⚙️", label: "Settings" },
];

export function AdminSidebar({ page, setPage, admin }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ width: collapsed ? 68 : 260, background: NAVY, minHeight: "100vh", display: "flex", flexDirection: "column", transition: "width 0.25s ease", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? "24px 14px" : "24px 20px", borderBottom: "1px solid #252547", display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
        <div style={{ width: 38, height: 38, background: AMBER, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: NAVY, fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20 }}>D</span>
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: "#fff", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16 }}>DukaDesk</div>
            <span style={{ background: "#E74C3C", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>ADMIN PORTAL</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {navItems.map(item => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id)} title={collapsed ? item.label : ""} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "13px 0" : "13px 20px", justifyContent: collapsed ? "center" : "flex-start", background: active ? "#252547" : "transparent", border: "none", borderLeft: active ? `3px solid ${AMBER}` : "3px solid transparent", cursor: "pointer", transition: "all 0.15s" }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span style={{ color: active ? AMBER : "#D1D5DB", fontSize: 14, fontWeight: active ? 600 : 400, flex: 1, textAlign: "left" }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background: item.badgeColor || AMBER, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 12, minWidth: 20, textAlign: "center" }}>{item.badge}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom profile */}
      <div style={{ padding: collapsed ? "16px 0" : "16px 20px", borderTop: "1px solid #252547" }}>
        {!collapsed && admin && (
          <div style={{ background: "#252547", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, background: "#E74C3C", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>SA</div>
              <div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{admin.name}</div>
                <div style={{ color: "#9CA3AF", fontSize: 11 }}>Super Admin</div>
              </div>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: "#252547", border: "none", color: "#9CA3AF", padding: "8px", cursor: "pointer", fontSize: 13, width: "100%", borderRadius: 6 }}>{collapsed ? "→" : "← Collapse"}</button>
      </div>
    </div>
  );
}

export function AdminTopbar({ page, showToast, setPage }) {
  const labels = { dashboard: "Platform Overview", users: "User Management", merchants: "Merchant Management", apps: "App Moderation", reports: "Reports Queue", revenue: "Revenue Dashboard", waitlist: "Waitlist Management", settings: "Settings" };
  const [notifOpen, setNotifOpen] = useState(false);

  const notifs = [
    { icon: "🛡️", text: "3 critical reports need review", time: "2 min ago", urgent: true },
    { icon: "📱", text: "Mama's Kitchen app submitted for review", time: "15 min ago" },
    { icon: "💰", text: "MRR milestone: ₦9M reached", time: "1 hr ago" },
    { icon: "👥", text: "50 new merchant signups today", time: "3 hrs ago" },
  ];

  return (
    <div style={{ height: 64, background: "#fff", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", padding: "0 32px", gap: 16, flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, margin: 0 }}>{labels[page] || "Admin"}</h1>
      </div>

      {/* Alert banner if critical */}
      <div style={{ background: "#FFF8ED", border: "1px solid #F4A026", borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setPage("reports")}>
        <span style={{ fontSize: 14 }}>⚠️</span>
        <span style={{ fontSize: 13, color: "#92400E", fontWeight: 500 }}>3 critical reports</span>
        <span style={{ fontSize: 13, color: AMBER, fontWeight: 600 }}>Review →</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F3F4F6", borderRadius: 8, padding: "8px 12px", width: 220 }}>
        <span style={{ color: "#9CA3AF" }}>🔍</span>
        <input placeholder="Search platform..." style={{ background: "none", border: "none", outline: "none", fontSize: 14, color: NAVY, flex: 1, fontFamily: "inherit" }} />
      </div>

      {/* Notifications */}
      <div style={{ position: "relative" }}>
        <button onClick={() => setNotifOpen(!notifOpen)} style={{ position: "relative", background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 4 }}>
          🔔
          <span style={{ position: "absolute", top: 0, right: 0, background: "#E74C3C", color: "#fff", fontSize: 10, fontWeight: 700, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>4</span>
        </button>
        {notifOpen && (
          <>
            <div onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
            <div style={{ position: "absolute", top: 44, right: 0, width: 360, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #E5E7EB", zIndex: 50, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: NAVY }}>Notifications</span>
                <span onClick={() => { setNotifOpen(false); showToast("All marked as read", "success"); }} style={{ fontSize: 12, color: AMBER, cursor: "pointer", fontWeight: 500 }}>Mark all read</span>
              </div>
              {notifs.map((n, i) => (
                <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", background: n.urgent ? "#FFF8ED" : "#fff", display: "flex", gap: 10, cursor: "pointer" }} onClick={() => { setNotifOpen(false); if (n.urgent) setPage("reports"); }}>
                  <span style={{ fontSize: 20 }}>{n.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: NAVY, fontWeight: n.urgent ? 600 : 400 }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{n.time}</div>
                  </div>
                  {n.urgent && <span style={{ background: "#E74C3C", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 8, alignSelf: "flex-start" }}>URGENT</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ width: 36, height: 36, background: "#E74C3C", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 13, cursor: "pointer" }}>SA</div>
    </div>
  );
}

export default AdminSidebar;


// ═══════════════════════════════════════════
// AdminDashboard
// ═══════════════════════════════════════════

const NAVY = "#1A1A2E", AMBER = "#F4A026";

const revData = [{ m: "Jan", v: 3200000 }, { m: "Feb", v: 4100000 }, { m: "Mar", v: 5500000 }, { m: "Apr", v: 4900000 }, { m: "May", v: 7800000 }, { m: "Jun", v: 9200000 }];
const userGrowth = [{ w: "W1", users: 1200 }, { w: "W2", users: 1850 }, { w: "W3", users: 2400 }, { w: "W4", users: 2847 }];
const appsBycat = [{ cat: "Restaurant", count: 420 }, { cat: "Ecommerce", count: 380 }, { cat: "Grocery", count: 210 }, { cat: "Church", count: 180 }, { cat: "School", count: 150 }, { cat: "Booking", count: 252 }];
const recentMerchants = [
  { name: "Ada Okafor",    biz: "Mama's Kitchen",  plan: "Starter",  status: "Active",    apps: 1, joined: "Jun 22" },
  { name: "Ibrahim Musa",  biz: "IB Fashions",     plan: "Growth",   status: "Active",    apps: 2, joined: "Jun 21" },
  { name: "Grace Eze",     biz: "Grace Salon",     plan: "Business", status: "Active",    apps: 1, joined: "Jun 20" },
  { name: "Emeka Obi",     biz: "Emeka Groceries", plan: "Starter",  status: "Suspended", apps: 1, joined: "Jun 19" },
  { name: "Fatima Bello",  biz: "Fatima's Bakes",  plan: "Growth",   status: "Active",    apps: 3, joined: "Jun 18" },
];
const pendingApps = [
  { merchant: "Ada Okafor",   app: "Mama's Kitchen",  time: "2 hrs ago" },
  { merchant: "New Founder",  app: "Fresh Mart",      time: "4 hrs ago" },
  { merchant: "David Church", app: "Grace Assembly",  time: "5 hrs ago" },
];
const PIE_COLORS = [AMBER, NAVY, "#2ECC71", "#7C3AED", "#E74C3C", "#0D9488"];

export default function AdminDashboard({ setPage, showToast }) {
  return (
    <div>
      {/* Critical alert */}
      <div style={{ background: "#FEF2F2", border: "1px solid #E74C3C", borderRadius: 10, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>🚨</span>
        <span style={{ flex: 1, fontSize: 14, color: "#991B1B", fontWeight: 500 }}>3 critical reports require immediate review. Merchants may be engaging in fraudulent activity.</span>
        <button onClick={() => setPage("reports")} style={{ background: "#E74C3C", color: "#fff", border: "none", borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Review Now →</button>
        <button onClick={() => {}} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 18 }}>×</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Users",    value: "48,204",  trend: "+1,240 this month", up: true,  color: NAVY  },
          { label: "Total Merchants",value: "2,847",   trend: "+89 this month",    up: true,  color: AMBER },
          { label: "Published Apps", value: "1,592",   trend: "+34 this week",     up: true,  color: NAVY  },
          { label: "Platform MRR",   value: "₦9.2M",   trend: "+18% vs last month",up: true, color: AMBER },
          { label: "Open Reports",   value: "23",      trend: "3 Critical ⚡",     up: false, color: "#E74C3C" },
        ].map((k, i) => (
          <div key={i} onClick={i === 4 ? () => setPage("reports") : undefined} style={{ background: "#fff", borderRadius: 12, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", cursor: i === 4 ? "pointer" : "default", border: i === 4 ? "1px solid #FECACA" : "none" }}>
            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 28, color: k.color, marginBottom: 6 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: k.up ? "#2ECC71" : "#E74C3C", fontWeight: 500 }}>{k.up ? "↑ " : "⚡ "}{k.trend}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 16, color: NAVY, marginBottom: 20 }}>Revenue Growth (6 Months)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={v => [`₦${(v/1000000).toFixed(2)}M`, "MRR"]} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
              <Line type="monotone" dataKey="v" stroke={AMBER} strokeWidth={3} dot={{ fill: AMBER, r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 15, color: NAVY, marginBottom: 16 }}>Apps by Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={appsBycat} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="count">
                {appsBycat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 8, border: "none" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 15, color: NAVY, marginBottom: 16 }}>Merchant Growth</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="w" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none" }} />
              <Bar dataKey="users" fill={NAVY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables row */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
        {/* Recent merchants */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 16, color: NAVY }}>Recent Merchants</span>
            <button onClick={() => setPage("merchants")} style={{ background: "none", border: "none", color: AMBER, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>View All →</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Merchant", "Business", "Plan", "Status", "Apps", "Joined"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentMerchants.map((m, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, background: AMBER, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: NAVY, flexShrink: 0 }}>{m.name[0]}</div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: NAVY }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "#6B7280" }}>{m.biz}</td>
                  <td style={{ padding: "12px 12px" }}><PlanBadge plan={m.plan} /></td>
                  <td style={{ padding: "12px 12px" }}><StatusBadge status={m.status} /></td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: NAVY, fontWeight: 600 }}>{m.apps}</td>
                  <td style={{ padding: "12px 12px", fontSize: 12, color: "#9CA3AF" }}>{m.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pending moderation */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 16, color: NAVY }}>Pending Moderation</span>
            <button onClick={() => setPage("apps")} style={{ background: "none", border: "none", color: AMBER, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Queue →</button>
          </div>
          {pendingApps.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < pendingApps.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <div style={{ width: 40, height: 40, background: "#F3F4F6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📱</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{a.app}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>by {a.merchant} · {a.time}</div>
              </div>
              <button onClick={() => setPage("apps")} style={{ background: AMBER, color: NAVY, border: "none", borderRadius: 16, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Review →</button>
            </div>
          ))}
          <button onClick={() => setPage("apps")} style={{ width: "100%", marginTop: 16, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: 12, fontSize: 13, color: NAVY, fontWeight: 500, cursor: "pointer" }}>View all 8 pending apps →</button>
        </div>
      </div>
    </div>
  );
}

export function PlanBadge({ plan }) {
  const map = { Starter: { bg: "#F3F4F6", color: "#6B7280" }, Growth: { bg: "#FFF8ED", color: "#92400E" }, Business: { bg: `${NAVY}11`, color: NAVY }, Enterprise: { bg: "#EDE9FE", color: "#5B21B6" } };
  const s = map[plan] || map.Starter;
  return <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 10 }}>{plan}</span>;
}

export function StatusBadge({ status }) {
  const map = { Active: { bg: "#F0FDF4", color: "#065F46" }, Suspended: { bg: "#FFF8ED", color: "#92400E" }, Banned: { bg: "#FEF2F2", color: "#991B1B" }, Live: { bg: "#F0FDF4", color: "#065F46" }, Draft: { bg: "#F3F4F6", color: "#6B7280" }, "Under Review": { bg: "#FFF8ED", color: "#92400E" }, Rejected: { bg: "#FEF2F2", color: "#991B1B" } };
  const s = map[status] || { bg: "#F3F4F6", color: "#6B7280" };
  return <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 10 }}>{status}</span>;
}


// ═══════════════════════════════════════════
// AdminModules
// ═══════════════════════════════════════════


const NAVY = "#1A1A2E", AMBER = "#F4A026";

/* ─────────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────────── */
function SlideOver({ title, onClose, children, footer }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100 }} />
      <div style={{ position: "fixed", right: 0, top: 0, width: 540, height: "100vh", background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 20, color: NAVY, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#6B7280" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>{children}</div>
        {footer && <div style={{ padding: "20px 24px", borderTop: "1px solid #E5E7EB" }}>{footer}</div>}
      </div>
    </>
  );
}

function ConfirmModal({ title, message, confirmLabel, confirmColor = "#E74C3C", onConfirm, onClose, requireText }) {
  const [typed, setTyped] = useState("");
  const canConfirm = requireText ? typed === requireText : true;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 16, padding: 32, width: 440, zIndex: 201, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ width: 56, height: 56, background: "#FEF2F2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>⚠️</div>
        <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, textAlign: "center", margin: "0 0 12px" }}>{title}</h3>
        <p style={{ color: "#6B7280", fontSize: 14, textAlign: "center", marginBottom: 20 }}>{message}</p>
        {requireText && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, color: "#6B7280", marginBottom: 6 }}>Type <strong>{requireText}</strong> to confirm:</label>
            <input value={typed} onChange={e => setTyped(e.target.value)} style={{ width: "100%", height: 44, border: "1px solid #E5E7EB", borderRadius: 8, padding: "0 14px", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 24, height: 46, fontSize: 14, cursor: "pointer", color: "#6B7280" }}>Cancel</button>
          <button onClick={canConfirm ? onConfirm : undefined} disabled={!canConfirm} style={{ flex: 1, background: canConfirm ? confirmColor : "#D1D5DB", color: "#fff", border: "none", borderRadius: 24, height: 46, fontSize: 14, fontWeight: 700, cursor: canConfirm ? "pointer" : "not-allowed" }}>{confirmLabel}</button>
        </div>
      </div>
    </>
  );
}

function FilterBar({ search, setSearch, placeholder, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F3F4F6", borderRadius: 8, padding: "8px 12px", flex: 1, minWidth: 220 }}>
        <span style={{ color: "#9CA3AF" }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder} style={{ background: "none", border: "none", outline: "none", fontSize: 14, color: NAVY, flex: 1, fontFamily: "inherit" }} />
      </div>
      {children}
    </div>
  );
}

function TableHeader({ cols }) {
  return (
    <thead>
      <tr style={{ background: "#F9FAFB" }}>
        {cols.map(h => <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>{h}</th>)}
      </tr>
    </thead>
  );
}

function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: NAVY, background: "#fff", cursor: "pointer", outline: "none" }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

/* ─────────────────────────────────────────────
   USER MANAGEMENT
───────────────────────────────────────────── */
const usersData = [
  { id: 1,  name: "Ada Okafor",    email: "ada@gmail.com",      role: "Merchant",  status: "Active",    plan: "Starter",  apps: 1, joined: "Jun 1",  lastActive: "Today"      },
  { id: 2,  name: "Chika Obi",     email: "chika@gmail.com",    role: "Consumer",  status: "Active",    plan: "—",        apps: 0, joined: "Jun 3",  lastActive: "Yesterday"  },
  { id: 3,  name: "Tunde Adeyemi", email: "tunde@gmail.com",    role: "Consumer",  status: "Active",    plan: "—",        apps: 0, joined: "Jun 5",  lastActive: "2 days ago" },
  { id: 4,  name: "Ibrahim Musa",  email: "ibrahim@gmail.com",  role: "Merchant",  status: "Suspended", plan: "Growth",   apps: 2, joined: "May 3",  lastActive: "Jun 10"     },
  { id: 5,  name: "Grace Eze",     email: "grace@gmail.com",    role: "Merchant",  status: "Active",    plan: "Business", apps: 1, joined: "Apr 15", lastActive: "Today"      },
  { id: 6,  name: "Fatima Bello",  email: "fatima@gmail.com",   role: "Consumer",  status: "Banned",    plan: "—",        apps: 0, joined: "May 20", lastActive: "Jun 1"      },
  { id: 7,  name: "David Nwachukwu", email: "david@gmail.com", role: "Merchant",  status: "Active",    plan: "Growth",   apps: 3, joined: "Mar 10", lastActive: "Today"      },
  { id: 8,  name: "Amaka Johnson", email: "amaka@gmail.com",    role: "Consumer",  status: "Active",    plan: "—",        apps: 0, joined: "Jun 15", lastActive: "Today"      },
];

export function UserManagement({ showToast }) {
  const [users, setUsers] = useState(usersData);
  const [search, setSearch] = useState("");
  const [roleF, setRoleF] = useState("All");
  const [statusF, setStatusF] = useState("All");
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [selected, setSelected] = useState([]);

  const filtered = users.filter(u => {
    if (roleF !== "All" && u.role !== roleF) return false;
    if (statusF !== "All" && u.status !== statusF) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const doAction = (id, action) => {
    const statusMap = { suspend: "Suspended", restore: "Active", ban: "Banned" };
    setUsers(u => u.map(x => x.id === id ? { ...x, status: statusMap[action] } : x));
    showToast(`User ${action === "ban" ? "banned" : action === "restore" ? "restored" : "suspended"} successfully`, action === "ban" ? "warning" : "success");
    setConfirm(null);
    setDetail(null);
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 28, color: NAVY, margin: 0 }}>User Management</h2>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>48,204 Total · 2,847 Merchants · 45,357 Consumers · 1,024 Active Today</div>
        </div>
        <button onClick={() => showToast("Exporting users...", "info")} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer", color: NAVY }}>Export CSV</button>
      </div>

      {selected.length > 0 && (
        <div style={{ background: NAVY, color: "#fff", borderRadius: 8, padding: "10px 20px", marginBottom: 12, display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 14 }}>{selected.length} selected</span>
          <button onClick={() => { showToast(`${selected.length} users suspended`, "warning"); setSelected([]); }} style={{ background: "#F59E0B", color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 13, cursor: "pointer" }}>Suspend All</button>
          <button onClick={() => showToast("Exported", "info")} style={{ background: "none", border: "1px solid #6B7280", color: "#D1D5DB", borderRadius: 6, padding: "5px 14px", fontSize: 13, cursor: "pointer" }}>Export</button>
          <button onClick={() => setSelected([])} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", marginLeft: "auto" }}>× Clear</button>
        </div>
      )}

      <FilterBar search={search} setSearch={setSearch} placeholder="Search by name or email...">
        <Sel value={roleF} onChange={setRoleF} options={["All", "Consumer", "Merchant", "Admin"]} />
        <Sel value={statusF} onChange={setStatusF} options={["All", "Active", "Suspended", "Banned"]} />
      </FilterBar>

      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHeader cols={["", "User", "Role", "Status", "Plan", "Apps", "Joined", "Last Active", "Actions"]} />
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #F3F4F6", background: selected.includes(u.id) ? "#FFF8ED" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 14px" }}><input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: AMBER }} /></td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: AMBER, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: NAVY, flexShrink: 0 }}>{u.name[0]}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: "#9CA3AF" }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ background: u.role === "Merchant" ? `${NAVY}11` : u.role === "Admin" ? "#EDE9FE" : "#F3F4F6", color: u.role === "Merchant" ? NAVY : u.role === "Admin" ? "#5B21B6" : "#6B7280", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 10 }}>{u.role}</span>
                </td>
                <td style={{ padding: "12px 14px" }}><StatusBadge status={u.status} /></td>
                <td style={{ padding: "12px 14px" }}><PlanBadge plan={u.plan} /></td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: NAVY, fontWeight: 600 }}>{u.apps}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "#9CA3AF" }}>{u.joined}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "#9CA3AF" }}>{u.lastActive}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setDetail(u)} style={{ background: "none", border: "none", color: AMBER, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>View</button>
                    {u.status === "Active" && <button onClick={() => setConfirm({ type: "suspend", user: u })} style={{ background: "none", border: "none", color: "#F59E0B", fontSize: 13, cursor: "pointer" }}>Suspend</button>}
                    {u.status === "Suspended" && <button onClick={() => doAction(u.id, "restore")} style={{ background: "none", border: "none", color: "#2ECC71", fontSize: 13, cursor: "pointer" }}>Restore</button>}
                    {u.status !== "Banned" && <button onClick={() => setConfirm({ type: "ban", user: u })} style={{ background: "none", border: "none", color: "#E74C3C", fontSize: 13, cursor: "pointer" }}>Ban</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>No users match your search.</div>}
      </div>

      {/* Detail panel */}
      {detail && (
        <SlideOver title="User Profile" onClose={() => setDetail(null)} footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => showToast("Password reset email sent", "success")} style={{ flex: 1, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 20, height: 44, fontSize: 13, cursor: "pointer", color: NAVY }}>Reset Password</button>
            {detail.status !== "Banned" && <button onClick={() => setConfirm({ type: "ban", user: detail })} style={{ flex: 1, background: "#FEF2F2", border: "1px solid #E74C3C", borderRadius: 20, height: 44, fontSize: 13, cursor: "pointer", color: "#E74C3C", fontWeight: 600 }}>Ban Account</button>}
          </div>
        }>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 72, height: 72, background: AMBER, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: NAVY, margin: "0 auto 12px" }}>{detail.name[0]}</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY }}>{detail.name}</div>
            <div style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>{detail.email}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
              <span style={{ background: detail.role === "Merchant" ? `${NAVY}11` : "#F3F4F6", color: detail.role === "Merchant" ? NAVY : "#6B7280", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 10 }}>{detail.role}</span>
              <StatusBadge status={detail.status} />
              <PlanBadge plan={detail.plan} />
            </div>
          </div>
          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            {[["Joined", detail.joined], ["Last Active", detail.lastActive], ["Apps Published", detail.apps], ["Plan", detail.plan]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: 13, color: "#6B7280" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: NAVY, marginBottom: 10 }}>Recent Activity</div>
          {["Published app", "Added 12 products", "Received first order", "Updated branding"].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13, color: "#6B7280" }}>
              <span style={{ color: AMBER }}>●</span>{a} — {["Jun 1", "Jun 2", "Jun 5", "Jun 8"][i]}
            </div>
          ))}
        </SlideOver>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.type === "ban" ? `Ban ${confirm.user.name}?` : `Suspend ${confirm.user.name}?`}
          message={confirm.type === "ban" ? `This will permanently ban ${confirm.user.name}. They will lose access to all their apps and data.` : `${confirm.user.name} will be temporarily suspended from the platform.`}
          confirmLabel={confirm.type === "ban" ? "Confirm Ban" : "Suspend"}
          confirmColor={confirm.type === "ban" ? "#E74C3C" : "#F59E0B"}
          requireText={confirm.type === "ban" ? "CONFIRM" : undefined}
          onConfirm={() => doAction(confirm.user.id, confirm.type)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MERCHANT MANAGEMENT
───────────────────────────────────────────── */
const merchantsData = [
  { id: 1, name: "Ada Okafor",    biz: "Mama's Kitchen",  cat: "Restaurant", plan: "Starter",  status: "Active",    apps: 1, customers: 1204, revenue: 48200,  joined: "Jun 1"  },
  { id: 2, name: "Ibrahim Musa",  biz: "IB Fashions",     cat: "Ecommerce",  plan: "Growth",   status: "Active",    apps: 2, customers: 892,  revenue: 124000, joined: "Apr 5"  },
  { id: 3, name: "Grace Eze",     biz: "Grace Salon",     cat: "Booking",    plan: "Business", status: "Active",    apps: 1, customers: 540,  revenue: 87000,  joined: "Mar 10" },
  { id: 4, name: "David Nwachukwu", biz: "Grace Assembly",cat: "Church",    plan: "Growth",   status: "Active",    apps: 3, customers: 2100, revenue: 0,      joined: "Jan 15" },
  { id: 5, name: "Emeka Obi",     biz: "Emeka Groceries", cat: "Grocery",    plan: "Starter",  status: "Suspended", apps: 1, customers: 234,  revenue: 15000,  joined: "May 3"  },
];

export function MerchantManagement({ showToast }) {
  const [merchants, setMerchants] = useState(merchantsData);
  const [search, setSearch] = useState("");
  const [planF, setPlanF] = useState("All");
  const [statusF, setStatusF] = useState("All");
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const filtered = merchants.filter(m => {
    if (planF !== "All" && m.plan !== planF) return false;
    if (statusF !== "All" && m.status !== statusF) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.biz.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const doAction = (id, action) => {
    setMerchants(m => m.map(x => x.id === id ? { ...x, status: action === "suspend" ? "Suspended" : "Active" } : x));
    showToast(`Merchant ${action === "suspend" ? "suspended" : "restored"}`, action === "suspend" ? "warning" : "success");
    setConfirm(null); setDetail(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 28, color: NAVY, margin: 0 }}>Merchant Management</h2>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>2,847 Total Merchants · 755 Paying · 2,092 on Free Plan</div>
        </div>
        <button onClick={() => showToast("Exported", "info")} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer", color: NAVY }}>Export CSV</button>
      </div>

      <FilterBar search={search} setSearch={setSearch} placeholder="Search merchant or business name...">
        <Sel value={planF} onChange={setPlanF} options={["All", "Starter", "Growth", "Business", "Enterprise"]} />
        <Sel value={statusF} onChange={setStatusF} options={["All", "Active", "Suspended", "Banned"]} />
      </FilterBar>

      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHeader cols={["Merchant", "Business", "Category", "Plan", "Status", "Apps", "Customers", "Revenue", "Joined", "Actions"]} />
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: AMBER, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: NAVY }}>{m.name[0]}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{m.name}</div><div style={{ fontSize: 11, color: "#9CA3AF" }}>{m.name.toLowerCase().replace(" ", ".")}@gmail.com</div></div>
                  </div>
                </td>
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: NAVY }}>{m.biz}</td>
                <td style={{ padding: "12px 14px" }}><span style={{ background: "#F3F4F6", color: "#6B7280", fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>{m.cat}</span></td>
                <td style={{ padding: "12px 14px" }}><PlanBadge plan={m.plan} /></td>
                <td style={{ padding: "12px 14px" }}><StatusBadge status={m.status} /></td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: NAVY, fontWeight: 600 }}>{m.apps}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: "#6B7280" }}>{m.customers.toLocaleString()}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: AMBER }}>₦{m.revenue.toLocaleString()}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "#9CA3AF" }}>{m.joined}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setDetail(m)} style={{ background: "none", border: "none", color: AMBER, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>View</button>
                    {m.status === "Active" ? <button onClick={() => setConfirm({ type: "suspend", merchant: m })} style={{ background: "none", border: "none", color: "#F59E0B", fontSize: 13, cursor: "pointer" }}>Suspend</button> : <button onClick={() => doAction(m.id, "restore")} style={{ background: "none", border: "none", color: "#2ECC71", fontSize: 13, cursor: "pointer" }}>Restore</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <SlideOver title={detail.biz} onClose={() => setDetail(null)} footer={
          <div style={{ display: "flex", gap: 10 }}>
            {detail.status === "Active" ? <button onClick={() => setConfirm({ type: "suspend", merchant: detail })} style={{ flex: 1, background: "#FFF8ED", border: "1px solid #F59E0B", borderRadius: 20, height: 44, fontSize: 14, cursor: "pointer", color: "#92400E", fontWeight: 600 }}>Suspend Merchant</button> : <button onClick={() => doAction(detail.id, "restore")} style={{ flex: 1, background: "#F0FDF4", border: "1px solid #2ECC71", borderRadius: 20, height: 44, fontSize: 14, cursor: "pointer", color: "#065F46", fontWeight: 600 }}>Restore Merchant</button>}
            <button onClick={() => showToast("Message sent to merchant", "success")} style={{ flex: 1, background: NAVY, color: "#fff", border: "none", borderRadius: 20, height: 44, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Send Message</button>
          </div>
        }>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, background: AMBER, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: NAVY }}>{detail.name[0]}</div>
            <div><div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: NAVY }}>{detail.biz}</div><div style={{ color: "#6B7280", fontSize: 13 }}>Owner: {detail.name}</div><div style={{ display: "flex", gap: 6, marginTop: 6 }}><PlanBadge plan={detail.plan} /><StatusBadge status={detail.status} /><span style={{ background: "#F3F4F6", color: "#6B7280", fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>{detail.cat}</span></div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[["Apps", detail.apps], ["Customers", detail.customers.toLocaleString()], ["Revenue", `₦${detail.revenue.toLocaleString()}`], ["Joined", detail.joined]].map(([k, v]) => (
              <div key={k} style={{ background: "#F9FAFB", borderRadius: 8, padding: 14, textAlign: "center" }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY }}>{v}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{k}</div>
              </div>
            ))}
          </div>
        </SlideOver>
      )}

      {confirm && (
        <ConfirmModal title={`Suspend ${confirm.merchant.biz}?`} message={`${confirm.merchant.name}'s app will be taken offline. Customers will no longer be able to access it.`} confirmLabel="Suspend Merchant" confirmColor="#F59E0B" onConfirm={() => doAction(confirm.merchant.id, "suspend")} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   APP MODERATION
───────────────────────────────────────────── */
const appsData = [
  { id: 1, name: "Mama's Kitchen",    merchant: "Ada Okafor",      cat: "Restaurant", status: "Under Review", submitted: "2 hrs ago", logo: "🍛", checklist: [true, true, true, true, true, false] },
  { id: 2, name: "Fresh Mart",         merchant: "Emeka Obi",       cat: "Grocery",    status: "Under Review", submitted: "4 hrs ago", logo: "🛒", checklist: [true, true, true, false, false, false] },
  { id: 3, name: "Grace Assembly",     merchant: "David Nwachukwu", cat: "Church",     status: "Under Review", submitted: "5 hrs ago", logo: "⛪", checklist: [true, true, true, true, false, true] },
  { id: 4, name: "IB Fashions",        merchant: "Ibrahim Musa",    cat: "Ecommerce",  status: "Live",         submitted: "Jun 10",    logo: "👗", checklist: [true, true, true, true, true, true] },
  { id: 5, name: "Grace Salon",        merchant: "Grace Eze",       cat: "Booking",    status: "Live",         submitted: "Jun 5",     logo: "💇", checklist: [true, true, true, true, true, true] },
  { id: 6, name: "Fake Ecommerce",     merchant: "Unknown",         cat: "Ecommerce",  status: "Rejected",     submitted: "Jun 8",     logo: "❌", checklist: [false, false, true, false, false, false] },
];
const checkItems = ["Business name present", "Logo uploaded", "Category correctly selected", "Template applied", "Payment integration connected", "Business hours set"];

export function AppModeration({ showToast }) {
  const [apps, setApps] = useState(appsData);
  const [tab, setTab] = useState("Under Review");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [note, setNote] = useState("");

  const tabs = ["All", "Under Review", "Live", "Rejected"];
  const filtered = apps.filter(a => {
    if (tab !== "All" && a.status !== tab) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const approve = (id) => {
    setApps(a => a.map(x => x.id === id ? { ...x, status: "Live" } : x));
    showToast("App approved and now live! Merchant notified.", "success");
    setDetail(null);
  };

  const reject = (id) => {
    setApps(a => a.map(x => x.id === id ? { ...x, status: "Rejected" } : x));
    showToast("App rejected. Merchant has been notified with feedback.", "info");
    setRejectModal(null); setDetail(null); setRejectReason("");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 28, color: NAVY, margin: 0 }}>App Moderation</h2>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{apps.filter(a => a.status === "Live").length} Live · {apps.filter(a => a.status === "Under Review").length} Pending Review · {apps.filter(a => a.status === "Rejected").length} Rejected</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => {
          const count = t === "All" ? apps.length : apps.filter(a => a.status === t).length;
          return <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${tab === t ? AMBER : "#E5E7EB"}`, background: tab === t ? "#FFF8ED" : "#fff", color: tab === t ? "#92400E" : "#6B7280", fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: "pointer" }}>{t} ({count})</button>;
        })}
      </div>

      <FilterBar search={search} setSearch={setSearch} placeholder="Search apps..." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {filtered.map(app => (
          <div key={app.id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: app.status === "Under Review" ? `2px solid ${AMBER}` : "2px solid transparent" }}>
            <div style={{ height: 120, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, position: "relative" }}>
              {app.logo}
              <StatusBadge status={app.status} />
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: NAVY, marginBottom: 4 }}>{app.name}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>by {app.merchant}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12 }}>Submitted {app.submitted}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setDetail(app)} style={{ flex: 1, background: AMBER, color: NAVY, border: "none", borderRadius: 20, height: 36, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Review →</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {detail && (
        <SlideOver title={`Review: ${detail.name}`} onClose={() => setDetail(null)} footer={
          detail.status === "Under Review" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => approve(detail.id)} style={{ background: "#2ECC71", color: "#fff", border: "none", borderRadius: 24, height: 48, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>✓ Approve App</button>
              <button onClick={() => showToast("Changes requested — merchant notified", "info")} style={{ background: "#FFF8ED", color: "#92400E", border: "1px solid #F4A026", borderRadius: 24, height: 44, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>Request Changes</button>
              <button onClick={() => setRejectModal(detail)} style={{ background: "#FEF2F2", color: "#E74C3C", border: "1px solid #E74C3C", borderRadius: 24, height: 44, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>✕ Reject App</button>
            </div>
          ) : null
        }>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
            <div style={{ width: 64, height: 64, background: NAVY, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{detail.logo}</div>
            <div><div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: NAVY }}>{detail.name}</div><div style={{ color: "#6B7280", fontSize: 13 }}>by {detail.merchant}</div><div style={{ display: "flex", gap: 6, marginTop: 6 }}><StatusBadge status={detail.status} /><span style={{ background: "#F3F4F6", color: "#6B7280", fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>{detail.cat}</span></div></div>
          </div>

          <div style={{ fontWeight: 600, fontSize: 14, color: NAVY, marginBottom: 12 }}>Review Checklist</div>
          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            {checkItems.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < checkItems.length - 1 ? "1px solid #E5E7EB" : "none" }}>
                <span style={{ fontSize: 16, color: detail.checklist[i] ? "#2ECC71" : "#E74C3C" }}>{detail.checklist[i] ? "✓" : "✕"}</span>
                <span style={{ fontSize: 13, color: detail.checklist[i] ? NAVY : "#9CA3AF" }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ fontWeight: 600, fontSize: 14, color: NAVY, marginBottom: 8 }}>Internal Note</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note for your team..." style={{ width: "100%", height: 80, border: "1px solid #E5E7EB", borderRadius: 8, padding: 12, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }} />
          {note && <button onClick={() => { showToast("Note saved", "success"); }} style={{ marginTop: 8, background: "none", border: "none", color: AMBER, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save Note</button>}
        </SlideOver>
      )}

      {rejectModal && (
        <>
          <div onClick={() => setRejectModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 16, padding: 32, width: 460, zIndex: 201, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: "#E74C3C", margin: "0 0 16px" }}>Reject "{rejectModal.name}"</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: "block", marginBottom: 8 }}>Select reason:</label>
              {["Content violation", "Incomplete setup", "Inappropriate branding", "Suspected fraud", "Other"].map(r => (
                <label key={r} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
                  <input type="radio" name="rej" value={r} checked={rejectReason === r} onChange={() => setRejectReason(r)} style={{ accentColor: "#E74C3C" }} />
                  <span style={{ fontSize: 14, color: NAVY }}>{r}</span>
                </label>
              ))}
            </div>
            <textarea placeholder="Message to merchant (pre-filled from reason)..." defaultValue={rejectReason ? `Hi, your app was rejected due to: ${rejectReason}. Please make the required changes and resubmit.` : ""} style={{ width: "100%", height: 80, border: "1px solid #E5E7EB", borderRadius: 8, padding: 12, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", marginTop: 8 }} />
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => reject(rejectModal.id)} style={{ flex: 1, background: "#E74C3C", color: "#fff", border: "none", borderRadius: 24, height: 48, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Send Rejection</button>
              <button onClick={() => setRejectModal(null)} style={{ flex: 1, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 24, height: 48, fontSize: 14, cursor: "pointer", color: "#6B7280" }}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   REPORTS QUEUE
───────────────────────────────────────────── */
const reportsData = [
  { id: "MOD-041", reporter: "Chika Obi",    subject: "Mama's Kitchen",  type: "Fraud",       priority: "Critical", status: "Under Review", submitted: "2 hrs ago",  assigned: "Admin A", desc: "This business took my payment and never delivered the food. I have screenshots of the transaction." },
  { id: "MOD-040", reporter: "Tunde Adeyemi",subject: "IB Fashions",     type: "Harassment",  priority: "Critical", status: "Under Review", submitted: "4 hrs ago",  assigned: "Unassigned", desc: "The merchant sent me threatening messages when I asked for a refund." },
  { id: "MOD-039", reporter: "Fatima Bello", subject: "Unknown Store",   type: "Spam",        priority: "Medium",   status: "Under Review", submitted: "1 day ago",  assigned: "Admin B", desc: "This merchant is sending unsolicited promotional messages to my number repeatedly." },
  { id: "MOD-038", reporter: "Ibrahim Musa", subject: "Fresh Mart",      type: "Fake Business", priority: "High",  status: "Under Review", submitted: "2 days ago", assigned: "Unassigned", desc: "This store claims to be a licensed grocery but I suspect it is not real." },
  { id: "MOD-037", reporter: "Grace Eze",    subject: "Dodgy Shop",      type: "Scam",        priority: "High",   status: "Resolved",     submitted: "Jun 18",     assigned: "Admin A", desc: "Products listed don't match what was delivered." },
];

const priorityStyle = { Critical: { bg: "#FEF2F2", color: "#991B1B", dot: "#E74C3C" }, High: { bg: "#FFF7ED", color: "#92400E", dot: "#F59E0B" }, Medium: { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" } };
const typeStyle = { Fraud: "#E74C3C", Harassment: "#E74C3C", Spam: "#6B7280", "Fake Business": "#F59E0B", Scam: "#F59E0B" };

export function ReportsQueue({ showToast }) {
  const [reports, setReports] = useState(reportsData);
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [banConfirm, setBanConfirm] = useState(null);

  const tabs = ["All", "Critical", "High", "Medium", "Resolved"];
  const filtered = reports.filter(r => {
    if (tab === "Resolved") return r.status === "Resolved";
    if (tab !== "All" && r.priority !== tab) return false;
    if (r.status === "Resolved" && tab !== "Resolved") return false;
    if (search && !r.reporter.toLowerCase().includes(search.toLowerCase()) && !r.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const resolve = (id) => { setReports(r => r.map(x => x.id === id ? { ...x, status: "Resolved" } : x)); showToast("Report resolved", "success"); setDetail(null); };
  const doBan = (id) => { showToast("Merchant banned and app removed from marketplace", "warning"); setBanConfirm(null); setDetail(null); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 28, color: NAVY, margin: 0 }}>Reports Queue</h2>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{reports.filter(r => r.status !== "Resolved").length} open · {reports.filter(r => r.priority === "Critical" && r.status !== "Resolved").length} critical</div>
        </div>
        <button onClick={() => showToast("Exported", "info")} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer", color: NAVY }}>Export</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => {
          const count = t === "All" ? reports.length : t === "Resolved" ? reports.filter(r => r.status === "Resolved").length : reports.filter(r => r.priority === t && r.status !== "Resolved").length;
          return <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${tab === t ? AMBER : "#E5E7EB"}`, background: tab === t ? "#FFF8ED" : "#fff", color: tab === t ? "#92400E" : "#6B7280", fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: "pointer" }}>{t} ({count})</button>;
        })}
      </div>

      <FilterBar search={search} setSearch={setSearch} placeholder="Search reporter or subject..." />

      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHeader cols={["ID", "Reporter", "Subject", "Type", "Priority", "Status", "Submitted", "Assigned", "Action"]} />
          <tbody>
            {filtered.map((r, i) => {
              const ps = priorityStyle[r.priority] || priorityStyle.Medium;
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid #F3F4F6", background: r.priority === "Critical" && r.status !== "Resolved" ? "#FFF5F5" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: NAVY }}>{r.id}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, background: AMBER, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: NAVY }}>{r.reporter[0]}</div>
                      <span style={{ fontSize: 13, color: NAVY }}>{r.reporter}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, color: NAVY }}>{r.subject}</td>
                  <td style={{ padding: "12px 14px" }}><span style={{ background: (typeStyle[r.type] || "#6B7280") + "22", color: typeStyle[r.type] || "#6B7280", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 10 }}>{r.type}</span></td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, background: ps.dot, borderRadius: "50%" }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: ps.color }}>{r.priority}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#9CA3AF" }}>{r.submitted}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: r.assigned === "Unassigned" ? "#9CA3AF" : "#6B7280" }}>{r.assigned}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button onClick={() => setDetail(r)} style={{ background: r.status !== "Resolved" ? AMBER : "#F3F4F6", color: r.status !== "Resolved" ? NAVY : "#6B7280", border: "none", borderRadius: 16, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Review →</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center" }}><div style={{ fontSize: 32, marginBottom: 8 }}>✅</div><div style={{ color: "#2ECC71", fontWeight: 600, fontSize: 16 }}>All caught up! No reports in this category.</div></div>}
      </div>

      {detail && (
        <SlideOver title={`Report ${detail.id}`} onClose={() => setDetail(null)} footer={
          detail.status !== "Resolved" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { showToast("Warning sent to merchant", "info"); }} style={{ flex: 1, background: "#FFF8ED", color: "#92400E", border: "1px solid #F4A026", borderRadius: 20, height: 42, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Warn Merchant</button>
                <button onClick={() => { showToast("App suspended", "warning"); }} style={{ flex: 1, background: "#FFF7ED", color: "#92400E", border: "1px solid #F59E0B", borderRadius: 20, height: 42, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Suspend App</button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setBanConfirm(detail)} style={{ flex: 1, background: "#FEF2F2", color: "#E74C3C", border: "1px solid #E74C3C", borderRadius: 20, height: 42, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Ban Merchant</button>
                <button onClick={() => resolve(detail.id)} style={{ flex: 1, background: "#F3F4F6", color: "#6B7280", border: "none", borderRadius: 20, height: 42, fontSize: 13, cursor: "pointer" }}>Dismiss</button>
              </div>
            </div>
          ) : <div style={{ textAlign: "center", color: "#2ECC71", fontWeight: 600 }}>✓ This report has been resolved</div>
        }>
          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", justify: "space-between", gap: 10, marginBottom: 8 }}>
              <div><div style={{ fontSize: 12, color: "#6B7280" }}>Reporter</div><div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{detail.reporter}</div></div>
              <div><div style={{ fontSize: 12, color: "#6B7280" }}>Subject</div><div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{detail.subject}</div></div>
              <div><div style={{ fontSize: 12, color: "#6B7280" }}>Submitted</div><div style={{ fontSize: 14, color: NAVY }}>{detail.submitted}</div></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <span style={{ background: (typeStyle[detail.type] || "#6B7280") + "22", color: typeStyle[detail.type] || "#6B7280", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 10 }}>{detail.type}</span>
            <span style={{ background: (priorityStyle[detail.priority] || {}).bg, color: (priorityStyle[detail.priority] || {}).color, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 10 }}>{detail.priority} Priority</span>
            <StatusBadge status={detail.status} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: NAVY, marginBottom: 8 }}>Report Details</div>
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: 14, fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 16 }}>{detail.desc}</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: NAVY, marginBottom: 8 }}>Assigned To</div>
          <div style={{ color: detail.assigned === "Unassigned" ? "#9CA3AF" : NAVY, fontSize: 14, marginBottom: 16 }}>{detail.assigned}</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: NAVY, marginBottom: 8 }}>Timeline</div>
          {[`Submitted by ${detail.reporter}`, "Report received by system", detail.assigned !== "Unassigned" ? `Assigned to ${detail.assigned}` : "Awaiting assignment"].map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", fontSize: 13, color: "#6B7280" }}>
              <span style={{ color: AMBER }}>●</span>{e}
            </div>
          ))}
        </SlideOver>
      )}

      {banConfirm && (
        <ConfirmModal title={`Ban merchant for "${banConfirm.subject}"?`} message={`This will permanently ban the merchant, remove their app from the marketplace, and prevent future signups.`} confirmLabel="Confirm Ban" confirmColor="#E74C3C" requireText="CONFIRM" onConfirm={() => doBan(banConfirm.id)} onClose={() => setBanConfirm(null)} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   REVENUE DASHBOARD
───────────────────────────────────────────── */
const revMonths = [{ m:"Jan",v:3.2},{m:"Feb",v:4.1},{m:"Mar",v:5.5},{m:"Apr",v:4.9},{m:"May",v:7.8},{m:"Jun",v:9.2}];
const planData = [{ name:"Starter (Free)",mrr:0,merchants:2092,churn:"8%"},{name:"Growth",mrr:5198000,merchants:520,churn:"3%"},{name:"Business",mrr:4999800,merchants:200,churn:"2%"},{name:"Enterprise",mrr:1700000,merchants:35,churn:"0%"}];
const PIE_COLS = [AMBER, NAVY, "#2ECC71", "#7C3AED"];
const planPie = [{ name:"Growth",value:56},{name:"Business",value:22},{name:"Enterprise",value:18},{name:"Other",value:4}];

export function RevenueDashboard({ showToast }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 28, color: NAVY, margin: 0 }}>Revenue Dashboard</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <Sel value="June 2025" onChange={() => {}} options={["June 2025", "May 2025", "Q2 2025", "YTD"]} />
          <button onClick={() => showToast("PDF report generated", "success")} style={{ background: AMBER, color: NAVY, border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Export PDF</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "MRR",             value: "₦9,200,000", trend: "+18% vs May", up: true,  color: AMBER },
          { label: "ARR (Projected)", value: "₦110.4M",    trend: "Annualised",  up: null,  color: NAVY  },
          { label: "Paying Merchants",value: "755",         trend: "of 2,847 total",up: null,color: NAVY  },
          { label: "Churn This Month",value: "12",          trend: "4 at risk ⚠️", up: false, color: "#E74C3C" },
        ].map((k, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "22px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: i === 3 ? "1px solid #FECACA" : "none" }}>
            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 28, color: k.color, marginBottom: 6 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: k.up === true ? "#2ECC71" : k.up === false ? "#E74C3C" : "#9CA3AF", fontWeight: 500 }}>{k.up === true ? "↑ " : k.up === false ? "⚠ " : ""}{k.trend}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 16, color: NAVY, marginBottom: 20 }}>Monthly Revenue Growth</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revMonths}>
              <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={AMBER} stopOpacity={0.3} /><stop offset="100%" stopColor={AMBER} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v}M`} />
              <Tooltip formatter={v => [`₦${v}M`, "MRR"]} contentStyle={{ borderRadius: 8, border: "none" }} />
              <Area type="monotone" dataKey="v" stroke={AMBER} strokeWidth={3} fill="url(#ag)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 16, color: NAVY, marginBottom: 20 }}>Revenue by Plan</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={planPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {planPie.map((_, i) => <Cell key={i} fill={PIE_COLS[i]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ borderRadius: 8, border: "none" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
            {planPie.map((p, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: PIE_COLS[i] }} /><span style={{ fontSize: 11, color: "#6B7280" }}>{p.name} {p.value}%</span></div>)}
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 16, color: NAVY, marginBottom: 16 }}>Plan Breakdown</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHeader cols={["Plan", "Active Merchants", "MRR", "% of Total", "Avg/Merchant", "Churn Rate", "Trend"]} />
          <tbody>
            {planData.map((p, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "14px 14px" }}><PlanBadge plan={p.name.split(" ")[0]} /></td>
                <td style={{ padding: "14px 14px", fontSize: 14, color: NAVY }}>{p.merchants.toLocaleString()}</td>
                <td style={{ padding: "14px 14px", fontSize: 14, fontWeight: 700, color: AMBER }}>{p.mrr === 0 ? "₦0 (Beta)" : `₦${(p.mrr / 1000000).toFixed(2)}M`}</td>
                <td style={{ padding: "14px 14px", fontSize: 13, color: "#6B7280" }}>{p.mrr === 0 ? "—" : `${Math.round((p.mrr / 11897800) * 100)}%`}</td>
                <td style={{ padding: "14px 14px", fontSize: 13, color: "#6B7280" }}>{p.mrr === 0 ? "₦0" : `₦${Math.round(p.mrr / p.merchants).toLocaleString()}`}</td>
                <td style={{ padding: "14px 14px" }}><span style={{ fontSize: 13, fontWeight: 600, color: parseFloat(p.churn) > 5 ? "#E74C3C" : parseFloat(p.churn) > 2 ? "#F59E0B" : "#2ECC71" }}>{p.churn}</span></td>
                <td style={{ padding: "14px 14px", fontSize: 16, color: "#2ECC71" }}>↑</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   WAITLIST MANAGEMENT
───────────────────────────────────────────── */
const waitlistData = [
  { id: 1, name: "Ngozi Adichie",  email: "ngozi@gmail.com",  type: "Restaurant", city: "Lagos",  signed: "Jun 1",  status: "Invited" },
  { id: 2, name: "Chidi Okeke",    email: "chidi@gmail.com",  type: "Fashion",    city: "Abuja",  signed: "Jun 3",  status: "Not Invited" },
  { id: 3, name: "Amara Osei",     email: "amara@gmail.com",  type: "Salon",      city: "PH",     signed: "Jun 5",  status: "Joined" },
  { id: 4, name: "Tolu Balogun",   email: "tolu@gmail.com",   type: "Grocery",    city: "Lagos",  signed: "Jun 6",  status: "Not Invited" },
  { id: 5, name: "Kemi Adeyemi",   email: "kemi@gmail.com",   type: "School",     city: "Ibadan", signed: "Jun 8",  status: "Invited" },
  { id: 6, name: "Femi Oladele",   email: "femi@gmail.com",   type: "Church",     city: "Lagos",  signed: "Jun 10", status: "Joined" },
];

export function WaitlistManagement({ showToast }) {
  const [list, setList] = useState(waitlistData);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("Merchants");
  const [selected, setSelected] = useState([]);
  const [inviteModal, setInviteModal] = useState(null);

  const filtered = list.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const sendInvite = (item) => {
    setList(l => l.map(x => x.id === item.id ? { ...x, status: "Invited" } : x));
    showToast(`Invite sent to ${item.name}!`, "success");
    setInviteModal(null);
  };

  const statusStyle2 = { "Not Invited": { bg: "#F3F4F6", color: "#6B7280" }, Invited: { bg: "#FFF8ED", color: "#92400E" }, Joined: { bg: "#F0FDF4", color: "#065F46" } };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 28, color: NAVY, margin: 0 }}>Waitlist</h2>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>3,847 Total · 1,204 Merchants · 2,643 Consumers · 20.4% Conversion</div>
        </div>
        <button onClick={() => showToast("Exported", "info")} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer", color: NAVY }}>Export CSV</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[{ label: "Total Signups", value: "3,847", color: AMBER }, { label: "Invited", value: "1,820", color: NAVY }, { label: "Joined", value: list.filter(x => x.status === "Joined").length.toString(), color: "#2ECC71" }, { label: "Conversion", value: "20.4%", color: "#7C3AED" }].map((k, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 26, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["Merchants", "Consumers"].map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 20px", borderRadius: 20, border: `1px solid ${tab === t ? AMBER : "#E5E7EB"}`, background: tab === t ? "#FFF8ED" : "#fff", color: tab === t ? "#92400E" : "#6B7280", fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: "pointer" }}>{t}</button>)}
      </div>

      {selected.length > 0 && (
        <div style={{ background: AMBER, color: NAVY, borderRadius: 8, padding: "10px 20px", marginBottom: 12, display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{selected.length} selected</span>
          <button onClick={() => { setList(l => l.map(x => selected.includes(x.id) ? { ...x, status: "Invited" } : x)); showToast(`${selected.length} invites sent!`, "success"); setSelected([]); }} style={{ background: NAVY, color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Send Invites</button>
          <button onClick={() => showToast("Exported", "info")} style={{ background: "rgba(0,0,0,0.1)", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 13, cursor: "pointer", color: NAVY }}>Export</button>
          <button onClick={() => setSelected([])} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", fontSize: 16, color: NAVY }}>×</button>
        </div>
      )}

      <FilterBar search={search} setSearch={setSearch} placeholder="Search by name or email..." />

      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHeader cols={["", "#", "Name", "Email", "Business Type", "City", "Signed Up", "Status", "Actions"]} />
          <tbody>
            {filtered.map((u, i) => {
              const ss = statusStyle2[u.status] || statusStyle2["Not Invited"];
              return (
                <tr key={u.id} style={{ borderBottom: "1px solid #F3F4F6", background: selected.includes(u.id) ? "#FFF8ED" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "12px 14px" }}><input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: AMBER }} /></td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: AMBER }}>#{i + 1}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, background: AMBER, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: NAVY }}>{u.name[0]}</div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: NAVY }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#6B7280" }}>{u.email}</td>
                  <td style={{ padding: "12px 14px" }}><span style={{ background: "#F3F4F6", color: "#6B7280", fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>{u.type}</span></td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#6B7280" }}>{u.city}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#9CA3AF" }}>{u.signed}</td>
                  <td style={{ padding: "12px 14px" }}><span style={{ background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 10 }}>{u.status}</span></td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {u.status === "Not Invited" && <button onClick={() => setInviteModal(u)} style={{ background: AMBER, color: NAVY, border: "none", borderRadius: 14, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Invite</button>}
                      {u.status === "Joined" && <span style={{ fontSize: 12, color: "#2ECC71", fontWeight: 600 }}>✓ Active</span>}
                      {u.status === "Invited" && <span style={{ fontSize: 12, color: "#9CA3AF" }}>Pending...</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {inviteModal && (
        <>
          <div onClick={() => setInviteModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 16, padding: 32, width: 480, zIndex: 201, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, margin: "0 0 16px" }}>Send Invite to {inviteModal.name}</h3>
            <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>From: team@dukadesk.com</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Subject: Your spot on EverythingApp is ready, {inviteModal.name.split(" ")[0]}!</div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>Hi {inviteModal.name.split(" ")[0]},<br /><br />We're excited to welcome you to EverythingApp! Your spot is ready. Click below to set up your merchant account and launch your first app within minutes.<br /><br />— The DukaDesk Team</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => sendInvite(inviteModal)} style={{ flex: 1, background: AMBER, color: NAVY, border: "none", borderRadius: 24, height: 48, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Send Invite Now</button>
              <button onClick={() => setInviteModal(null)} style={{ flex: 1, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 24, height: 48, fontSize: 14, cursor: "pointer", color: "#6B7280" }}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADMIN SETTINGS
───────────────────────────────────────────── */
export function AdminSettings({ showToast }) {
  const [twoFA, setTwoFA] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 28, color: NAVY, marginBottom: 8 }}>Settings</h2>
      <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 32 }}>Manage admin portal configuration and security settings.</p>

      {[
        { title: "Security", items: [
          { label: "Two-Factor Authentication", sub: "Require 2FA for all admin logins", val: twoFA, set: setTwoFA },
          { label: "Auto-approve low-risk apps", sub: "Skip moderation queue for apps passing all automated checks", val: autoApprove, set: setAutoApprove },
        ]},
        { title: "Notifications", items: [
          { label: "Email Alerts", sub: "Receive email for critical reports and platform events", val: emailAlerts, set: setEmailAlerts },
          { label: "Slack Alerts", sub: "Send critical alerts to Slack channel", val: slackAlerts, set: setSlackAlerts },
        ]},
      ].map((section, si) => (
        <div key={si} style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 16, color: NAVY, marginBottom: 16 }}>{section.title}</div>
          {section.items.map((item, ii) => (
            <div key={ii} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: ii < section.items.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{item.sub}</div>
              </div>
              <div onClick={() => { item.set(!item.val); showToast(`${item.label} ${!item.val ? "enabled" : "disabled"}`, "success"); }} style={{ width: 48, height: 26, background: item.val ? AMBER : "#D1D5DB", borderRadius: 13, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ width: 22, height: 22, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: item.val ? 24 : 2, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          ))}
        </div>
      ))}

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 16, color: NAVY, marginBottom: 16 }}>Admin Team</div>
        {[{ name: "Super Admin",  email: "admin@dukadesk.com", role: "Super Admin", color: "#E74C3C" }, { name: "Moderation A", email: "moda@dukadesk.com",  role: "Moderator",   color: "#7C3AED" }, { name: "Support B",   email: "support@dukadesk.com", role: "Support",     color: "#2ECC71" }].map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 2 ? "1px solid #F3F4F6" : "none" }}>
            <div style={{ width: 36, height: 36, background: a.color, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{a.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{a.name}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>{a.email}</div>
            </div>
            <span style={{ background: a.color + "22", color: a.color, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 10 }}>{a.role}</span>
          </div>
        ))}
        <button onClick={() => showToast("Invite sent!", "success")} style={{ marginTop: 16, background: "none", border: `1px dashed ${AMBER}`, borderRadius: 8, padding: "10px 16px", fontSize: 13, color: AMBER, fontWeight: 600, cursor: "pointer", width: "100%" }}>+ Invite Team Member</button>
      </div>

      <button onClick={() => showToast("All settings saved!", "success")} style={{ background: AMBER, color: NAVY, border: "none", borderRadius: 24, padding: "14px 40px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>Save All Settings</button>
    </div>
  );
}


// ═══════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════

const NAVY = "#1A1A2E";
const AMBER = "#F4A026";

export default function App() {
  const [page, setPage] = useState("login");
  const [toast, setToast] = useState(null);
  const [admin, setAdmin] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (data) => {
    setAdmin(data);
    setPage("dashboard");
  };

  if (page === "login") {
    return (
      <>
        {toast && <Toast toast={toast} />}
        <AdminLogin onLogin={handleLogin} showToast={showToast} />
      </>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif", background: "#F7F8FA" }}>
      {toast && <Toast toast={toast} />}
      <AdminSidebar page={page} setPage={setPage} admin={admin} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <AdminTopbar page={page} showToast={showToast} setPage={setPage} />
        <main style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          {page === "dashboard"  && <AdminDashboard   setPage={setPage} showToast={showToast} />}
          {page === "users"      && <UserManagement              showToast={showToast} />}
          {page === "merchants"  && <MerchantManagement          showToast={showToast} />}
          {page === "apps"       && <AppModeration               showToast={showToast} />}
          {page === "reports"    && <ReportsQueue                showToast={showToast} />}
          {page === "revenue"    && <RevenueDashboard            showToast={showToast} />}
          {page === "waitlist"   && <WaitlistManagement          showToast={showToast} />}
          {page === "settings"   && <AdminSettings               showToast={showToast} />}
        </main>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  const map = {
    success: { bg: "#F0FDF4", border: "#2ECC71", text: "#065F46", icon: "✓" },
    error:   { bg: "#FEF2F2", border: "#E74C3C", text: "#991B1B", icon: "✕" },
    info:    { bg: "#FFF8ED", border: AMBER,      text: "#92400E", icon: "ℹ" },
    warning: { bg: "#FFFBEB", border: "#F59E0B",  text: "#92400E", icon: "⚠" },
  };
  const c = map[toast.type] || map.info;
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      background: c.bg, border: `1px solid ${c.border}`,
      borderLeft: `4px solid ${c.border}`,
      borderRadius: 12, padding: "14px 20px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
      maxWidth: 400, minWidth: 280,
    }}>
      <span style={{ fontSize: 18, color: c.border }}>{c.icon}</span>
      <span style={{ fontSize: 14, color: c.text, fontWeight: 500, flex: 1 }}>{toast.msg}</span>
    </div>
  );
}
