import { randomInt } from "crypto";

export function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value || 0)} VND`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizePhone(phone: string) {
  const cleaned = phone.replace(/[^0-9+]/g, "");

  if (cleaned.startsWith("+84")) return cleaned;
  if (cleaned.startsWith("84")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+84${cleaned.slice(1)}`;
  if (cleaned.startsWith("86")) return `+82${cleaned.slice(2)}`;

  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

export function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : "";
}

export function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(
    value
  )};expires=${expires.toUTCString()};path=/`;
}

export function persistTikTokClickId(days = 30) {
  if (typeof window === "undefined") return "";

  const ttclid = new URL(window.location.href).searchParams.get("ttclid")?.trim() || "";
  if (ttclid) {
    setCookie("bs_ttclid", ttclid, days);
  }

  return ttclid;
}

export function getTikTokTracking() {
  if (typeof window === "undefined") {
    return { ttp: "", ttclid: "" };
  }

  const urlTtclid = new URL(window.location.href).searchParams.get("ttclid")?.trim() || "";

  return {
    ttp: getCookie("_ttp"),
    ttclid: urlTtclid || getCookie("bs_ttclid")
  };
}


export function persistMarketingTracking(days = 30) {
  if (typeof window === "undefined") return;

  const params = new URL(window.location.href).searchParams;
  const trackedKeys = ["ref", "utm_source", "utm_medium", "utm_campaign"];

  trackedKeys.forEach((key) => {
    const value = params.get(key)?.trim();
    if (value) {
      setCookie(`bs_${key}`, value, days);
    }
  });
}

export function getMarketingTracking() {
  if (typeof window === "undefined") {
    return {
      ref: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: ""
    };
  }

  const params = new URL(window.location.href).searchParams;

  return {
    ref: params.get("ref")?.trim() || getCookie("bs_ref"),
    utmSource: params.get("utm_source")?.trim() || getCookie("bs_utm_source"),
    utmMedium: params.get("utm_medium")?.trim() || getCookie("bs_utm_medium"),
    utmCampaign:
      params.get("utm_campaign")?.trim() || getCookie("bs_utm_campaign")
  };
}
export async function fetchPublicIp() {
  if (typeof window === "undefined") return "";

  try {
    const response = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store"
    });
    const payload = (await response.json()) as { ip?: string };
    return payload.ip?.trim() || "";
  } catch {
    return "";
  }
}

export function getVietnamNowString() {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

export function compareDbDateString(left: string, right: string) {
  return left.localeCompare(right);
}

export function generateCode(prefix: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = prefix;
  for (let index = 0; index < 7; index += 1) {
    code += chars[randomInt(0, chars.length)];
  }
  return code;
}

export function upperVi(value: string) {
  return value.trim().toLocaleUpperCase("vi-VN");
}

export function isPaidStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  return normalized === "paydone" || normalized === "paid" || normalized === "done";
}
