import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_THEME = {
  primary: "#F4A026",
  secondary: "#1A1A2E",
  background: "#FCF8FA",
  surface: "#FFFFFF",
  text: "#0F0F1A",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  fontFamily: "Inter, sans-serif",
  radius: 12,
};

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function previewTheme(theme = {}) {
  // Admin receives two shapes: the raw submitted manifest theme
  // ({ colors, typography, roundness }) and the compiled draft token bundle
  // ({ light: {...}, typography, ... }). Support both.
  const colors = theme.colors || theme.light || {};
  const typography = theme.typography || {};
  const body = typography.bodyMd || typography.body || typography.labelMd || {};
  return {
    primary: colors.primary || colors.primaryColor || theme.primaryColor || DEFAULT_THEME.primary,
    secondary: colors.secondary || colors.secondaryColor || theme.secondaryColor || DEFAULT_THEME.secondary,
    background: colors.background || colors.backgroundColor || colors.surface || theme.backgroundColor || DEFAULT_THEME.background,
    surface: colors.card || colors.surface || DEFAULT_THEME.surface,
    text: colors.textPrimary || colors.textColor || theme.textColor || DEFAULT_THEME.text,
    textSecondary: colors.textSecondary || DEFAULT_THEME.textSecondary,
    border: colors.border || DEFAULT_THEME.border,
    fontFamily: body.fontFamily || theme.fontFamily || colors.fontFamily || DEFAULT_THEME.fontFamily,
    radius: number(theme.roundness ?? theme.borderRadius ?? colors.borderRadius, DEFAULT_THEME.radius),
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(" ");
  if (typeof value === "object") return toText(value.text ?? value.value ?? value.label ?? value.children ?? "");
  return "";
}

function isImageSource(value) {
  return typeof value === "string" && /^(https?:\/\/|data:image\/|\/)/i.test(value);
}

function resolveImage(source) {
  if (!source) return "";
  if (typeof source === "string") return isImageSource(source) ? source : "";
  if (typeof source === "object") {
    if (source.type === "image") return resolveImage(source.value);
    return resolveImage(source.url || source.src || source.value || source.image || "");
  }
  return "";
}

function resolveGlyph(source) {
  if (typeof source === "string" && source && !isImageSource(source)) return source;
  return "";
}

function formatMoney(value, currency = "NGN") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return toText(value);
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `NGN ${amount.toLocaleString()}`;
  }
}

function spacing(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "number") return value;
  if (typeof value === "object") {
    const vertical = value.vertical ?? value.top ?? value.bottom ?? 0;
    const horizontal = value.horizontal ?? value.left ?? value.right ?? 0;
    return `${vertical}px ${horizontal}px`;
  }
  return value;
}

function priceOf(item) {
  return item?.price ?? item?.amount ?? item?.total ?? null;
}

function itemName(item, index) {
  return toText(item?.name || item?.title || item?.label) || `Item ${index + 1}`;
}

function itemDescription(item) {
  return toText(item?.desc || item?.description || item?.subtitle || item?.text);
}

function itemImage(item) {
  return resolveImage(item?.image || item?.img || item?.imageUrl || item?.thumbnail || item?.photo || item?.src);
}

function itemGlyph(item) {
  return resolveGlyph(item?.emoji || item?.icon || item?.img);
}

function cardStyle(tokens, style) {
  return {
    background: tokens.surface,
    border: `1px solid ${tokens.border}`,
    borderRadius: tokens.radius,
    ...style,
  };
}

