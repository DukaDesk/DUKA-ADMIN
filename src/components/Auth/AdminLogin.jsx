import { useState, useRef } from "react";
import Field from "../UI/Field";
import PrimaryBtn from "../UI/PrimaryBtn";
import ErrBanner from "../UI/ErrBanner";
import api, { USE_MOCK } from "../../services/api";
import { unwrapAuth } from "../../utils/unwrapAuth";
import styles from "./AdminLogin.module.css";

export { unwrapAuth };

function AdminLogin({ onLogin, showToast }) {
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authResult, setAuthResult] = useState(null);

  const otpRefs = useRef([]);

const handleCredentials = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setLoading(true);
    api.post("/auth/login", { email, password })
      .then(async (result) => {
        await api.post("/auth/send-otp", { email });
        const { token, admin } = unwrapAuth(result);
        setAuthResult({ token, admin });
        setStep("2fa");
      })
      .catch((requestError) => {
        const msg = requestError.message || "";
        if (msg.includes("Failed to fetch") || msg.includes("CORS") || msg.includes("NetworkError")) {
          setError("Cannot reach the server. This is likely a CORS issue — backend must allow this domain.");
        } else {
          setError(msg || "Unable to sign in. Please try again.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

const handleOtp = (e) => {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    setLoading(true);
    api.post("/auth/verify-otp", { email, otp: code, code })
      .then((result) => {
        const { token, admin } = unwrapAuth(result);
        const fallback = authResult ? { token: authResult.token, admin: authResult.admin } : null;
        const payload = token ? { token, admin } : fallback;
        onLogin(payload);
      })
      .catch((requestError) => {
        const msg = requestError.message || "";
        if (msg.includes("Failed to fetch") || msg.includes("CORS") || msg.includes("NetworkError")) {
          setError("Cannot reach the server. This is likely a CORS issue — backend must allow this domain.");
        } else {
          setError(msg || "Unable to verify the code. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  };

  const handleOtpInput = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const fillDemo = () => {
    setEmail("superadmin@dukadesk.com");
    setPassword("Admin@2024!");
  };

  const fillDemoOtp = () => {
    const code = "123456";
    code.split("").forEach((d, i) => {
      setTimeout(() => {
        setOtp((prev) => {
          const next = [...prev];
          next[i] = d;
          return next;
        });
        otpRefs.current[i]?.focus();
      }, i * 100);
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div>
          <div className={styles.logoArea}>
            <div className={styles.amberBadge}>D</div>
            <span className={styles.brandTitle}>DukaDesk</span>
            <span className={styles.adminTag}>ADMIN</span>
          </div>
          <h1 className={styles.heading}>
            Platform <span className={styles.commandAccent}>Command</span> Centre
          </h1>
          <p className={styles.description}>
            Centralised control for user management, merchant oversight, app moderation, and
            platform analytics.
          </p>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>👥</span>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Active Users</span>
                <span className={styles.statValue}>14,500+</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>🏪</span>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Merchants</span>
                <span className={styles.statValue}>6,800+</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>📱</span>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Apps Listed</span>
                <span className={styles.statValue}>2,340+</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>💰</span>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Total Revenue</span>
                <span className={styles.statValue}>₦8.2B+</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.securityFooter}>
          <span className={styles.securityIcon}>🔒</span>
          <span>Protected by AES-256 encryption • SOC 2 compliant</span>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.loginContainer}>
          {step === "credentials" ? (
            <>
              <h2 className={styles.signInHeading}>Admin Sign In</h2>
              <p className={styles.signInSub}>
                Enter your credentials to access the control panel
              </p>
              {error && <ErrBanner msg={error} />}
              <form onSubmit={handleCredentials}>
                <Field
                  label="Email Address"
                  type="email"
                  placeholder="superadmin@dukadesk.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className={styles.passwordWrapper}>
                  <Field
                    label="Password"
                    type={showPw ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.showPwBtn}
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                  >
                    {showPw ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                <div className={styles.forgotLink}>
                  <button type="button">Forgot password?</button>
                </div>
                <PrimaryBtn loading={loading}>Continue →</PrimaryBtn>
              </form>
              {USE_MOCK && (
                <div className={styles.demoBox}>
                  <div className={styles.demoInfo}>
                    <span className={styles.demoLabel}>Demo Credentials</span>
                    <span className={styles.demoText}>
                      Click to auto-fill test admin account
                    </span>
                  </div>
                  <button type="button" className={styles.fillDemoBtn} onClick={fillDemo}>
                    Auto-fill
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className={styles.authIcon}>🔐</div>
              <h2 className={styles.signInHeading} style={{ textAlign: "center" }}>
                Two-Factor Authentication
              </h2>
              <p className={styles.signInSub} style={{ textAlign: "center" }}>
                Enter the 6-digit code sent to{" "}
                <strong style={{ color: "var(--navy)" }}>{email}</strong>
              </p>
              {error && <ErrBanner msg={error} />}
              <form onSubmit={handleOtp}>
                <div className={styles.otpContainer}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      className={styles.otpInput}
                      type="text"
                      maxLength={1}
                      value={d}
                      style={{
                        borderColor: d ? "var(--amber)" : "var(--gray-200)",
                      }}
                      onChange={(e) => handleOtpInput(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onFocus={(e) => {
                        e.target.style.borderColor = "var(--amber)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = d ? "var(--amber)" : "var(--gray-200)";
                      }}
                    />
                  ))}
                </div>
                <PrimaryBtn loading={loading}>Verify &amp; Sign In</PrimaryBtn>
              </form>
              <div className={styles.verifyActions}>
                {USE_MOCK && (
                  <button type="button" className={styles.fillDemoBtn} onClick={fillDemoOtp}>
                    Auto-fill Demo Code
                  </button>
                )}
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => {
                    setStep("credentials");
                    setError("");
                    setOtp(["", "", "", "", "", ""]);
                  }}
                >
                  ← Back
                </button>
              </div>
              <div className={styles.resendText}>
                Didn't receive a code?{" "}
                <button
                  type="button"
                  className={styles.resendLink}
                  onClick={async () => {
                    try {
                      await api.post("/auth/send-otp", { email });
                      showToast("Verification code resent", "info");
} catch (requestError) {
                      const msg = requestError.message || "";
                      if (msg.includes("Failed to fetch") || msg.includes("CORS") || msg.includes("NetworkError")) {
                        setError("Cannot reach the server. This is likely a CORS issue — backend must allow this domain.");
                      } else {
                        setError(msg || "Unable to resend the verification code.");
                      }
                    }
                  }}
                >
                  Resend code
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
