import { useCallback, useEffect, useState } from "react";
import { X, Check, ShieldCheck, Store } from "lucide-react";
import { Modal } from "../../components/UI/Modal";
import Field from "../../components/UI/Field";
import PhonePreview from "./PhonePreview";
import styles from "./MerchantReview.module.css";
import { businessDashboardApi } from "../../services/businessDashboard";
import { canViewEmail } from "../../services/permissions";
import { maskEmail } from "../../utils/maskEmail";
import { recordAuditEvent } from "../../services/audit";
import { toneBackground } from "../../utils/badgeTones";

function initials(name) {
  return String(name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function responseData(response, key) {
  const data = response?.data?.data || response?.data || response;
  return key ? data?.[key] || data : data;
}

function StatusPill({ value, tones }) {
  const v = String(value || "—").toLowerCase();
  const color = tones[v] || "var(--gray-500)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 700, background: toneBackground(color), color, textTransform: "capitalize" }}>
      {String(value || "—")}
    </span>
  );
}

const VERIFICATION_TONES = { pending: "var(--amber)", unknown: "var(--gray-400)", verified: "var(--green)", rejected: "var(--red)" };
const APP_TONES = { none: "var(--gray-400)", in_review: "var(--amber)", approved: "var(--green)", rejected: "var(--red)" };

function ApprovalStage({ number, title, description, status, tones, locked = false }) {
  const color = locked ? "var(--gray-300)" : tones[status] || "var(--gray-400)";
  return (
    <section aria-label={`Stage ${number}: ${title}`} style={{ border: `1px solid ${toneBackground(color)}`, borderLeft: `4px solid ${color}`, borderRadius: 10, padding: "14px 16px", background: locked ? "var(--gray-50)" : "#fff", opacity: locked ? 0.75 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Stage {number}</div>
          <h3 style={{ margin: "2px 0 0", fontSize: 14, color: "var(--navy)" }}>{title}</h3>
        </div>
        <StatusPill value={locked ? "locked" : status.replace("_", " ")} tones={{ ...tones, locked: "var(--gray-400)" }} />
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "var(--gray-600)", lineHeight: 1.5 }}>{description}</p>
    </section>
  );
}

export default function MerchantReview({ merchantId, admin, canManage, showToast, onClose, onChanged }) {
  const [review, setReview] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [declineMode, setDeclineMode] = useState(null); // 'credentials' | 'app' | null
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setReview(null);
    setPreview(null);
    setPreviewFailed(false);
    try {
      const res = await businessDashboardApi.getMerchantReview(merchantId);
      const data = responseData(res, "review");
      setReview(data);
      try {
        const pRes = await businessDashboardApi.getMerchantPreview(merchantId);
        setPreview(responseData(pRes, "preview"));
        setPreviewFailed(false);
      } catch {
        setPreview(null);
        setPreviewFailed(true);
      }
    } catch (err) {
      setError(err.message || "Unable to load merchant review.");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tenant = review?.tenant || {};
  const ownerEntry = Array.isArray(tenant.users) ? tenant.users[0] : null;
  const owner = ownerEntry?.user || tenant.owner || tenant.user || {};
  const merchantPhoto = owner.profilePicture || owner.profileImage || owner.avatarUrl || owner.avatar || owner.image || tenant.profilePicture || tenant.profileImage;
  const compliance = Array.isArray(review?.compliance) ? review.compliance : [];
  const subscription = review?.tenant?.subscription || tenant.subscription || null;
  const plan = subscription?.plan || null;
  const quota = review?.quota || null;
  const releases = Array.isArray(review?.releases) ? review.releases : [];
  const draftPages = Array.isArray(review?.draftPages) ? review.draftPages : [];
  const app = review?.app || tenant.app || preview?.app || {};

  const verification = String(tenant.verificationStatus || review?.verificationStatus || tenant.complianceStatus || "unknown").toLowerCase();
  const appStatus = String(tenant.appStatus || review?.appStatus || "none").toLowerCase();
  const previewPages = preview?.pages || preview?.screens || preview?.draftPages || [];
  const hasPreview = Array.isArray(previewPages) && previewPages.length > 0;
  const hasComplianceSubmission = compliance.length > 0 || Boolean(tenant.complianceSubmittedAt || tenant.credentialsSubmittedAt || tenant.verificationSubmittedAt || tenant.complianceStatus === "submitted");
  const canVerify = verification !== "verified" && hasComplianceSubmission;
  const canApproveApp = verification === "verified" && appStatus === "in_review" && hasPreview;

  const runAction = async (kind, fn, auditAction, successMsg) => {
    setBusy(kind);
    try {
      await fn();
      recordAuditEvent({ admin, action: auditAction, target: merchantId });
      showToast?.(successMsg, "success");
      setDeclineMode(null);
      setReason("");
      await load();
      onChanged?.();
    } catch (err) {
      showToast?.(err.message || "Action failed", "error");
    } finally {
      setBusy("");
    }
  };

  const submitDecline = () => {
    if (!reason.trim()) { setReasonError("A reason is required"); return; }
    if (reason.trim().length < 8) { setReasonError("Please provide at least 8 characters"); return; }
    const comment = reason.trim();
    if (declineMode === "credentials") {
      return runAction("decline", () => businessDashboardApi.rejectCredentials(merchantId, { reason: comment }), "merchant.verify_reject", `${tenant.name || "Merchant"} credentials rejected`);
    }
    return runAction("decline", () => businessDashboardApi.rejectApp(merchantId, { reason: comment }), "merchant.app_reject", `${tenant.name || "Merchant"} app rejected`);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Review ${tenant.name || "merchant"}`} style={{ position: "fixed", inset: 0, zIndex: 500, background: "#fff", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", borderBottom: "1px solid var(--gray-200)", flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Merchant Review</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--navy)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tenant.name || "Merchant"}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusPill value={verification} tones={VERIFICATION_TONES} />
          <StatusPill value={appStatus.replace("_", " ")} tones={APP_TONES} />
        </div>
        {merchantPhoto ? (
          <img src={merchantPhoto} alt={`${[owner.firstName, owner.lastName].filter(Boolean).join(" ") || tenant.name || "Merchant"} profile`} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--gray-200)", flexShrink: 0 }} />
        ) : (
          <div aria-hidden="true" style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--amber)", color: "var(--navy)", fontWeight: 800, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {initials([owner.firstName, owner.lastName].filter(Boolean).join(" ") || tenant.name)}
          </div>
        )}
        <button type="button" onClick={onClose} aria-label="Close review" style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--gray-200)", background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--gray-500)", flexShrink: 0 }}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {loading && <p aria-live="polite" style={{ fontSize: 13, color: "var(--gray-500)" }}>Loading review…</p>}
        {error && !loading && <div role="alert" style={{ background: "#FEF2F2", color: "var(--red)", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}
        {!loading && !error && review && (
          <div className={styles.reviewGrid}>
            <div className={styles.approvalStages}>
              <ApprovalStage
                number={1}
                title="Merchant verification"
                description={verification === "verified" ? "Credentials and compliance have been approved. The merchant can submit an app for review." : verification === "rejected" ? "Credentials were rejected. Review the compliance notes and documents before taking further action." : hasComplianceSubmission ? "Compliance details have been submitted. Review the credentials and documents, then verify or reject them." : "Waiting for the merchant to submit compliance credentials for verification."}
                status={verification}
                tones={VERIFICATION_TONES}
              />
              <ApprovalStage
                number={2}
                title="App approval"
                description={verification !== "verified" ? "Available after merchant verification." : appStatus === "in_review" && hasPreview ? "The app is ready for review. Check the mobile preview before approving or declining." : appStatus === "in_review" ? "The merchant submitted an app, but its preview is not available yet." : appStatus === "approved" ? "The app has been approved and is live." : appStatus === "rejected" ? "The app was declined. Review the submission again after the merchant updates it." : "Waiting for the verified merchant to create and submit an app."}
                status={appStatus === "none" ? "pending" : appStatus}
                tones={{ ...APP_TONES, pending: "var(--gray-400)" }}
                locked={verification !== "verified"}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
              <section aria-label="Credentials" style={{ background: "#fff", border: "1px solid var(--gray-200)", borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={16} aria-hidden="true" /> Credentials
                </h3>
                <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                  <div><strong style={{ color: "var(--gray-600)" }}>Business:</strong> {tenant.name || "—"}</div>
                  <div><strong style={{ color: "var(--gray-600)" }}>Email:</strong> {canViewEmail(admin) ? tenant.email || "—" : maskEmail(tenant.email)} {tenant.email && owner.emailVerified === false && <span style={{ color: "var(--red)", fontSize: 11 }}>· unverified</span>}</div>
                  <div><strong style={{ color: "var(--gray-600)" }}>Phone:</strong> {tenant.phone || owner.phoneNumber || "—"}</div>
                  <div><strong style={{ color: "var(--gray-600)" }}>Owner:</strong> {[owner.firstName, owner.lastName].filter(Boolean).join(" ") || "—"}{owner.email ? ` · ${canViewEmail(admin) ? owner.email : maskEmail(owner.email)}` : ""}</div>
                  <div><strong style={{ color: "var(--gray-600)" }}>Joined:</strong> {tenant.createdAt ? new Date(tenant.createdAt).toLocaleString() : "—"}</div>
                </div>
                {compliance.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>Compliance documents ({compliance.length})</div>
                    {compliance.map((c) => (
                      <div key={c.id} style={{ padding: 10, border: "1px solid var(--gray-100)", borderRadius: 8, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <strong style={{ fontSize: 13 }}>{c.businessName || "Submission"}</strong>
                          <StatusPill value={c.status} tones={{ pending: "var(--amber)", approved: "var(--green)", rejected: "var(--red)" }} />
                        </div>
                        <div style={{ fontSize: 12, color: "var(--gray-600)", marginTop: 4 }}>
                          {[c.regNo && `Reg: ${c.regNo}`, c.taxId && `Tax: ${c.taxId}`, c.nin && `NIN: ${c.nin}`, c.bvn && `BVN: ${c.bvn}`].filter(Boolean).join(" · ") || "No registration numbers"}
                        </div>
                        {Array.isArray(c.documents) && c.documents.length > 0 && (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                            {c.documents.map((d, i) => (
                              <a key={i} href={d.url || d} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--primary)", textDecoration: "underline" }}>
                                {d.name || `Document ${i + 1}`}
                              </a>
                            ))}
                          </div>
                        )}
                        {c.reviewNote && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 6 }}>Note: {c.reviewNote}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {canManage && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button type="button" disabled={!canVerify || busy} onClick={() => runAction("verify", () => businessDashboardApi.verifyMerchant(merchantId), "merchant.verify", `${tenant.name || "Merchant"} verified`)} style={{ padding: "8px 16px", background: "var(--green)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: canVerify && !busy ? "pointer" : "not-allowed", opacity: canVerify && !busy ? 1 : 0.6 }}>
                      {busy === "verify" ? "Verifying…" : "Verify Merchant"}
                    </button>
                    <button type="button" disabled={!canVerify || busy} onClick={() => { setDeclineMode("credentials"); setReason(""); setReasonError(""); }} style={{ padding: "8px 16px", background: "#fff", border: "1px solid var(--red)", color: "var(--red)", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: canVerify && !busy ? "pointer" : "not-allowed", opacity: canVerify && !busy ? 1 : 0.6 }}>
                      Reject Credentials
                    </button>
                  </div>
                )}
              </section>

              <section aria-label="Subscription" style={{ background: "#fff", border: "1px solid var(--gray-200)", borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", margin: "0 0 12px" }}>Subscription</h3>
                {subscription ? (
                  <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                    <div><strong style={{ color: "var(--gray-600)" }}>Plan:</strong> {plan?.name || "—"}{plan?.price != null ? ` · ${new Intl.NumberFormat("en-NG", { style: "currency", currency: plan.currency || "NGN", maximumFractionDigits: 0 }).format(Number(plan.price))}` : ""}</div>
                    <div><strong style={{ color: "var(--gray-600)" }}>Status:</strong> {subscription.status || "—"}</div>
                    {(subscription.currentPeriodEnd || subscription.renewalDate || subscription.nextBillingDate || subscription.expiresAt) && <div><strong style={{ color: "var(--gray-600)" }}>Renews:</strong> {new Date(subscription.currentPeriodEnd || subscription.renewalDate || subscription.nextBillingDate || subscription.expiresAt).toLocaleDateString()}</div>}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--gray-500)", margin: 0 }}>No subscription yet.</p>
                )}
                {quota && <div style={{ fontSize: 12, marginTop: 8, padding: 8, background: "var(--gray-50)", borderRadius: 6 }}>API quota: {quota.used ?? quota.currentDay ?? "—"}/{quota.limit ?? quota.max ?? quota.requestsPerDay ?? "—"}</div>}
              </section>

              <section aria-label="App details" style={{ background: "#fff", border: "1px solid var(--gray-200)", borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Store size={16} aria-hidden="true" /> App Details
                </h3>
                <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <div><strong style={{ color: "var(--gray-600)" }}>App name:</strong> {app.name || preview?.tenant?.name || tenant.appName || "—"}</div>
                  <div><strong style={{ color: "var(--gray-600)" }}>Category:</strong> {app.category || tenant.category || "—"}</div>
                  <div><strong style={{ color: "var(--gray-600)" }}>Store URL:</strong> {app.slug || tenant.slug ? `/${app.slug || tenant.slug}` : "—"}</div>
                  <div><strong style={{ color: "var(--gray-600)" }}>Screens:</strong> {previewPages.length || draftPages.length}</div>
                  {app.template && <div><strong style={{ color: "var(--gray-600)" }}>Template:</strong> {app.template}</div>}
                  {(app.submittedAt || tenant.appSubmittedAt) && <div><strong style={{ color: "var(--gray-600)" }}>Submitted:</strong> {new Date(app.submittedAt || tenant.appSubmittedAt).toLocaleString()}</div>}
                  <div><strong style={{ color: "var(--gray-600)" }}>Releases:</strong> {releases.length > 0 ? releases.map((r) => `v${r.version} (${r.status})`).join(", ") : "None yet"}</div>
                  <div><strong style={{ color: "var(--gray-600)" }}>Review state:</strong> {appStatus.replace("_", " ")}</div>
                </div>
              </section>
            </div>

            <div style={{ position: "sticky", top: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", margin: "0 0 12px" }}>App Preview</h3>
              {preview ? (
                <PhonePreview preview={preview} />
              ) : (
                <div style={{ width: 300, maxWidth: "100%", height: 400, border: "1px dashed var(--gray-200)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--gray-400)", textAlign: "center", padding: 16 }}>
                  {previewFailed ? "Preview unavailable for this merchant." : "Loading preview…"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", borderTop: "1px solid var(--gray-200)", flexShrink: 0, background: "#fff" }}>
        <button
          type="button"
          disabled={!canManage || !canApproveApp || busy}
          onClick={() => runAction("approve", () => businessDashboardApi.approveApp(merchantId), "merchant.app_approve", `${tenant.name || "Merchant"} app approved — now live`)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "var(--green)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: canManage && canApproveApp && !busy ? "pointer" : "not-allowed", opacity: canManage && canApproveApp && !busy ? 1 : 0.6 }}
          title={canApproveApp ? "Approve app and publish live" : verification !== "verified" ? "Verify the merchant first" : appStatus !== "in_review" ? "Waiting for the merchant to submit the app" : "A submitted app preview is required before approval"}
        >
          <Check size={16} aria-hidden="true" /> {busy === "approve" ? "Approving…" : "Approve App"}
        </button>
        <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
          {!canManage ? "Read-only access." : verification !== "verified" ? "Stage 1: verify the merchant first." : appStatus === "in_review" && hasPreview ? "Stage 2: review the preview, then approve." : appStatus === "in_review" ? "App preview unavailable; approval is disabled." : appStatus === "approved" ? "App is live." : "Waiting for the merchant to submit the app."}
        </span>
        <span style={{ flex: 1 }} />
        {canManage && appStatus === "in_review" && (
          <button type="button" disabled={busy} onClick={() => { setDeclineMode("app"); setReason(""); setReasonError(""); }} style={{ padding: "10px 16px", background: "#fff", border: "1px solid var(--red)", color: "var(--red)", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Decline App
          </button>
        )}
        <button type="button" onClick={onClose} style={{ padding: "10px 16px", background: "var(--gray-100)", border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Close
        </button>
      </footer>

      <Modal isOpen={!!declineMode} onClose={() => setDeclineMode(null)} title={declineMode === "app" ? "Decline app design" : "Reject credentials"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--gray-600)", margin: 0 }}>
            {declineMode === "app" ? <>Decline the app design for <strong>{tenant.name}</strong>? It will stay unpublished.</> : <>Reject credentials for <strong>{tenant.name}</strong>? The merchant stays unverified.</>}
          </p>
          <Field label="Reason (required)" value={reason} onChange={(e) => { setReason(e.target.value); setReasonError(""); }} placeholder="Explain why" required />
          {reasonError && <div role="alert" style={{ fontSize: 12, color: "var(--red)", background: "#FEF2F2", padding: 8, borderRadius: 6 }}>{reasonError}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setDeclineMode(null)} style={{ padding: "8px 16px", background: "var(--gray-100)", border: "1px solid var(--gray-200)", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
            <button onClick={submitDecline} disabled={busy} style={{ padding: "8px 16px", background: "var(--red)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
              {busy === "decline" ? "Declining…" : "Confirm Decline"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
