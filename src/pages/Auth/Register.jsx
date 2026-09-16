import { useState } from "react";
import Field from "../../components/UI/Field";
import PrimaryBtn from "../../components/UI/PrimaryBtn";
import ErrBanner from "../../components/UI/ErrBanner";
import api from "../../services/api";
import styles from "../../components/Auth/AdminLogin.module.css";

const ROLE_OPTIONS = [
  { value: "platform_operator", label: "Platform Operator", desc: "Manage tenants & operations" },
  { value: "support_agent", label: "Support Agent", desc: "Support tenant users" },
  { value: "super_admin", label: "Super Admin", desc: "Full platform control" },
];

export default function Register({ showToast, onDone }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !firstName || !lastName || !phoneNumber) { setError("All fields required"); return; }
    if (!role) { setError("Please select a role"); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", { email, password, firstName, lastName, phoneNumber, role });
      setDone(true);
      showToast?.("Application submitted — super admin will review", "success");
    } catch (err) {
      setError(err.message || "Failed to register");
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className={styles.container}>
        <div className={styles.rightPanel} style={{ width: "100%" }}>
          <div className={styles.loginContainer}>
            <h2 className={styles.signInHeading}>Pending Approval</h2>
            <p className={styles.signInSub}>Your account is awaiting super admin approval before it can be created.</p>
            <button className={styles.backBtn} onClick={onDone}>Back to login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div>
          <div className={styles.logoArea}><div className={styles.amberBadge}>D</div><span className={styles.brandTitle}>DukaDesk</span><span className={styles.adminTag}>ADMIN</span></div>
          <h1 className={styles.heading}>Request <span className={styles.commandAccent}>Access</span></h1>
          <p className={styles.description}>Sign up via hidden URL — super admin must approve before account is created.</p>
        </div>
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.loginContainer}>
          <h2 className={styles.signInHeading}>Admin Sign Up</h2>
          <p className={styles.signInSub}>Hidden navigation — accessible only via direct URL.</p>
          {error && <ErrBanner msg={error} />}
          <form onSubmit={handleSubmit}>
            <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Field label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <Field label="Phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+234..." required />
            <fieldset style={{ border: "none", padding: 0, margin: "0 0 18px 0" }}>
              <legend style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 8, display: "flex", gap: 4 }}>
                Role <span aria-hidden="true" style={{ color: "var(--red)" }}>*</span>
              </legend>
              {/* Tab toggle / radio group — keyboard navigable, screen-reader friendly */}
              <div role="radiogroup" aria-label="Select role" aria-required="true" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ROLE_OPTIONS.map((opt) => {
                  const checked = role === opt.value;
                  return (
                    <label
                      key={opt.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: checked ? "2px solid var(--amber)" : "1px solid var(--gray-200)",
                        background: checked ? "var(--amber-alpha-10, #FFF7ED)" : "#fff",
                        cursor: "pointer",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={opt.value}
                        checked={checked}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        aria-label={opt.label}
                        style={{ accentColor: "var(--amber)", width: 16, height: 16 }}
                      />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", display: "block" }}>{opt.label}</span>
                        <span style={{ fontSize: 11, color: "var(--gray-500)" }}>{opt.desc}</span>
                      </span>
                      {checked && <span aria-hidden="true" style={{ color: "var(--amber)", fontSize: 14 }}>✓</span>}
                    </label>
                  );
                })}
              </div>
              {/* Native select fallback for autofill / mobile — visually hidden but participates in form validation */}
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                aria-label="Role (fallback)"
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
              >
                <option value="">Select role</option>
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {!role && <span id="role-help" style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 6, display: "block" }}>Select the platform role you are requesting. Requires admin approval.</span>}
            </fieldset>
            <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <PrimaryBtn loading={loading}>Submit for approval</PrimaryBtn>
          </form>
        </div>
      </div>
    </div>
  );
}
