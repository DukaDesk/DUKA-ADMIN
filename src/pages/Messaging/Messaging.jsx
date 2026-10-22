import { useState, useEffect, useCallback } from "react";
import { businessDashboardApi } from "../../services/businessDashboard";
import { Modal } from "../../components/UI/Modal";
import ConfirmModal from "../../components/UI/ConfirmModal";
import styles from "./Messaging.module.css";

const AUDIENCE_OPTIONS = [
  { value: "merchants", label: "Merchants only (dashboard)" },
  { value: "mobile", label: "Mobile users only (app inbox)" },
  { value: "both", label: "Everyone (merchants + mobile users)" },
];

export function describeTarget(item) {
  if (item?.kind === "direct") {
    if (item.tenant?.name) return `Direct · ${item.tenant.name}`;
    if (item.tenantId) return "Direct · merchant";
    return "Direct · mobile user";
  }
  const audiences = { merchants: "Merchants", mobile: "Mobile users", both: "Merchants + Mobile" };
  return `Broadcast · ${audiences[item?.audience] || item?.audience || "all"}`;
}

function mapMessage(item) {
  if (!item?.id) return null;
  const repliesCount = item._count?.replies ?? item.repliesCount ?? (Array.isArray(item.replies) ? item.replies.length : 0);
  const readsCount = item._count?.reads ?? item.readCount ?? 0;
  return {
    id: item.id,
    kind: item.kind === "direct" ? "direct" : "broadcast",
    audience: item.audience || null,
    tenantId: item.tenantId || null,
    tenant: item.tenant || null,
    title: item.title || "",
    body: item.body || "",
    media: Array.isArray(item.media) ? item.media : [],
    status: item.status || "sent",
    createdAt: item.createdAt || null,
    repliesCount,
    readsCount,
    lastReply: item.replies?.[0] || null,
  };
}

