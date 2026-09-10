import { useState } from "react";
import Field from "../../components/UI/Field";
import PrimaryBtn from "../../components/UI/PrimaryBtn";
import ErrBanner from "../../components/UI/ErrBanner";
import api from "../../services/api";
import styles from "../../components/Auth/AdminLogin.module.css";

export default function Register({ showToast, onDone }) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !firstName || !lastName || !phoneNumber) { setError("All fields required"); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", { email, password, firstName, lastName, phoneNumber });
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
            <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Field label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Field label="Phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+234..." />
            <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <PrimaryBtn loading={loading}>Submit for approval</PrimaryBtn>
          </form>
        </div>
      </div>
    </div>
  );
}
