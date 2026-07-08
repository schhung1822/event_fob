"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { Camera, Download, RotateCcw, Share2 } from "lucide-react";

import type { OrderDetail, OrderRecord } from "@/lib/types";

type InvitationCardPageProps = {
  orderId: string;
};

type TicketTemplateKey = "studient" | "sliver" | "gold" | "vip";

type TicketTemplate = {
  key: TicketTemplateKey;
  label: string;
  image: string;
};

const TICKET_TEMPLATES: Record<TicketTemplateKey, TicketTemplate> = {
  studient: {
    key: "studient",
    label: "Student",
    image: "/images/student.webp"
  },
  sliver: {
    key: "sliver",
    label: "Silver",
    image: "/images/sliver.webp"
  },
  gold: {
    key: "gold",
    label: "Gold",
    image: "/images/gold.webp"
  },
  vip: {
    key: "vip",
    label: "VIP",
    image: "/images/vip.webp"
  }
};

const REGISTER_TICKET_URL = "https://smesummit.vn/";
const REGISTER_TICKET_LABEL = "Đăng ký vé";
const HOME_URL = "/";
const HOME_LABEL = "Về trang chủ";
const INVITATION_UNAVAILABLE_TITLE = "Không thể tạo thiệp mời";
const INVITATION_UNAVAILABLE_MESSAGE = "Bạn không thể tạo thiệp mời vui lòng đăng ký vé để có thể tạo thiệp mời.";

const DEFAULT_IMAGE_SETTINGS = {
  scale: 100,
  offsetX: 0,
  offsetY: 0
};

const panelClass =
  "rounded-2xl border border-white/15 bg-[#3b0a74]/58 p-4 shadow-[0_16px_40px_rgba(32,0,78,0.2)] backdrop-blur-xl sm:p-5";

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isPaidStatus(status: string) {
  const normalized = normalizeText(status);
  return normalized === "paydone" || normalized === "paid" || normalized === "done";
}

function getTemplateKey(className: string): TicketTemplateKey | null {
  const normalized = normalizeText(className);

  if (normalized.includes("vip")) return "vip";
  if (normalized.includes("gold") || normalized.includes("vang")) return "gold";
  if (normalized.includes("silver") || normalized.includes("sliver") || normalized.includes("bac")) return "sliver";
  if (
    normalized.includes("student") ||
    normalized.includes("studient") ||
    normalized.includes("sinh vien") ||
    normalized.includes("hoc sinh")
  ) {
    return "studient";
  }

  return null;
}

function uniquePaidTemplates(records: OrderRecord[]) {
  const templates = new Map<TicketTemplateKey, TicketTemplate>();

  records.forEach((record) => {
    if (!isPaidStatus(record.status)) return;

    const templateKey = getTemplateKey(record.className);
    if (!templateKey) return;

    templates.set(templateKey, TICKET_TEMPLATES[templateKey]);
  });

  return Array.from(templates.values());
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không thể tải ảnh thiệp."));
    image.src = src;
  });
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawLeftText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
  color: string,
  weight = 700
) {
  let currentFontSize = fontSize;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = color;

  do {
    context.font = `${weight} ${currentFontSize}px ${fontFamily}`;
    if (context.measureText(text).width <= maxWidth || currentFontSize <= 42) break;
    currentFontSize -= 4;
  } while (currentFontSize > 42);

  context.fillText(text, x, y, maxWidth);
}

function getSafeFileName(value: string) {
  return normalizeText(value || "thiep-moi")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "thiep-moi";
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function openImageFallback(canvas: HTMLCanvasElement) {
  const imageUrl = canvas.toDataURL("image/png");
  const openedWindow = window.open();
  if (openedWindow) {
    openedWindow.document.write(`<img src="${imageUrl}" alt="Thiệp mời" style="width:100%;height:auto;display:block" />`);
    openedWindow.document.title = "Thiệp mời";
    openedWindow.document.close();
    return;
  }

  window.location.href = imageUrl;
}

function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`${panelClass} ${className}`}>{children}</section>;
}

