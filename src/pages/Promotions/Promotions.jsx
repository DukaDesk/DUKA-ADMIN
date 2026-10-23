import { useState, useEffect } from "react";
import { businessDashboardApi } from "../../services/businessDashboard";
import { Modal } from "../../components/UI/Modal";
import ConfirmModal from "../../components/UI/ConfirmModal";
import { Sparkles, Film, Clock3 } from "lucide-react";
import styles from "./Promotions.module.css";

// Mirrors the mobile feed's product rule: promos are short-form, 24h posts.
const MEDIA_MAX_ITEMS = 4;
const MEDIA_MAX_BYTES = 50 * 1024 * 1024;
const VIDEO_MAX_SECONDS = 90;
const CAPTION_MAX = 500;
const PLATFORM_TENANT_SLUG = "duka-desk-platform";

export function formatPromoTimeLeft(expiresAt, now = new Date()) {
  if (!expiresAt) return "no expiry";
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (!Number.isFinite(ms)) return "no expiry";
  if (ms <= 0) return "expiring";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h left`;
  return "24h left";
}

export function readVideoDurationSeconds(file) {
  return new Promise((resolve) => {
    if (typeof document === "undefined") { resolve(NaN); return; }
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(typeof el.duration === "number" && Number.isFinite(el.duration) ? el.duration : NaN);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(NaN);
    };
    el.src = url;
  });
}

function mapPost(item) {
  if (!item?.id) return null;
  const media = Array.isArray(item.media) ? item.media : [];
  return {
    id: item.id,
    caption: item.caption || "",
    media,
    status: item.status || "published",
    createdAt: item.createdAt || null,
    expiresAt: item.expiresAt || null,
    platform: (item.tenant?.slug || "") === PLATFORM_TENANT_SLUG,
  };
}

export default function Promotions({ showToast }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [tick, setTick] = useState(0);

  const load = () => {
    setLoading(true);
    businessDashboardApi.listPromoPosts({ page: 1, limit: 30 })
      .then((res) => {
        const body = res ?? {};
        setPosts(Array.isArray(body) ? body.map(mapPost).filter(Boolean) : (body.data || body.items || []).map(mapPost).filter(Boolean));
      })
      .catch((err) => {
        showToast?.(err.message || "Failed to load promo posts", "error");
        setPosts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  // Rerender each minute so the "time left" chips stay honest.
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const canPost = () => caption.trim().length > 0 && caption.length <= CAPTION_MAX && media.length > 0 && !posting;

  const handleFiles = async (files) => {
    if (!files || !files.length) return;
    setMediaUploading(true);
    for (const file of files) {
      if (media.length >= MEDIA_MAX_ITEMS) { showToast?.(`Up to ${MEDIA_MAX_ITEMS} media items per post`, "error"); break; }
      if (file.size > MEDIA_MAX_BYTES) { showToast?.(`${file.name} exceeds the 50MB limit`, "error"); continue; }
      try {
        if (String(file.type).startsWith("video")) {
          const duration = await readVideoDurationSeconds(file);
          if (Number.isFinite(duration) && duration > VIDEO_MAX_SECONDS) {
            showToast?.(`${file.name} is longer than ${VIDEO_MAX_SECONDS}s — trim it first`, "error");
            continue;
          }
        }
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

  const submitPost = async () => {
    if (!canPost()) return;
    setPosting(true);
    try {
      await businessDashboardApi.createPromoPost({
        caption: caption.trim(),
        media: media.map(item => ({ url: item.url, type: item.type, posterUrl: item.posterUrl || undefined })),
      });
      showToast?.("Promo posted — live on the app feed for 24 hours", "success");
      setComposeOpen(false);
      setCaption("");
      setMedia([]);
      load();
    } catch (err) {
      showToast?.(err.message || "Failed to post promo", "error");
    } finally {
      setPosting(false);
    }
  };

  const deletePost = async () => {
    if (!confirmDelete) return;
    try {
      await businessDashboardApi.deletePromoPost(confirmDelete.id);
      showToast?.("Promo retracted", "success");
      setPosts(prev => prev.filter(p => p.id !== confirmDelete.id));
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
        <button className={styles.composeBtn} onClick={() => { setCaption(""); setMedia([]); setComposeOpen(true); }}><Sparkles size={15} /> New Promo</button>
      </div>

      {loading ? (
        <div className={styles.loading} aria-live="polite">Loading promos…</div>
      ) : posts.length === 0 ? (
        <p className={styles.empty}>Nothing promoted yet — compose the first DukaDesk promo.</p>
      ) : (
        <div className={styles.list}>
          {posts.map(post => {
            const first = post.media[0];
            const now = new Date();
            const expired = post.expiresAt ? new Date(post.expiresAt).getTime() <= now.getTime() : false;
            return (
              <div key={post.id} className={styles.card}>
                <span className={styles.thumb}>
                  {first?.type === "image" ? <img src={first.url} alt="" /> : <Film size={22} />}
                </span>
                <span className={styles.cardMain}>
                  <span className={styles.cardCaption}>{post.caption || "(no caption)"}</span>
                  <span className={styles.cardMeta}>
                    {post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
                    {" · "}{post.media.length} media
                    {post.media.filter(m => m.type === "video").length ? ` · ${post.media.filter(m => m.type === "video").length} video` : ""}
                  </span>
                  <span className={`${styles.chip} ${expired ? styles.chipExpired : styles.chipLive}`}>
                    <Clock3 size={11} style={{ verticalAlign: "-2px" }} /> {expired ? "Expired" : formatPromoTimeLeft(post.expiresAt, now)}
                  </span>
                </span>
                <button className={styles.dangerBtn} onClick={() => { if (!expired) setConfirmDelete(post); }} disabled={expired}>Retract</button>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={composeOpen} onClose={() => { if (!posting) setComposeOpen(false); }} title="New DukaDesk promo">
        <div className={styles.composeBody}>
          <label className={styles.fieldLabel}>
            Caption
            <textarea className={styles.textarea} maxLength={CAPTION_MAX} value={caption} onChange={(e) => setCaption(e.target.value)} />
            <span className={styles.counter}>{caption.length}/{CAPTION_MAX}</span>
          </label>

          <div className={styles.fieldLabel}>
            Media — up to {MEDIA_MAX_ITEMS}, images or videos (≤{VIDEO_MAX_SECONDS}s, 50MB)
            <input type="file" accept="image/*,video/*" multiple onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
            {mediaUploading && <span className={styles.hint}>Uploading…</span>}
            {media.length > 0 && (
              <div className={styles.mediaGrid}>
                {media.map((item, index) => (
                  <div key={`${item.url}-${index}`} className={styles.mediaThumb}>
                    {item.type === "image" ? <img src={item.url} alt="" /> : <Film size={20} />}
                    <button title="Remove" onClick={() => setMedia(prev => prev.filter(m => m.url !== item.url))}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.composeFooter}>
          <button className={styles.secondaryBtn} onClick={() => { if (!posting) setComposeOpen(false); }}>Cancel</button>
          <button className={styles.primaryBtn} disabled={!canPost()} onClick={submitPost}>{posting ? "Posting…" : "Post to app feed"}</button>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(confirmDelete)}
        title="Retract this promo?"
        message={confirmDelete ? "It disappears from the app Feed immediately; likes are removed with it." : ""}
        confirmLabel="Retract promo"
        variant="Danger"
        busy={false}
        onConfirm={deletePost}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