function PreviewTabs({ items, tokens, onNavigate, activeScreenId, border }) {
  return (
    <div style={{ display: "flex", background: tokens.surface, ...border }}>
      {items.map((item, index) => {
        const label = toText(item?.label || item?.title || item?.name || item) || `Tab ${index + 1}`;
        const target = typeof item === "object" ? item?.screenId || item?.screen || item?.slug : null;
        const active = target ? target === activeScreenId : index === 0;
        return (
          <button
            key={`${label}-${index}`}
            type="button"
            onClick={() => target && onNavigate?.(target)}
            style={{
              flex: 1,
              padding: "8px 4px",
              border: "none",
              borderTop: active ? `2px solid ${tokens.primary}` : "2px solid transparent",
              background: "transparent",
              color: active ? tokens.primary : tokens.textSecondary,
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              cursor: target ? "pointer" : "default",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function PreviewNode({ comp, tokens, onNavigate, activeScreenId }) {
  const props = comp?.props || comp?.config || {};
  const type = String(comp?.type || "").toLowerCase();
  const style = props.style && typeof props.style === "object" ? props.style : {};
  const children = asArray(comp?.children).length ? comp.children : asArray(comp?.layout?.children);

  if (children.length || ["row", "nested_section", "carousel", "card", "container"].includes(type)) {
    const isRow = type === "row";
    const columns = Math.max(1, number(props.columns, isRow ? 2 : 1));
    return (
      <div
        style={{
          display: isRow ? "grid" : "flex",
          gridTemplateColumns: isRow ? `repeat(${columns}, minmax(0, 1fr))` : undefined,
          flexDirection: isRow ? undefined : "column",
          gap: number(props.gap, 8),
          background: props.backgroundColor || (type === "card" ? tokens.surface : "transparent"),
          border: type === "card" ? `1px solid ${tokens.border}` : undefined,
          borderRadius: tokens.radius,
          padding: spacing(props.padding, type === "nested_section" || type === "card" ? 10 : 0),
          ...style,
        }}
      >
        {children.map((child, index) => (
          <PreviewNode key={`${child?.id || child?.key || "node"}-${index}`} comp={child} tokens={tokens} onNavigate={onNavigate} activeScreenId={activeScreenId} />
        ))}
      </div>
    );
  }

  switch (type) {
    case "hero_banner": {
      const image = resolveImage(props.fill) || resolveImage(props.image) || resolveImage(props.backgroundImage) || resolveImage(props.banner);
      const variant = props.variant || "center";
      const split = variant === "split" && image;
      const overlay = variant === "overlay" && image;
      const align = variant === "left" || variant === "overlay" ? "flex-start" : "center";
      return (
        <div
          style={{
            background: image
              ? `url(${image}) center/${props.fit === "contain" ? "contain" : "cover"} no-repeat`
              : `linear-gradient(135deg, ${props.color || tokens.secondary}, ${tokens.primary})`,
            backgroundSize: "cover",
            color: "#fff",
            borderRadius: number(props.radius, tokens.radius),
            minHeight: number(props.height, 170),
            padding: split ? 0 : 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: align,
            textAlign: align === "flex-start" ? "left" : "center",
            position: "relative",
            overflow: "hidden",
            ...style,
          }}
        >
          {split && <img src={image} alt="" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "42%", height: "100%", objectFit: "cover" }} />}
          {overlay && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(10,10,20,0.1) 0%,rgba(10,10,20,0.7) 100%)" }} />}
          <div style={{ position: "relative", zIndex: 1, maxWidth: split ? "58%" : "100%" }}>
            {props.badge && <span style={{ display: "inline-block", marginBottom: 8, padding: "3px 10px", borderRadius: 20, background: tokens.primary, color: tokens.secondary, fontSize: 10, fontWeight: 700 }}>{toText(props.badge)}</span>}
            {toText(props.title) && <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{toText(props.title)}</div>}
            {toText(props.subtitle) && <div style={{ marginTop: 4, fontSize: 12, opacity: 0.9 }}>{toText(props.subtitle)}</div>}
          </div>
        </div>
      );
    }

    case "category_pills": {
      const categories = asArray(props.categories || props.items).map((category, index) => toText(category?.name || category?.label || category) || `Category ${index + 1}`);
      return (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, ...style }}>
          {categories.map((category, index) => (
            <span
              key={`${category}-${index}`}
              style={{
                flexShrink: 0,
                padding: "7px 13px",
                borderRadius: 20,
                background: index === 0 ? tokens.primary : tokens.surface,
                color: index === 0 ? tokens.secondary : tokens.text,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {category}
            </span>
          ))}
        </div>
      );
    }

    case "menu_grid": {
      const items = asArray(props.items);
      const columns = Math.max(1, number(props.columns, 2));
      if (!items.length) {
        return <div style={{ ...cardStyle(tokens), padding: "24px 16px", textAlign: "center", color: tokens.textSecondary, fontSize: 11 }}>No products yet — add products to see them here.</div>;
      }
      return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 10, ...style }}>
          {items.map((item, index) => {
            const image = itemImage(item);
            const glyph = itemGlyph(item);
            const price = priceOf(item);
            return (
              <div key={item?.id || index} style={{ ...cardStyle(tokens), padding: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                {image ? (
                  <img src={image} alt={itemName(item, index)} style={{ width: "100%", height: 76, objectFit: "cover", borderRadius: Math.max(6, tokens.radius - 4), display: "block" }} loading="lazy" />
                ) : glyph ? (
                  <div style={{ height: 76, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{glyph}</div>
                ) : null}
                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.text }}>{itemName(item, index)}</div>
                {itemDescription(item) && <div style={{ fontSize: 9, color: tokens.textSecondary }}>{itemDescription(item)}</div>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: tokens.primary }}>{price != null ? formatMoney(price) : ""}</span>
                  <span style={{ padding: "4px 8px", borderRadius: 6, background: tokens.primary, color: tokens.secondary, fontSize: 9, fontWeight: 700 }}>Add</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case "menu_item": {
      const item = props;
      const image = itemImage(item);
      const glyph = itemGlyph(item);
      return (
        <div style={{ ...cardStyle(tokens), padding: 10, display: "flex", alignItems: "center", gap: 10 }}>
          {image ? <img src={image} alt={itemName(item, 0)} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} /> : <div style={{ width: 44, height: 44, borderRadius: 8, background: tokens.background, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{glyph || "•"}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: tokens.text }}>{itemName(item, 0)}</div>
            {itemDescription(item) && <div style={{ fontSize: 10, color: tokens.textSecondary }}>{itemDescription(item)}</div>}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: tokens.text, whiteSpace: "nowrap" }}>{priceOf(item) != null ? formatMoney(priceOf(item)) : ""}</span>
        </div>
      );
    }

    case "promotion_list": {
      const offers = asArray(props.offers || props.items);
      return (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2, ...style }}>
          {offers.map((offer, index) => {
            const image = resolveImage(offer?.image || offer?.img);
            const glyph = resolveGlyph(offer?.emoji || offer?.icon);
            return (
              <div key={offer?.id || index} style={{ ...cardStyle(tokens), flex: "0 0 220px", overflow: "hidden" }}>
                <div style={{ height: 84, background: image ? `url(${image}) center/cover` : `linear-gradient(135deg, ${tokens.primary}, ${tokens.secondary})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700 }}>
                  {image ? "" : glyph || ""}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: tokens.text }}>{toText(offer?.title || offer?.name)}</div>
                  {toText(offer?.subtitle || offer?.description) && <div style={{ marginTop: 2, fontSize: 10, color: tokens.textSecondary }}>{toText(offer?.subtitle || offer?.description)}</div>}
                  {(offer?.badge || offer?.tag) && <span style={{ display: "inline-block", marginTop: 6, padding: "3px 8px", borderRadius: 20, background: `${tokens.primary}22`, color: tokens.primary, fontSize: 9, fontWeight: 700 }}>{toText(offer.badge || offer.tag)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case "section_header":
      return <div style={{ fontSize: 14, fontWeight: 700, color: tokens.text, ...style }}>{toText(props.children || props.title || props.text)}</div>;

    case "primary_button":
    case "button":
      return (
        <div style={{ textAlign: "center", ...style }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: props.width || "100%",
              minHeight: number(props.height, 42),
              padding: "10px 16px",
              boxSizing: "border-box",
              borderRadius: props.shape === "round" ? 999 : number(props.radius, tokens.radius),
              border: props.variant === "outline" ? `1.5px solid ${props.background || tokens.primary}` : "none",
              background: props.variant === "outline" ? "transparent" : props.background || tokens.primary,
              color: props.color || (props.variant === "outline" ? tokens.text : tokens.secondary),
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {toText(props.label || props.children || props.title) || "Action"}
          </div>
        </div>
      );

    case "order_history": {
      const orders = asArray(props.orders || props.items);
      if (!orders.length) return <div style={{ ...cardStyle(tokens), padding: "24px 16px", textAlign: "center", color: tokens.textSecondary, fontSize: 11 }}>No orders yet — orders you place will appear here.</div>;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
          {orders.map((order, index) => (
            <div key={order?.id || index} style={{ ...cardStyle(tokens), padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                <strong style={{ fontSize: 11, color: tokens.text }}>{toText(order?.id) || `Order #${index + 1}`}</strong>
                {order?.status && <span style={{ padding: "2px 7px", borderRadius: 20, background: tokens.background, color: tokens.textSecondary, fontSize: 9, fontWeight: 700 }}>{toText(order.status)}</span>}
              </div>
              <div style={{ fontSize: 10, color: tokens.textSecondary }}>{toText(order?.items || order?.sub) || "Items"}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                <span style={{ color: tokens.textSecondary }}>{toText(order?.date || order?.time)}</span>
                <span style={{ fontWeight: 700, color: tokens.text }}>{priceOf(order) != null ? formatMoney(priceOf(order)) : ""}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "info_list": {
      const items = asArray(props.items);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
          {items.map((item, index) => (
            <div key={item?.id || index} style={{ ...cardStyle(tokens), padding: "9px 11px", display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: tokens.background, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{resolveGlyph(item?.icon || item?.emoji) || "•"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: tokens.text }}>{toText(item?.label || item?.title || item?.name)}</div>
                {toText(item?.value || item?.description || item?.subtitle) && <div style={{ fontSize: 10, color: tokens.textSecondary }}>{toText(item?.value || item?.description || item?.subtitle)}</div>}
              </div>
              <span style={{ color: tokens.textSecondary, fontSize: 13 }}>›</span>
            </div>
          ))}
        </div>
      );
    }

    case "cart_summary": {
      const items = asArray(props.items);
      if (!items.length) {
        return (
          <div style={{ ...cardStyle(tokens), padding: "30px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text, marginBottom: 4 }}>Your cart is empty</div>
            <div style={{ fontSize: 10, color: tokens.textSecondary }}>Items you add will show up here, ready for checkout.</div>
          </div>
        );
      }
      const subtotal = items.reduce((sum, item) => sum + number(priceOf(item), 0) * number(item?.qty, 1), 0);
      const delivery = number(props.deliveryFee, 0);
      const total = subtotal + delivery;
      return (
        <div style={{ ...cardStyle(tokens), overflow: "hidden", ...style }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${tokens.border}`, fontSize: 12, fontWeight: 700, color: tokens.text }}>Your Cart</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 8 }}>
            {items.map((item, index) => {
              const image = itemImage(item);
              const glyph = itemGlyph(item);
              const quantity = number(item?.qty, 1);
              return (
                <div key={item?.id || item?.lineId || index} style={{ display: "flex", alignItems: "center", gap: 8, padding: 7, background: tokens.background, borderRadius: Math.max(6, tokens.radius - 3) }}>
                  {image ? <img src={image} alt={itemName(item, index)} style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} /> : <div style={{ width: 38, height: 38, borderRadius: 8, background: tokens.surface, border: `1px solid ${tokens.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{glyph || "•"}</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: tokens.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{itemName(item, index)}</div>
                    <div style={{ fontSize: 10, color: tokens.textSecondary }}>{formatMoney(priceOf(item) || 0)} each</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: tokens.text }}>{formatMoney(number(priceOf(item), 0) * quantity)}</div>
                    <div style={{ fontSize: 9, color: tokens.textSecondary }}>x{quantity}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ margin: "4px 10px 0", padding: "9px 11px", background: tokens.background, borderRadius: Math.max(6, tokens.radius - 3), fontSize: 10, color: tokens.textSecondary }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
            {props.deliveryFee != null && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}><span>Delivery</span><span>{delivery === 0 ? "Free" : formatMoney(delivery)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${tokens.border}`, fontSize: 12, fontWeight: 700, color: tokens.text }}><span>Total</span><span>{formatMoney(total)}</span></div>
          </div>
          <div style={{ padding: 10 }}>
            <div style={{ padding: "11px 12px", borderRadius: Math.max(6, tokens.radius - 2), background: tokens.primary, color: tokens.secondary, textAlign: "center", fontSize: 12, fontWeight: 700 }}>Secure Checkout · {formatMoney(total)}</div>
          </div>
        </div>
      );
    }

    case "booking_summary":
      return (
        <div style={{ ...cardStyle(tokens), padding: 12, ...style }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: tokens.text, marginBottom: 8 }}>Booking Summary</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: tokens.textSecondary, marginBottom: 4 }}><span>Service</span><span style={{ color: tokens.text, fontWeight: 600 }}>{toText(props.service) || "Hair Styling"}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: tokens.textSecondary, marginBottom: 4 }}><span>Duration</span><span style={{ color: tokens.text, fontWeight: 600 }}>{number(props.duration, 60)} min</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${tokens.border}`, fontSize: 12, fontWeight: 700, color: tokens.text }}><span>Total</span><span>{formatMoney(number(props.total, 8000))}</span></div>
        </div>
      );

    case "laundry_booking":
      return (
        <div style={{ ...cardStyle(tokens), padding: 12, ...style }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text, marginBottom: 4 }}>Schedule home pickup</div>
          <div style={{ fontSize: 10, color: tokens.textSecondary, marginBottom: 8 }}>Choose a service and when we should collect your laundry.</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: tokens.background, borderRadius: 8, fontSize: 11 }}>
            <span style={{ color: tokens.text, fontWeight: 600 }}>{toText(props.service) || "Wash & Fold"}</span>
            <span style={{ color: tokens.text, fontWeight: 700 }}>{formatMoney(number(props.price, 2500))} / {toText(props.unitLabel) || "kg"}</span>
          </div>
          <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 8, background: tokens.primary, color: tokens.secondary, textAlign: "center", fontSize: 11, fontWeight: 700 }}>Schedule Pickup</div>
        </div>
      );

    case "calendar_strip":
      return (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", ...style }}>
          {Array.from({ length: 7 }).map((_, index) => {
            const date = new Date();
            date.setDate(date.getDate() + index);
            return (
              <div key={index} style={{ flex: "0 0 44px", padding: "7px 0", borderRadius: 10, background: index === 0 ? tokens.primary : tokens.surface, border: `1px solid ${index === 0 ? tokens.primary : tokens.border}`, color: index === 0 ? tokens.secondary : tokens.text, textAlign: "center" }}>
                <div style={{ fontSize: 8, textTransform: "uppercase" }}>{date.toLocaleDateString(undefined, { weekday: "short" })}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{date.getDate()}</div>
                <div style={{ fontSize: 8 }}>{date.toLocaleDateString(undefined, { month: "short" })}</div>
              </div>
            );
          })}
        </div>
      );

    case "slot_grid":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, ...style }}>
          {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map((slot) => (
            <div key={slot} style={{ padding: "8px 4px", borderRadius: 8, border: `1px solid ${tokens.border}`, background: tokens.surface, color: tokens.text, textAlign: "center", fontSize: 10, fontWeight: 600 }}>{slot}</div>
          ))}
        </div>
      );

    case "address_form":
      return (
        <div style={{ ...cardStyle(tokens), padding: 12, ...style }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: tokens.text, marginBottom: 8 }}>Delivery Address</div>
          {["Street Address", "City", "State", "Phone Number"].map((label) => (
            <div key={label} style={{ padding: "8px 10px", marginBottom: 6, borderRadius: 8, border: `1px solid ${tokens.border}`, fontSize: 10, color: tokens.textSecondary }}>{label}</div>
          ))}
          <div style={{ padding: "10px 12px", marginTop: 2, borderRadius: 8, background: tokens.primary, color: tokens.secondary, textAlign: "center", fontSize: 11, fontWeight: 700 }}>Save Address</div>
        </div>
      );

    case "notification_list": {
      const notifications = asArray(props.notifications || props.items);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
          {notifications.map((notification, index) => (
            <div key={notification?.id || index} style={{ ...cardStyle(tokens), padding: 9, display: "flex", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: `${tokens.primary}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{resolveGlyph(notification?.icon || notification?.emoji) || "•"}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: tokens.text }}>{toText(notification?.title || notification?.name)}</div>
                <div style={{ fontSize: 10, color: tokens.textSecondary }}>{toText(notification?.message || notification?.description || notification?.text)}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "report_action":
      return (
        <div style={{ ...cardStyle(tokens), padding: 12, ...style }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: tokens.text, marginBottom: 8 }}>{toText(props.title) || "Report an Issue"}</div>
          <div style={{ minHeight: 56, padding: 8, borderRadius: 8, border: `1px solid ${tokens.border}`, fontSize: 10, color: tokens.textSecondary }}>Describe the issue…</div>
          <div style={{ marginTop: 8, padding: "10px", borderRadius: 8, background: tokens.primary, color: tokens.secondary, textAlign: "center", fontSize: 11, fontWeight: 700 }}>Submit Report</div>
        </div>
      );

    case "tabs":
    case "tab_bar": {
      const items = asArray(props.items || props.tabs);
      const border = type === "tabs" && props.position === "bottom" ? { borderTop: `1px solid ${tokens.border}` } : { borderBottom: `1px solid ${tokens.border}` };
      return <PreviewTabs items={items} tokens={tokens} onNavigate={onNavigate} activeScreenId={activeScreenId} border={border} />;
    }

    case "header_bar":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: tokens.surface, ...style }}>
          {(props.logo || props.image) && <img src={resolveImage(props.logo) || resolveImage(props.image)} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover" }} />}
          <span style={{ fontSize: 12, fontWeight: 800, color: tokens.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toText(props.appName || props.title) || "Store"}</span>
        </div>
      );

    case "dynamic_card": {
      const image = resolveImage(props.image);
      return (
        <div style={{ ...cardStyle(tokens), padding: 9, display: "flex", alignItems: "center", gap: 9, ...style }}>
          {image && <img src={image} alt={toText(props.title)} style={{ width: 40, height: 40, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            {props.badge && <span style={{ display: "inline-block", marginBottom: 2, padding: "1px 5px", borderRadius: 5, background: `${tokens.primary}22`, color: tokens.primary, fontSize: 8, fontWeight: 700 }}>{toText(props.badge)}</span>}
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.text }}>{toText(props.title)}</div>
            <div style={{ fontSize: 9, color: tokens.textSecondary }}>{toText(props.subtitle)}</div>
          </div>
        </div>
      );
    }

    case "empty_state":
      return (
        <div style={{ padding: "24px 12px", textAlign: "center", color: tokens.textSecondary, ...style }}>
          {resolveGlyph(props.icon) && <div style={{ fontSize: 24, opacity: 0.5, marginBottom: 4 }}>{resolveGlyph(props.icon)}</div>}
          <div style={{ fontSize: 11, fontWeight: 600 }}>{toText(props.title)}</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>{toText(props.description)}</div>
        </div>
      );

    case "text_block":
      return (
        <div
          style={{
            fontSize: number(props.fontSize, 12),
            fontWeight: props.fontWeight || 400,
            fontStyle: props.fontStyle || "normal",
            color: props.color || tokens.text,
            textAlign: props.alignment || "left",
            lineHeight: props.lineHeight != null ? number(props.lineHeight, 1.4) : 1.4,
            ...style,
          }}
        >
          {toText(props.text || props.children)}
        </div>
      );

    case "heading":
    case "text":
      return (
        <div style={{ fontSize: type === "heading" ? 16 : 11, fontWeight: type === "heading" ? 700 : 400, color: props.color || tokens.text, lineHeight: 1.4, ...style }}>
          {toText(props.children || props.text || props.title)}
        </div>
      );

    case "image_block":
    case "image": {
      const image = resolveImage(props.src || props.source || props.image);
      if (!image) return <div style={{ padding: 14, borderRadius: 8, background: tokens.background, color: tokens.textSecondary, fontSize: 10, textAlign: "center", ...style }}>No image</div>;
      return <img src={image} alt={toText(props.alt)} style={{ width: "100%", height: "auto", borderRadius: tokens.radius, objectFit: props.fit || "cover", display: "block", ...style }} loading="lazy" />;
    }

    case "video":
      return <div style={{ ...cardStyle(tokens), height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: tokens.textSecondary, fontSize: 12, ...style }}>Video</div>;

    case "divider":
      return <div style={{ height: 1, background: tokens.border, margin: "4px 0", ...style }} />;

    case "gap":
      return <div style={{ height: number(props.height, 10) }} />;

    case "rectangle":
      return <div style={{ minHeight: number(props.height, 40), borderRadius: tokens.radius, background: props.background || props.fill || tokens.background, ...style }} />;

    case "icon":
    case "icon_button":
    case "fab":
      return <div style={{ width: 32, height: 32, borderRadius: "50%", background: type === "fab" ? tokens.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: tokens.text, ...style }}>{resolveGlyph(props.icon || props.name) || "•"}</div>;

    default: {
      const title = toText(props.title || props.heading || props.name || props.label || props.children);
      const text = toText(props.subtitle || props.text || props.description || props.desc);
      const image = resolveImage(props.image || props.img || props.src || props.source);
      const items = asArray(props.items);
      if (!title && !text && !image && !items.length) {
        return <div style={{ padding: 10, fontSize: 10, color: tokens.textSecondary }}>{type ? type.replace(/_/g, " ") : "Content block"}</div>;
      }
      return (
        <div style={{ ...cardStyle(tokens), padding: 10, ...style }}>
          {image && <img src={image} alt={title} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: Math.max(6, tokens.radius - 4), marginBottom: 6 }} loading="lazy" />}
          {title && <div style={{ fontSize: 12, fontWeight: 700, color: tokens.text }}>{title}</div>}
          {text && <div style={{ fontSize: 10, color: tokens.textSecondary, marginTop: 2 }}>{text}</div>}
          {items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
              {items.slice(0, 6).map((item, index) => (
                <div key={item?.id || index} style={{ fontSize: 10, color: tokens.textSecondary }}>{itemName(item, index)}{priceOf(item) != null ? ` · ${formatMoney(priceOf(item))}` : ""}</div>
              ))}
            </div>
          )}
        </div>
      );
    }
  }
}

function PreviewSection({ section, tokens, onNavigate, activeScreenId, bare }) {
  const config = section?.config || {};
  return (
    <div
      style={{
        background: config.backgroundColor || config.background || "transparent",
        padding: spacing(config.padding, bare ? 0 : 10),
        display: "flex",
        flexDirection: "column",
        gap: number(config.gap, bare ? 0 : 9),
      }}
    >
      {asArray(section?.components).map((component, index) => (
        <PreviewNode key={`${component?.id || component?.key || "node"}-${index}`} comp={component} tokens={tokens} onNavigate={onNavigate} activeScreenId={activeScreenId} />
      ))}
    </div>
  );
}

export default function PhonePreview({ preview }) {
  const pages = preview?.pages || preview?.screens || preview?.draftPages || preview?.app?.pages || [];
  const homeIdx = Math.max(0, pages.findIndex((page) => page.isHome));
  const [screenIdx, setScreenIdx] = useState(homeIdx);
  useEffect(() => setScreenIdx(homeIdx), [preview, homeIdx]);

  const tokens = previewTheme(preview?.theme || preview?.app?.theme);
  const navigation = preview?.navigation;
  const navItems = Array.isArray(navigation) ? navigation : navigation?.tabs || navigation?.items || [];
  const page = pages.length ? pages[Math.min(screenIdx, pages.length - 1)] : null;
  const sections = page?.sections || page?.content?.sections || page?.blocks || [];
  const pageLayout = page?.layout || {};
  const headerNodes = page?.header || [];
  const footerNodes = page?.footer || [];
  const activeScreenId = page?.slug || page?.id;
  const appName = preview?.app?.name || preview?.name || preview?.identity?.displayName || preview?.tenant?.name || "App preview";
  const sourceLabel = preview?.source === "review"
    ? `Submitted design${preview?.releaseVersion ? ` v${preview.releaseVersion}` : ""} · awaiting approval`
    : preview?.source === "published"
      ? `Live app${preview?.releaseVersion ? ` v${preview.releaseVersion}` : ""}`
      : "Draft preview · not yet live";

  const goTo = (screenId) => {
    if (!screenId) return;
    const index = pages.findIndex((candidate) => candidate.slug === screenId || candidate.name === screenId || candidate.id === screenId);
    if (index >= 0) setScreenIdx(index);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {pages.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, width: 300 }} aria-label="App screens">
          <button
            type="button"
            aria-label="Previous screen"
            onClick={() => setScreenIdx((current) => Math.max(0, current - 1))}
            disabled={screenIdx === 0}
            style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--gray-200)", background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: screenIdx === 0 ? "default" : "pointer", opacity: screenIdx === 0 ? 0.4 : 1 }}
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <label style={{ flex: 1, minWidth: 0 }}>
            <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Screen</span>
            <select
              value={screenIdx}
              onChange={(event) => setScreenIdx(Number(event.target.value))}
              style={{ width: "100%", height: 28, padding: "0 8px", borderRadius: 7, border: "1px solid var(--gray-200)", background: "#fff", color: "var(--navy)", fontSize: 12, fontWeight: 600 }}
            >
              {pages.map((candidate, index) => (
                <option key={`${candidate.slug || candidate.name || index}`} value={index}>
                  {candidate.name || candidate.slug || `Screen ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
          <span style={{ fontSize: 11, color: "var(--gray-500)", minWidth: 30, textAlign: "center" }}>{screenIdx + 1}/{pages.length}</span>
          <button
            type="button"
            aria-label="Next screen"
            onClick={() => setScreenIdx((current) => Math.min(pages.length - 1, current + 1))}
            disabled={screenIdx >= pages.length - 1}
            style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--gray-200)", background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: screenIdx >= pages.length - 1 ? "default" : "pointer", opacity: screenIdx >= pages.length - 1 ? 0.4 : 1 }}
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
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
            fontFamily: tokens.fontFamily,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
            <div style={{ width: 90, height: 18, background: "#111827", borderRadius: 9999 }} />
          </div>
          {headerNodes.length > 0 ? (
            <div style={{ flexShrink: 0 }}>
              {headerNodes.map((component, index) => (
                <PreviewNode key={`${component?.id || "node"}-${index}`} comp={component} tokens={tokens} onNavigate={goTo} activeScreenId={activeScreenId} />
              ))}
            </div>
          ) : (
            <div style={{ padding: "6px 12px", borderBottom: `1px solid ${tokens.border}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: tokens.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {appName}
              </span>
            </div>
          )}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              padding: spacing(pageLayout.padding, 0),
              gap: number(pageLayout.gap, 0),
              background: pageLayout.background || pageLayout.backgroundColor || "transparent",
            }}
          >
            {!page && <div style={{ fontSize: 11, color: tokens.textSecondary, textAlign: "center", marginTop: 40 }}>No screens designed yet.</div>}
            {sections.map((section, index) => (
              <PreviewSection key={section?.id || index} section={section} tokens={tokens} onNavigate={goTo} activeScreenId={activeScreenId} bare={Boolean(page?.layout)} />
            ))}
          </div>
          {footerNodes.length > 0 ? (
            <div style={{ flexShrink: 0 }}>
              {footerNodes.map((component, index) => (
                <PreviewNode key={`${component?.id || "node"}-${index}`} comp={component} tokens={tokens} onNavigate={goTo} activeScreenId={activeScreenId} />
              ))}
            </div>
          ) : navItems.length > 0 ? (
            <PreviewTabs items={navItems} tokens={tokens} onNavigate={goTo} activeScreenId={activeScreenId} border={{ borderTop: `1px solid ${tokens.border}` }} />
          ) : null}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--gray-500)", textAlign: "center" }}>
        {pages.length} screen{pages.length === 1 ? "" : "s"} · {sourceLabel}
      </div>
    </div>
  );
}