function TextInput({ label, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[0.72rem] font-black uppercase tracking-[0.04em] text-white/75" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="min-h-11 text-[12px] sm:text-[15px] w-full rounded-xl border border-white/20 bg-white/85 px-3.5 py-2.5 font-extrabold text-[#24102f] outline-none transition placeholder:text-[#24102f]/45 focus:border-white/75 focus:ring-4 focus:ring-white/15"
        {...props}
      />
    </div>
  );
}

function InvitationStateCard({
  tone = "default",
  title,
  message
}: {
  tone?: "default" | "error";
  title: string;
  message: string;
}) {
  const isError = tone === "error";

  return (
    <section className="mx-auto flex min-h-[52vh] w-full max-w-[620px] items-center justify-center px-3">
      <div className="w-full rounded-[24px] border border-slate-200/80 bg-white px-6 py-8 text-center text-[#15134a] shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:px-10 sm:py-9">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full border-[3px] border-[#d5167a] text-2xl font-black leading-none text-[#d5167a]">
          {isError ? "!" : "..."}
        </div>
        <h2 className="m-0 text-xl font-black leading-tight text-[#15134a] sm:text-2xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-[460px] text-sm leading-7 text-[#4d438f] sm:text-[15px]">{message}</p>
        {isError ? (
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#d5167a] to-[#7c13b8] px-7 text-sm font-black text-[#fff] shadow-[0_12px_26px_rgba(213,22,122,0.28)] transition hover:-translate-y-0.5 hover:brightness-110"
              href={REGISTER_TICKET_URL}
            >
              <span className="text-white">{REGISTER_TICKET_LABEL}</span>
            </a>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d5167a]/25 bg-white px-7 text-sm font-black text-[#9b147e] transition hover:-translate-y-0.5 hover:border-[#d5167a]/45 hover:bg-[#fff5fb]"
              href={HOME_URL}
            >
              {HOME_LABEL}
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ImageSlider({
  label,
  value,
  min,
  max,
  suffix = "%",
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 sm:gap-3 text-xs font-black text-white/80">
        <span>{label}</span>
        <strong className="text-white">{value}{suffix}</strong>
      </div>
      <input
        aria-label={label}
        className="h-1.5 w-full cursor-pointer accent-pink-400"
        max={max}
        min={min}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function ActionButton({
  icon,
  label,
  disabled,
  onClick
}: {
  icon: ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/95 px-3 py-3 text-center text-xs font-black sm:text-sm text-[#c2187a] shadow-[0_10px_24px_rgba(32,0,78,0.16)] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-55 sm:min-h-16 lg:grid lg:min-h-20 lg:place-items-center lg:gap-1.5 lg:p-4"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function InvitationCardPage({ orderId }: InvitationCardPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<TicketTemplate[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<TicketTemplateKey | "">("");
  const [displayName, setDisplayName] = useState("");
  const [alias, setAlias] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarScale, setAvatarScale] = useState(DEFAULT_IMAGE_SETTINGS.scale);
  const [avatarOffsetX, setAvatarOffsetX] = useState(DEFAULT_IMAGE_SETTINGS.offsetX);
  const [avatarOffsetY, setAvatarOffsetY] = useState(DEFAULT_IMAGE_SETTINGS.offsetY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [renderError, setRenderError] = useState("");

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateKey) return null;
    return TICKET_TEMPLATES[selectedTemplateKey];
  }, [selectedTemplateKey]);

  useEffect(() => {
    if (!orderId) {
      setError(INVITATION_UNAVAILABLE_MESSAGE);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadOrder() {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          cache: "no-store"
        });
        const payload = (await response.json()) as {
          success: boolean;
          data?: OrderDetail;
          error?: string;
        };

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(INVITATION_UNAVAILABLE_MESSAGE);
        }

        const templates = uniquePaidTemplates(payload.data.records);
        if (cancelled) return;

        setOrderDetail(payload.data);
        setDisplayName(payload.data.customerName || "");
        setAvailableTemplates(templates);
        setSelectedTemplateKey(templates[0]?.key || "");
      } catch (caughtError) {
        if (cancelled) return;
        setError(INVITATION_UNAVAILABLE_MESSAGE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!avatarUrl) return;

    return () => {
      URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  useEffect(() => {
    let cancelled = false;

    async function renderCard() {
      const canvas = canvasRef.current;
      if (!canvas || !selectedTemplate) return;

      try {
        setRenderError("");
        const [templateImage, avatarImage] = await Promise.all([
          loadImage(selectedTemplate.image),
          avatarUrl ? loadImage(avatarUrl) : Promise.resolve(null)
        ]);

        if (cancelled) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = templateImage.naturalWidth || templateImage.width;
        canvas.height = templateImage.naturalHeight || templateImage.height;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

        const avatarSize = canvas.width * 0.155;
        const avatarCenterX = canvas.width * 0.8008;
        const avatarCenterY = canvas.height * 0.272;
        const avatarX = avatarCenterX - avatarSize / 2;
        const avatarY = avatarCenterY - avatarSize / 2;

        context.save();
        context.beginPath();
        context.arc(avatarCenterX, avatarCenterY, avatarSize / 2, 0, Math.PI * 2);
        context.clip();

        if (avatarImage) {
          const drawSize = avatarSize * (avatarScale / 100);
          const drawX = avatarCenterX - drawSize / 2 + (avatarOffsetX / 100) * avatarSize * 0.45;
          const drawY = avatarCenterY - drawSize / 2 + (avatarOffsetY / 100) * avatarSize * 0.45;
          drawCoverImage(context, avatarImage, drawX, drawY, drawSize, drawSize);
        } else {
          context.fillStyle = "rgba(248, 250, 252, 0.92)";
          context.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        }
        context.restore();



        const name = displayName.trim() || orderDetail?.customerName || "Tên khách mời";
        drawLeftText(
          context,
          name,
          canvas.width * 0.8008,
          canvas.height * 0.49,
          canvas.width * 0.5,
          canvas.width * 0.028,
          "Inter, sans-serif",
          "#ffffff",
          800
        );

        const aliasText = alias.trim();
        if (aliasText) {
          drawLeftText(
            context,
            aliasText,
            canvas.width * 0.8008,
            canvas.height * 0.54,
            canvas.width * 0.5,
            canvas.width * 0.02,
            "Inter, sans-serif",
            "rgba(255, 255, 255, 0.92)",
            500
          );
        }
      } catch (caughtError) {
        setRenderError(
          caughtError instanceof Error ? caughtError.message : "Không thể tạo ảnh thiệp."
        );
      }
    }

    void renderCard();

    return () => {
      cancelled = true;
    };
  }, [alias, avatarOffsetX, avatarOffsetY, avatarScale, avatarUrl, displayName, orderDetail?.customerName, selectedTemplate]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (avatarUrl) {
      URL.revokeObjectURL(avatarUrl);
    }
    setAvatarUrl(URL.createObjectURL(file));
  }

  function resetImageSettings() {
    setAvatarScale(DEFAULT_IMAGE_SETTINGS.scale);
    setAvatarOffsetX(DEFAULT_IMAGE_SETTINGS.offsetX);
    setAvatarOffsetY(DEFAULT_IMAGE_SETTINGS.offsetY);
  }

  async function createInvitationBlob() {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTemplate) return null;

    return canvasToBlob(canvas);
  }

  async function downloadInvitation() {
    const canvas = canvasRef.current;
    const blob = await createInvitationBlob();
    if (!canvas || !blob || !selectedTemplate) return;

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${getSafeFileName(displayName || orderId)}-${selectedTemplate.key}.png`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      openImageFallback(canvas);
    }
  }

  async function shareInvitation() {
    const blob = await createInvitationBlob();
    if (!blob || !selectedTemplate) return;

    const file = new File(
      [blob],
      `${getSafeFileName(displayName || orderId)}-${selectedTemplate.key}.png`,
      { type: "image/png" }
    );

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "Thiệp mời The Future of Business 2026",
        text: "Thiệp mời của tôi tại The Future of Business 2026",
        files: [file]
      });
      return;
    }

    await downloadInvitation();
  }

  const ticketUnavailable = !loading && !error && availableTemplates.length === 0;
  const disabledActions = !selectedTemplate || Boolean(renderError);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_16%_8%,rgba(255,87,180,0.28),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(82,36,214,0.34),transparent_32%),linear-gradient(145deg,#2a0a72_0%,#7c13b8_42%,#e10b72_100%)] px-3 py-5 text-white sm:px-5 sm:py-7 lg:py-8">
      <section className="mx-auto mb-6 max-w-[1200px] text-center sm:mb-10">
        <span className="text-[0.7rem] font-semibold uppercase text-white/70">
          The Future of Business 2026
        </span>
        <h1 className="mt-2 text-3xl font-black uppercase leading-none tracking-tight text-white sm:text-4xl lg:text-[44px]">
          Tạo thiệp mời
        </h1>
      </section>

      {loading ? (
        <InvitationStateCard
          title="Đang kiểm tra vé"
          message="Hệ thống đang đối chiếu mã đơn hàng và trạng thái thanh toán."
        />
      ) : error ? (
        <InvitationStateCard tone="error" title={INVITATION_UNAVAILABLE_TITLE} message={error} />
      ) : ticketUnavailable ? (
        <InvitationStateCard
          tone="error"
          title={INVITATION_UNAVAILABLE_TITLE}
          message={INVITATION_UNAVAILABLE_MESSAGE}
        />
      ) : (
        <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-start lg:gap-x-5">
            <Panel className="order-1 grid grid-cols-[1fr_auto] items-center gap-3 lg:col-start-1 lg:row-start-1">
              <div>
                <h2 className="mb-1.5 text-xl font-black leading-tight text-white">Tải ảnh đại diện</h2>
                <p className="text-xs leading-relaxed text-white/72">
                  Nhấn nút bên cạnh để chọn ảnh đại diện từ thư viện. Chọn ảnh rõ mặt, đủ sáng để ảnh hiển thị đẹp nhất.
                </p>
              </div>
              <button
                className="flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 rounded-2xl border border-white/25 bg-white/10 text-center text-[0.68rem] font-black leading-none text-white sm:text-xs transition hover:bg-white/15 sm:h-20 sm:w-20"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera aria-hidden="true" className="mx-auto shrink-0" size={20} />
                <span className="text-[12px]">{avatarUrl ? "Đổi ảnh" : "Chọn ảnh"}</span>
              </button>
              <input
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                type="file"
                onChange={handleAvatarChange}
              />
            </Panel>

            <Panel className="order-3 lg:col-start-1 lg:row-start-2">
              <div>
                <h2 className="mb-1.5 text-xl font-black leading-tight text-white">Thông tin</h2>
                <p className="text-xs hidden sm:block leading-relaxed text-white/72">
                  Tên hiển thị và bí danh sẽ nằm bên dưới phần ban tổ chức trân trọng kính mời.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
                <TextInput
                  id="invitation-name"
                  label="Tên hiển thị"
                  maxLength={40}
                  placeholder="Nhập tên của bạn"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
                <TextInput
                  id="invitation-alias"
                  label="Bí danh"
                  maxLength={48}
                  placeholder="Tùy chọn"
                  value={alias}
                  onChange={(event) => setAlias(event.target.value)}
                />
              </div>
            </Panel>

            <Panel className="order-4 bg-[#25004d]/78 lg:col-start-1 lg:row-start-3">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="m-0 text-xl font-black uppercase tracking-wide text-white">Chỉnh ảnh</h2>
                <button
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border-0 bg-white/90 px-2.5 text-xs font-black sm:min-h-9 sm:gap-1.5 sm:px-3 sm:text-sm text-[#24102f] transition hover:bg-white"
                  type="button"
                  onClick={resetImageSettings}
                >
                  <RotateCcw aria-hidden="true" size={14} />
                  Đặt lại
                </button>
              </div>
              <div className="space-y-4">
                <ImageSlider label="Phóng to" max={150} min={70} value={avatarScale} onChange={setAvatarScale} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <ImageSlider label="Ngang" max={100} min={-100} value={avatarOffsetX} onChange={setAvatarOffsetX} />
                  <ImageSlider label="Dọc" max={100} min={-100} value={avatarOffsetY} onChange={setAvatarOffsetY} />
                </div>
              </div>
            </Panel>

            {renderError ? (
              <div className={`${panelClass} order-6 bg-rose-900/55 text-sm font-black text-white lg:col-start-1 lg:row-start-5`}>
                {renderError}
              </div>
            ) : null}

            <section className="order-5 grid w-full grid-cols-2 gap-2.5 pt-0 lg:col-start-1 lg:row-start-4">
              <ActionButton
                disabled={disabledActions}
                icon={<Download aria-hidden="true" size={24} />}
                label="Tải ảnh"
                onClick={() => void downloadInvitation()}
              />
              <ActionButton
                disabled={disabledActions}
                icon={<Share2 aria-hidden="true" size={24} />}
                label="Share thiệp mời"
                onClick={() => void shareInvitation()}
              />
            </section>

          <section className={`${panelClass} order-2 overflow-hidden p-2 sm:p-2.5 lg:col-start-2 lg:row-start-1 lg:row-span-6`} aria-label="Xem trước thiệp mời">
            <div className="flex items-center justify-between px-1 pb-2 text-[0.68rem] font-black uppercase tracking-[0.06em] text-white/70">
              <span>Xem trước thiệp mời</span>
              <strong className="rounded-full bg-white/16 px-2.5 py-1 text-[0.68rem] text-white">PNG</strong>
            </div>
            <canvas
              ref={canvasRef}
              className="block h-auto w-full rounded-xl bg-slate-950 shadow-[0_10px_28px_rgba(35,0,57,0.22)]"
            />
          </section>
        </section>
      )}
    </main>
  );
}