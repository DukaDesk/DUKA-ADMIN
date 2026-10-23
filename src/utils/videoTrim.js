// WhatsApp-style video sectioning — a file that is too big to upload is cut
// into sections that fit. Extraction re-encodes the chosen section in the
// browser (canvas frames + MediaRecorder) so no extra dependency is needed.
// Chrome/Edge support the captureStream pipeline used here.

/** Byte budget handed to the re-encode so the upload never trips the server's
 * 50MB cap. Slightly under to leave room for the audio track overhead. */
export const VIDEO_UPLOAD_BUDGET_BYTES = 44 * 1024 * 1024;

/** How long a section of `file` can run (at its source bitrate) and stay
 * within the upload budget. 0 when the duration is unknown. */
export function maxSectionSeconds(file, durationSeconds) {
  const duration = Number(durationSeconds);
  if (!file?.size || !Number.isFinite(duration) || duration <= 0) return 0;
  const bytesPerSecond = file.size / duration;
  if (bytesPerSecond <= 0) return 0;
  return Math.max(1, Math.floor(VIDEO_UPLOAD_BUDGET_BYTES / bytesPerSecond));
}

/** Cut `duration` seconds of `file` starting at `start`, re-encoded to roughly
 * `targetBytes` (defaults to the upload budget minus margin). */
export function extractVideoSection(file, { start = 0, duration, targetBytes = VIDEO_UPLOAD_BUDGET_BYTES, onProgress, fps = 30 }) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
      reject(new Error("Trimming needs a Chromium browser (Chrome or Edge)"));
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0.2) {
      reject(new Error("Pick a longer section first"));
      return;
    }

    const sourceUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = sourceUrl;
    video.preload = "auto";
    let recorder = null;
    let settled = false;
    let stopRequested = false;

    const cleanup = () => {
      try { video.pause(); } catch { /* already detached */ }
      URL.revokeObjectURL(sourceUrl);
    };

    const finish = () => {
      if (stopRequested || settled) return;
      stopRequested = true;
      try { recorder?.stop(); } catch { /* recorder never started */ }
    };

    const bail = (message) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(message));
    };
    const succeed = (blob) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(blob);
    };

    video.onloadedmetadata = () => {
      try {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        const scale = Math.min(1, 1280 / width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const context = canvas.getContext("2d");

        const capture = video.captureStream || video.mozCaptureStream;
        if (typeof capture !== "function") {
          bail("Your browser cannot trim videos — use Chrome or Edge");
          return;
        }
        const sourceStream = capture.call(video);
        const canvasStream = canvas.captureStream(fps);
        const mixStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...sourceStream.getAudioTracks(),
        ]);

        const mimeType = [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
          "video/mp4",
        ].find(type => MediaRecorder.isTypeSupported(type));
        if (!mimeType) {
          bail("Your browser cannot trim videos — use Chrome or Edge");
          return;
        }
        // Bitrate chosen so `duration` seconds land near targetBytes.
        const bitsPerSecond = Math.floor(
          Math.max(500_000, Math.min(8_000_000, (targetBytes * 0.9 * 8) / duration)),
        );
        recorder = new MediaRecorder(mixStream, { mimeType, videoBitsPerSecond: bitsPerSecond });
        const chunks = [];
        recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
          if (blob.size > 49 * 1024 * 1024) {
            bail("The section is still too large — pick a shorter one");
          } else {
            succeed(blob);
          }
        };
        recorder.onerror = () => bail("Trimming failed — try a shorter section");

        const drawFrame = () => {
          if (stopRequested || settled) return;
          if (video.ended || video.currentTime >= start + duration) {
            finish();
            return;
          }
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          onProgress?.(Math.min(1, (video.currentTime - start) / duration));
          if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(() => drawFrame());
          else setTimeout(drawFrame, 1000 / fps);
        };

        const beginAfterSeek = () => {
          recorder.start(250);
          video.play().catch(() => { /* muted autoplay policies */ });
          if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(() => drawFrame());
          else setTimeout(drawFrame, 1000 / fps);
          setTimeout(finish, (duration + 3) * 1000);
        };
        video.currentTime = start;
        const seekGuard = setTimeout(() => onseeked(), 4000);
        const onseeked = () => {
          clearTimeout(seekGuard);
          video.removeEventListener("seeked", onseeked);
          beginAfterSeek();
        };
        video.addEventListener("seeked", onseeked);
      } catch {
        bail("Trimming failed — try a shorter section");
      }
    };
    video.onerror = () => bail("Could not read this video");
  });
}
