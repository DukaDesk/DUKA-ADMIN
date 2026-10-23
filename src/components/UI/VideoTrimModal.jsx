import { useEffect, useMemo, useRef, useState } from "react";
import { X, Scissors, Loader2 } from "lucide-react";
import { maxSectionSeconds, extractVideoSection, VIDEO_UPLOAD_BUDGET_BYTES } from "../../utils/videoTrim";

const NAVY = "#1A1A2E";
const AMBER = "#F4A026";

export const fmtBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
};

const fmtTime = (seconds) => {
  const total = Math.max(0, Math.round(seconds * 10) / 10);
  const mins = Math.floor(total / 60);
  const secs = Math.floor(total % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

/** WhatsApp-style cutter for videos that are too large to upload: pick the
 *  section to keep now — the next section auto-queues after each send. */
export default function VideoTrimModal({ file, targetBytes, maxSeconds, onClose, onSection, showToast }) {
  const isBusyRef = useRef(false);
  const previewRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const budget = targetBytes || VIDEO_UPLOAD_BUDGET_BYTES;

  const sectionCap = (nativeDuration) => {
    const sizeCap = maxSectionSeconds(file, nativeDuration);
    const timeCap = maxSeconds > 0 ? maxSeconds : Infinity;
    return Math.max(1, Math.min(sizeCap || nativeDuration, timeCap === Infinity ? nativeDuration : timeCap));
  };
  const cap = duration > 0 ? sectionCap(duration) : 0;
  const clipLength = Math.max(0, end - start);
  const totalSections = cap > 0 ? Math.ceil(duration / cap) : 0;

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  // Reset the section window whenever a new file lands in the modal.
  useEffect(() => {
    if (!file) return;
    isBusyRef.current = false;
    setBusy(false);
    setProgress(0);
    setSectionIndex(0);
    setStart(0);
    setDuration(0);
    setEnd(0);
  }, [file]);

  const handleMetadata = (event) => {
    const nativeDuration = Number(event.target.duration);
    if (!Number.isFinite(nativeDuration) || nativeDuration <= 0) {
      showToast?.("Could not read the video length — try another file", "error");
      onClose?.();
      return;
    }
    setDuration(nativeDuration);
    setEnd(Math.min(nativeDuration, sectionCap(nativeDuration)));
  };

  const moveStart = (value) => {
    const next = Math.min(Number(value), Math.max(0, duration - 0.5));
    setStart(next);
    if (end - next > cap) setEnd(Math.min(duration, next + cap));
  };

  const moveEnd = (value) => {
    const wanted = Math.max(Number(value), start + 0.5);
    setEnd(Math.min(duration, start + Math.min(wanted - start, cap)));
  };

  const keepSection = async () => {
    if (busy || isBusyRef.current) return;
    if (clipLength < 0.5) { showToast?.("Pick a longer section", "error"); return; }
    isBusyRef.current = true;
    setBusy(true);
    setProgress(0);
    previewRef.current?.pause();
    try {
      const blob = await extractVideoSection(file, {
        start,
        duration: clipLength,
        targetBytes: budget,
        onProgress: setProgress,
      });
      const ok = await onSection?.(blob);
      if (ok === false) {
        setBusy(false);
        isBusyRef.current = false;
        return;
      }
      // WhatsApp-style: the next section is pre-loaded so long videos are
      // posted part by part.
      const remaining = duration - end;
      if (remaining > 0.5) {
        setSectionIndex(i => i + 1);
        setStart(end);
        setEnd(Math.min(duration, end + cap));
        setProgress(0);
        setBusy(false);
        isBusyRef.current = false;
      } else {
        onClose?.();
      }
    } catch (err) {
      showToast?.(err?.message || "Trimming failed", "error");
      setBusy(false);
      isBusyRef.current = false;
    }
  };

  if (!file) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,15,26,0.55)", padding: 16 }} onClick={() => { if (!busy) onClose?.(); }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Scissors size={18} color={NAVY} />
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 17, color: NAVY, margin: 0 }}>Trim this video to fit</h3>
          </div>
          <button onClick={() => { if (!busy) onClose?.(); }} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#6B7280" }}>
          The clip is too big for one upload. Choose the section to post now — the next section is pre-queued afterwards
          {totalSections > 1 ? ` (video splits into about ${totalSections} sections)` : ""}.
        </p>

        <video
          ref={previewRef}
          src={previewUrl}
          controls
          onLoadedMetadata={handleMetadata}
          style={{ width: "100%", borderRadius: 12, background: "#000", maxHeight: 340, marginBottom: 14, display: "block" }}
        />

        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>
            Section start — {fmtTime(start)}
            <input type="range" min={0} max={Math.max(0.5, duration - 0.5)} step={0.1} value={start} disabled={busy || !duration} onChange={e => moveStart(e.target.value)} style={{ width: "100%", accentColor: AMBER }} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>
            Section end — {fmtTime(end)}
            <input type="range" min={0.5} max={duration || 1} step={0.1} value={end} disabled={busy || !duration} onChange={e => moveEnd(e.target.value)} style={{ width: "100%", accentColor: AMBER }} />
          </label>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14, fontSize: 12, color: "#6B7280", alignItems: "center" }}>
          <span style={{ background: "#F3F4F6", borderRadius: 999, padding: "4px 10px" }}>{fmtTime(clipLength)} selected</span>
          {fmtBytes(Math.round((clipLength / (cap || 1)) * budget)) && (
            <span style={{ background: "#F3F4F6", borderRadius: 999, padding: "4px 10px" }}>~{fmtBytes(Math.round((clipLength / (cap || 1)) * budget))} after trim</span>
          )}
          {totalSections > 1 && <span style={{ background: "#F3F4F6", borderRadius: 999, padding: "4px 10px" }}>section {Math.min(sectionIndex + 1, totalSections)} / {totalSections}</span>}
        </div>

        {busy && (
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 6, borderRadius: 3, background: "#F3F4F6", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: AMBER, transition: "width 0.2s" }} />
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6B7280" }}>Recording the section… keep this tab in the foreground ({Math.round(progress * 100)}%)</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={() => { if (!busy) onClose?.(); }} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #E5E7EB", background: "#fff", color: NAVY, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={keepSection} disabled={busy || clipLength < 0.5} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: NAVY, color: "#fff", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            {busy ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} /> Sending section…</> : <><Scissors size={15} /> Send this section</>}
          </button>
        </div>
      </div>
    </div>
  );
}