export default function Messaging({ showToast }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [kindChoice, setKindChoice] = useState("broadcast");
  const [audience, setAudience] = useState("mobile");
  const [recipientType, setRecipientType] = useState("mobileUser");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const [recipients, setRecipients] = useState({ tenants: [], users: [] });
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [targetMerchantId, setTargetMerchantId] = useState("");
  const [recipientUserId, setRecipientUserId] = useState("");

  useEffect(() => {
    setRecipientsLoading(true);
    businessDashboardApi.getMessageRecipients()
      .then((res) => setRecipients({ tenants: res?.tenants || res?.data?.tenants || [], users: res?.users || res?.data?.users || [] }))
      .catch((err) => showToast?.(err.message || "Failed to load recipient lists", "error"))
      .finally(() => setRecipientsLoading(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await businessDashboardApi.getMessages({ page: 1, limit: 50, kind: kindFilter });
      const body = res ?? {};
      setMessages(Array.isArray(body) ? body.map(mapMessage).filter(Boolean) : (body.data || body.items || []).map(mapMessage).filter(Boolean));
    } catch (err) {
      showToast?.(err.message || "Failed to load messages", "error");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [kindFilter, showToast]);

  useEffect(() => { if (kindFilter) { load(); } }, [kindFilter, load]);
  useEffect(() => { load(); }, [load]);

  const resetComposer = () => {
    setKindChoice("broadcast");
    setAudience("mobile");
    setTargetMerchantId("");
    setRecipientType("mobileUser");
    setRecipientUserId("");
    setTitle("");
    setBody("");
    setMedia([]);
    setMediaUploading(false);
  };

  const canSend = () => {
    if (!body.trim() || body.length > 4000) return false;
    if (kindChoice === "broadcast") return true;
    if (recipientType === "merchant") return Boolean(targetMerchantId);
    return Boolean(recipientUserId);
  };

  const submitCompose = async () => {
    const payload = {
      kind: kindChoice,
      title: title.trim() || undefined,
      body: body.trim(),
    };
    if (kindChoice === "broadcast") {
      payload.audience = audience;
    } else {
      if (recipientType === "merchant") payload.tenantId = targetMerchantId;
      else payload.recipientUserId = recipientUserId;
    }
    if (media.length) payload.media = media.map(item => ({ url: item.url, type: item.type, posterUrl: item.posterUrl || undefined }));
    setSending(true);
    try {
      await businessDashboardApi.createMessage(payload);
      showToast?.("Message sent", "success");
      setComposeOpen(false);
      resetComposer();
      load();
    } catch (err) {
      showToast?.(err.message || "Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  const handleFiles = async (files) => {
    if (!files || !files.length) return;
    setMediaUploading(true);
    for (const file of files) {
      if (media.length >= 4) { showToast?.("Up to 4 media items per message", "error"); break; }
      try {
        const asset = await businessDashboardApi.uploadMessageMedia(file);
        const url = asset?.url || asset?.data?.url;
        if (!url) throw new Error("Upload returned no URL");
        setMedia(prev => [...prev, { url, type: String(file.type).startsWith("video") ? "video" : "image" }]);
      } catch (err) {
        showToast?.(`${file.name} upload failed — ${err.message || "try another file"}`, "error");
      }
    }
    setMediaUploading(false);
  };

  const openThread = async (message) => {
    setThread({ ...message, replies: [] });
    setReplyText("");
    setThreadLoading(true);
    try {
      const full = await businessDashboardApi.getMessageThread(message.id);
      const body = full ?? {};
      setThread(current => (current?.id === message.id ? {
        ...current,
        ...(body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : body),
        replies: (body.replies || body.data?.replies || []).map(r => ({
          id: r.id, author: r.author, body: r.body, createdAt: r.createdAt,
        })),
        readCount: body.readCount ?? body.data?.readCount ?? 0,
      } : current));
    } catch (err) {
      showToast?.(err.message || "Failed to load thread", "error");
    } finally {
      setThreadLoading(false);
    }
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || !thread) return;
    setReplying(true);
    try {
      const reply = await businessDashboardApi.replyMessage(thread.id, text);
      const normalized = reply?.id
        ? { id: reply.id, author: reply.author || "platform", body: reply.body || text, createdAt: reply.createdAt || null }
        : { id: `${Date.now()}`, author: "platform", body: text, createdAt: new Date().toISOString() };
      setThread(current => current ? { ...current, replies: [...(current.replies || []), normalized] } : current);
      setReplyText("");
      showToast?.("Reply sent", "success");
    } catch (err) {
      showToast?.(err.message || "Failed to send reply", "error");
    } finally {
      setReplying(false);
    }
  };

  const deleteMessage = async () => {
    if (!confirmDelete) return;
    try {
      await businessDashboardApi.deleteMessage(confirmDelete.id);
      showToast?.("Message retracted", "success");
      setMessages(prev => prev.filter(m => m.id !== confirmDelete.id));
      if (thread?.id === confirmDelete.id) setThread(null);
    } catch (err) {
      showToast?.(err.message || "Failed to retract", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div />
        <button className={styles.composeBtn} onClick={() => { resetComposer(); setComposeOpen(true); }}>New Message</button>
      </div>

      <div className={styles.filterRow}>
        {[
          { id: "all", label: "All" },
          { id: "broadcast", label: "Broadcasts" },
          { id: "direct", label: "Directs" },
        ].map(option => (
          <button key={option.id} role="tab" aria-selected={kindFilter === option.id} className={`${styles.filterChip} ${kindFilter === option.id ? styles.filterActive : ""}`} onClick={() => setKindFilter(option.id)}>{option.label}</button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading} aria-live="polite">Loading messages…</div>
      ) : messages.length === 0 ? (
        <p className={styles.empty}>Nothing sent yet — compose your first message.</p>
      ) : (
        <div className={styles.list}>
          {messages.map(item => (
            <button key={item.id} className={styles.card} onClick={() => openThread(item)} aria-label={`Open ${item.title || "message"}`}>
              <span className={`${styles.kindBadge} ${item.kind === "direct" ? styles.badgeDirect : styles.badgeBroadcast}`}>{item.kind === "direct" ? "DIRECT" : "BROADCAST"}</span>
              <span className={styles.cardMain}>
                <span className={styles.cardTitle}>{item.title || (item.kind === "direct" ? "Direct message" : "Announcement")}</span>
                <span className={styles.cardBody}>{item.body}</span>
                <span className={styles.cardMeta}>
                  {describeTarget(item)} · {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                  {" · "}{item.repliesCount} repl{item.repliesCount === 1 ? "y" : "ies"} · {item.readsCount} read{item.readsCount === 1 ? "" : "s"}
                  {item.media?.length ? ` · ${item.media.length} media` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <Modal isOpen={composeOpen} onClose={() => { if (!sending) { setComposeOpen(false); } }} title="New platform message">
        <div className={styles.composeBody}>
          <div className={styles.modeRow}>
            {["broadcast", "direct"].map(mode => (
              <button key={mode} className={`${styles.modeChip} ${kindChoice === mode ? styles.modeActive : ""}`} onClick={() => setKindChoice(mode)}>{mode === "broadcast" ? "Broadcast" : "Direct message"}</button>
            ))}
          </div>

          {kindChoice === "broadcast" ? (
            <label className={styles.fieldLabel}>
              Audience
              <select className={styles.select} value={audience} onChange={(e) => setAudience(e.target.value)}>
                {AUDIENCE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <span className={styles.hint}>Broadcast messages can reach everyone, all mobile users only, or all merchants only.</span>
            </label>
          ) : (
            <>
              <div className={styles.modeRow}>
                {[
                  { id: "merchant", label: "Merchant" },
                  { id: "mobileUser", label: "Mobile user" },
                ].map(option => (
                  <button key={option.id} className={`${styles.modeChip} ${recipientType === option.id ? styles.modeActive : ""}`} onClick={() => setRecipientType(option.id)}>{option.label}</button>
                ))}
              </div>
              {recipientType === "merchant" ? (
                <label className={styles.fieldLabel}>
                  Merchant
                  <select className={styles.select} value={targetMerchantId} onChange={(e) => setTargetMerchantId(e.target.value)}>
                    <option value="">{recipientsLoading ? "Loading merchants…" : "Select a merchant"}</option>
                    {recipients.tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>{tenant.name}{tenant.slug ? ` · ${tenant.slug}` : ""}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className={styles.fieldLabel}>
                  Recipient (from users list)
                  <select className={styles.select} value={recipientUserId} onChange={(e) => setRecipientUserId(e.target.value)}>
                    <option value="">{recipientsLoading ? "Loading users…" : "Select an app user"}</option>
                    {recipients.users.map(user => (
                      <option key={user.id} value={user.id}>{user.name || user.email}{user.email && user.name ? ` · ${user.email}` : ""}</option>
                    ))}
                  </select>
                  <span className={styles.hint}>Users are keyed by their account id — messages land in their app inbox and thread.</span>
                </label>
              )}
            </>
          )}

          <label className={styles.fieldLabel}>
            Title (optional)
            <input className={styles.input} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className={styles.fieldLabel}>
            Message
            <textarea className={styles.textarea} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
            <span className={styles.counter}>{body.length}/4000</span>
          </label>

          <div className={styles.fieldLabel}>
            Media (up to 4) — images or video
            <input type="file" accept="image/*,video/*" multiple onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
            {mediaUploading && <span className={styles.hint}>Uploading…</span>}
            {media.length > 0 && (
              <div className={styles.mediaGrid}>
                {media.map((item, index) => (
                  <div key={`${item.url}-${index}`} className={styles.mediaThumb}>
                    {item.type === "image" ? <img src={item.url} alt="" /> : <span>Video</span>}
                    <button title="Remove" onClick={() => setMedia(prev => prev.filter(m => m.url !== item.url))}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.composeFooter}>
          <button className={styles.secondaryBtn} onClick={() => { if (!sending) setComposeOpen(false); }}>Cancel</button>
          <button className={styles.primaryBtn} disabled={!canSend() || sending} onClick={submitCompose}>{sending ? "Sending…" : "Send message"}</button>
        </div>
      </Modal>

      <Modal isOpen={Boolean(thread)} onClose={() => setThread(null)} title={thread?.title || (thread?.kind === "direct" ? "Direct message" : "Announcement")}>
        <div className={styles.threadScroll}>
          {thread && (
            <>
              <div className={styles.threadMeta}>{describeTarget(thread)} · {thread.createdAt ? new Date(thread.createdAt).toLocaleString() : ""} · {thread.readCount ?? 0} recipient{""} reads</div>
              <div className={styles.bubblePlatform}>
                {thread.media?.length ? (
                  <div className={styles.mediaGrid}>
                    {thread.media.map((m, i) => (
                      <div key={i} className={styles.mediaThumb}>{m.type === "image" ? <img src={m.url} alt="" /> : <span>Video</span>}</div>
                    ))}
                  </div>
                ) : null}
                <div className={styles.bubbleText}>{thread.body}</div>
              </div>
              {threadLoading && <div className={styles.hint}>Loading replies…</div>}
              {(thread.replies || []).map(reply => (
                <div key={reply.id} className={`${styles.bubble} ${reply.author === "platform" ? styles.bubblePlatform : styles.bubbleMerchant}`}>
                  <div className={styles.bubbleAuthor}>{reply.author === "platform" ? "DukaDesk Team" : "Merchant"}</div>
                  <div className={styles.bubbleText}>{reply.body}</div>
                  <div className={styles.bubbleTime}>{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ""}</div>
                </div>
              ))}
            </>
          )}
        </div>
        <div className={styles.composeFooter}>
          {thread && (
            <button className={styles.dangerBtn} onClick={() => setConfirmDelete(thread)}>Retract</button>
          )}
          <div className={styles.replyRowGrow}>
            <input className={styles.input} placeholder="Reply as DukaDesk team…" value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={2000} />
            <button className={styles.primaryBtn} disabled={!replyText.trim() || replying} onClick={sendReply}>{replying ? "Sending…" : "Reply"}</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(confirmDelete)}
        title="Retract this message?"
        message={confirmDelete ? "Replies and read receipts are deleted with it. Recipients lose access from their inboxes too." : ""}
        confirmLabel="Retract message"
        variant="Danger"
        busy={false}
        onConfirm={deleteMessage}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
