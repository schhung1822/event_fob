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
