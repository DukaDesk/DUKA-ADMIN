import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Field from "../../components/UI/Field";
import PrimaryBtn from "../../components/UI/PrimaryBtn";
import ErrBanner from "../../components/UI/ErrBanner";
import api from "../../services/api";
import { businessDashboardApi } from "../../services/businessDashboard";
import styles from "../../components/Auth/AdminLogin.module.css";

const ROLE_LABELS = {
  platform_operator: "Platform Operator",
  support_agent: "Support Agent",
  super_admin: "Super Admin",
};

export default function Register({ showToast, onDone }) {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token") || "";

  const [inviteState, setInviteState] = useState("checking"); // checking | valid | invalid
  const [invite, setInvite] = useState(null); // { email, role, expiresAt }
  const [inviteError, setInviteError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) {
      setInviteState("invalid");
      setInviteError("An invite link is required — ask a platform operator for an invite.");
      return;
    }
    setInviteState("checking");
    businessDashboardApi.validateInvite(token)
      .then((res) => {
        if (!active) return;
        const data = res?.data || res;
        setInvite({ email: data.email, role: data.role, expiresAt: data.expiresAt });
        setInviteState("valid");
      })
      .catch((err) => {
        if (!active) return;
        setInviteState("invalid");
        setInviteError(err.message || "This invite link is invalid or expired.");
      });
    return () => { active = false; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (inviteState !== "valid" || !invite) { setError("A valid invite link is required"); return; }
    if (!firstName || !lastName || !phoneNumber || !password) { setError("All fields required"); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        email: invite.email,
        password,
        firstName,
        lastName,
        phoneNumber,
        role: invite.role,
        inviteToken: token,
      });
      setDone(true);
      showToast?.("Account created — you can now sign in", "success");
    } catch (err) {
      setError(err.message || "Failed to register");
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className={styles.container}>
        <div className={styles.rightPanel} style={{ width: "100%" }}>
          <div className={styles.loginContainer}>
            <h2 className={styles.signInHeading}>Account Created</h2>
            <p className={styles.signInSub}>Your admin account is ready. Sign in to access the portal.</p>
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
          <h1 className={styles.heading}>Accept <span className={styles.commandAccent}>Invite</span></h1>
          <p className={styles.description}>Admin access is invite-only — this link was generated for you by a platform operator.</p>
        </div>
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.loginContainer}>
          <h2 className={styles.signInHeading}>Admin Sign Up</h2>
          <p className={styles.signInSub}>Complete your invited account.</p>
          {inviteState === "checking" && <p style={{ fontSize: 13, color: "var(--gray-500)" }} aria-live="polite">Verifying invite link…</p>}
          {inviteState === "invalid" && <ErrBanner msg={inviteError} />}
          {error && <ErrBanner msg={error} />}
          {inviteState === "valid" && invite && (
            <form onSubmit={handleSubmit}>
              <Field label="Email" type="email" value={invite.email} onChange={() => {}} required />
              <div style={{ marginBottom: 18, padding: "10px 12px", border: "1px solid var(--gray-200)", borderRadius: 8, background: "var(--gray-50)" }}>
                <div style={{ fontSize: 11, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: 0.5 }}>Invited role</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>{ROLE_LABELS[invite.role] || invite.role}</div>
              </div>
              <Field label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <Field label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              <Field label="Phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+234..." required />
              <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <PrimaryBtn loading={loading}>Create account</PrimaryBtn>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
