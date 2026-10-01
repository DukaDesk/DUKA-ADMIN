import { useEffect, useState } from "react";

function themeTokens(theme) {
  const t = theme || {};
  return {
    primary: t.primaryColor || t.primary || "var(--amber)",
    background: t.backgroundColor || t.background || "#FFFFFF",
    text: t.textColor || t.text || "#1A1A2E",
    font: t.fontFamily || t.font || "Inter, sans-serif",
    radius: t.borderRadius || "8px",
  };
}

function PreviewComponent({ comp, tokens }) {
  const p = comp?.props || comp?.config || {};
  const title = p.title || p.heading || p.name || p.businessName;
  const text = p.text || p.subtitle || p.description || p.label || p.caption;
  const image = p.image || p.imageUrl || p.src || p.banner || p.cover || p.backgroundImage || p.backgroundImageUrl || p.thumbnail || p.photo;
  const price = p.price ?? p.amount;
  const type = String(comp?.type || "").toLowerCase();
  const actionLabel = p.cta?.label || p.buttonLabel || (typeof p.action === "string" ? p.action : null);
  const items = [p.items, p.products, p.categories, p.results, p.data].find(Array.isArray) || [];
  const showButton = ["button", "hero", "herobanner"].includes(type) || Boolean(actionLabel || p.action);
  const imageStyle = { width: "100%", height: 112, objectFit: "cover", borderRadius: tokens.radius, display: "block", background: "#F3F4F6" };

  return (
    <div style={{ overflow: "hidden", background: "#fff", border: "1px solid #F3F4F6", borderRadius: tokens.radius, marginBottom: 8 }}>
      {image && <img src={image} alt={p.alt || title || comp.type} style={imageStyle} loading="lazy" />}
      {(title || text || price != null || showButton) && (
        <div style={{ padding: 10 }}>
          {title && <div style={{ fontSize: type.includes("hero") ? 15 : 12, fontWeight: 700, color: tokens.text, marginBottom: text ? 3 : 0 }}>{String(title)}</div>}
          {text && <div style={{ fontSize: 11, lineHeight: 1.45, color: "#6B7280" }}>{String(text)}</div>}
          {price != null && <div style={{ fontSize: 12, fontWeight: 700, color: tokens.primary, marginTop: 4 }}>{typeof price === "number" ? new Intl.NumberFormat("en-NG", { style: "currency", currency: p.currency || "NGN", maximumFractionDigits: 0 }).format(price) : String(price)}</div>}
          {showButton && <div style={{ marginTop: 8, background: tokens.primary, color: "#fff", borderRadius: tokens.radius, padding: "8px 10px", textAlign: "center", fontSize: 11, fontWeight: 700 }}>{String(actionLabel || p.cta?.title || "Open")}</div>}
        </div>
      )}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: items.length > 1 ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: 7, padding: 8, paddingTop: title || text || price != null ? 0 : 8 }}>
          {items.slice(0, 6).map((item, index) => {
            const entry = typeof item === "string" ? { name: item } : item || {};
            const itemImage = entry.image || entry.imageUrl || entry.thumbnail || entry.photo || entry.src;
            const itemName = entry.name || entry.title || entry.label || `Item ${index + 1}`;
            return (
              <div key={entry.id || entry.slug || index} style={{ minWidth: 0, border: "1px solid #F3F4F6", borderRadius: tokens.radius, overflow: "hidden" }}>
                {itemImage && <img src={itemImage} alt={itemName} style={{ ...imageStyle, height: 70, borderRadius: 0 }} loading="lazy" />}
                <div style={{ padding: 7 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: tokens.text }}>{String(itemName)}</div>
                  {entry.description && <div style={{ fontSize: 9, color: "#6B7280", marginTop: 2 }}>{String(entry.description)}</div>}
                  {entry.price != null && <div style={{ fontSize: 10, fontWeight: 700, color: tokens.primary, marginTop: 3 }}>{typeof entry.price === "number" ? new Intl.NumberFormat("en-NG", { style: "currency", currency: entry.currency || p.currency || "NGN", maximumFractionDigits: 0 }).format(entry.price) : String(entry.price)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!image && !title && !text && price == null && items.length === 0 && (
        <div style={{ padding: 10, fontSize: 10, color: "#9CA3AF" }}>{String(comp.type || "Content block").replace(/([a-z])([A-Z])/g, "$1 $2")}</div>
      )}
    </div>
  );
}

function PreviewSection({ section, tokens }) {
  const components = section.components || section.children || section.items || [];
  return (
    <div style={{ marginBottom: 10 }}>
      {section.config?.title && <div style={{ fontSize: 11, fontWeight: 700, color: tokens.text, marginBottom: 6 }}>{String(section.config.title)}</div>}
      {components.map((c, i) => (
        <PreviewComponent key={c.id || i} comp={c} tokens={tokens} />
      ))}
    </div>
  );
}

export default function PhonePreview({ preview }) {
  const pages = preview?.pages || preview?.screens || preview?.draftPages || preview?.app?.pages || [];
  const homeIdx = Math.max(0, pages.findIndex((p) => p.isHome));
  const [screenIdx, setScreenIdx] = useState(homeIdx);
  useEffect(() => setScreenIdx(homeIdx), [preview, homeIdx]);
  const tokens = themeTokens(preview?.theme || preview?.app?.theme);
  const navigation = preview?.navigation || preview?.app?.navigation;
  const navItems = Array.isArray(navigation) ? navigation : navigation?.items || [];
  const page = pages.length ? pages[Math.min(screenIdx, pages.length - 1)] : null;
  const sections = page?.sections || page?.content?.sections || page?.blocks || [];
  const appName = preview?.tenant?.name || preview?.app?.name || preview?.name || "App preview";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {pages.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }} role="tablist" aria-label="App screens">
          {pages.map((p, i) => (
            <button
              key={p.slug || p.name || i}
              role="tab"
              aria-selected={i === screenIdx}
              onClick={() => setScreenIdx(i)}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 9999,
                border: i === screenIdx ? "1px solid var(--amber)" : "1px solid var(--gray-200)",
                background: i === screenIdx ? "var(--amber-alpha-10)" : "#fff",
                color: i === screenIdx ? "var(--amber)" : "var(--gray-500)",
                cursor: "pointer",
              }}
            >
              {p.name || p.slug || `Screen ${i + 1}`}
            </button>
          ))}
        </div>
      )}
      <div
        role="img"
        aria-label={`Phone preview of ${appName}${page ? ` — ${page.name || page.title || "Screen"}` : ""}`}
        style={{
          width: 300,
          height: 620,
          background: "#111827",
          borderRadius: 40,
          padding: 10,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: tokens.background,
            borderRadius: 30,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            fontFamily: tokens.font,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
            <div style={{ width: 90, height: 18, background: "#111827", borderRadius: 9999 }} />
          </div>
          <div style={{ padding: "6px 12px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: tokens.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {appName}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
            {!page && <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 40 }}>No screens designed yet.</div>}
            {sections.map((s, i) => (
              <PreviewSection key={s.id || i} section={s} tokens={tokens} />
            ))}
          </div>
          {navItems.length > 0 && (
            <div style={{ display: "flex", borderTop: "1px solid #F3F4F6", background: "#fff" }}>
              {navItems.slice(0, 5).map((item, i) => {
                const label = typeof item === "string" ? item : item.label || item.title || item.name || `Tab ${i + 1}`;
                return (
                  <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: i === 0 ? tokens.primary : "#9CA3AF", padding: "8px 0", fontWeight: i === 0 ? 700 : 400 }}>
                    {String(label).slice(0, 10)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
        {pages.length} screen{pages.length === 1 ? "" : "s"} · draft preview, not yet live
      </div>
    </div>
  );
}
