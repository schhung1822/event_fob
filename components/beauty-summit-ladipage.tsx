"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronRight,
  Minus,
  Music,
  Play,
  Plus,
  Users,
  X
} from "lucide-react";

import { SingleTicketCheckout } from "@/components/single-ticket-checkout";
import { careerOptions, hopeOptions } from "@/lib/constants";
import { calculateCartSummary } from "@/lib/pricing";
import type { CartTicketInput, PurchaseForm, Ticket } from "@/lib/types";
import {
  clamp,
  fetchPublicIp,
  formatCurrency,
  getCookie,
  getTikTokTracking,
  persistTikTokClickId,
  setCookie
} from "@/lib/utils";

const eventDate = new Date("2026-06-19T09:00:00+07:00").getTime();

function getCountdownParts() {
  const distance = Math.max(0, eventDate - Date.now());
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0")
  };
}

const sectionShell = "px-4 py-10 sm:px-6 sm:py-18 lg:px-[72px] lg:py-[72px]";
const sectionHead = "mx-auto mb-8 w-full max-w-[980px] text-center";
const eyebrow = "text-sm font-extrabold uppercase text-[#60a5fa]";
const heading = "mt-2 text-[28px] font-black uppercase leading-[1.08] text-white sm:text-[40px] lg:text-[52px]";
const countdownBox = "grid min-h-[50px] place-items-center gap-0.5 rounded-xl border border-[#bfdbfe] bg-[linear-gradient(180deg,#ffffff,#eff6ff)] p-1.5 text-[10px] font-black uppercase text-[#1d4ed8] shadow-[0_8px_18px_rgba(37,99,235,0.12)]";
const glowButtonClass = "relative inline-flex min-h-11 min-w-[142px] cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-full bg-[#1260c2] py-1.5 pl-4 pr-1.5 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(37,99,235,0.30),inset_0_0_0_1px_rgba(255,255,255,0.3)] transition-transform duration-200 ease-out before:absolute before:bottom-[-40%] before:left-[-70px] before:top-[-40%] before:w-[54px] before:rotate-[18deg] before:animate-[lp-cta-shine_2.2s_ease-in-out_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)] hover:-translate-y-1 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-h-12 sm:min-w-[164px] sm:pl-5 sm:text-sm lg:min-h-[54px] lg:min-w-[188px] lg:pl-6 lg:text-base";
const checkoutFieldClass = "min-h-11 w-full min-w-0 rounded-xl border border-[#d1d5db] px-3.5 text-sm font-medium outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb22] sm:min-h-12 sm:px-4 sm:text-base";

const initialForm: PurchaseForm = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  career: "",
  hope: ""
};

type ModalStep = "tickets" | "info";

export function BeautySummitLadipage() {
  const [showHeader, setShowHeader] = useState(false);
  const [countdown, setCountdown] = useState(getCountdownParts);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [form, setForm] = useState<PurchaseForm>(initialForm);
  const [modalStep, setModalStep] = useState<ModalStep>("tickets");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isTicketModalClosing, setIsTicketModalClosing] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const selectedTickets: CartTicketInput[] = tickets
    .map((ticket) => {
      const quantity = quantities[ticket.ticketId] ?? 0;
      return {
        ticketId: ticket.ticketId,
        name: ticket.name,
        quantity,
        price: ticket.moneySale ?? ticket.money
      };
    })
    .filter((ticket) => ticket.quantity > 0);

  const summary = calculateCartSummary(selectedTickets, null);


  useEffect(() => {
    function handleScroll() {
      setShowHeader(window.scrollY > 160);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (ref) {
      setCookie("bs_ref", ref, 30);
    }
    persistTikTokClickId();
  }, []);

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await fetch("/api/tickets", {
          cache: "no-store"
        });
        const payload = (await response.json()) as {
          success: boolean;
          data?: Ticket[];
          error?: string;
        };

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || "Không thể tải được danh sách vé.");
        }

        setTickets(payload.data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Không thể tải được danh sách vé."
        );
      } finally {
        setLoadingTickets(false);
      }
    }

    void loadTickets();
  }, []);

  function openTicketModal() {
    setErrorMessage("");
    setModalStep("tickets");
    setIsTicketModalClosing(false);
    setIsTicketModalOpen(true);
  }

  function closeTicketModal() {
    if (submitLoading) return;
    setErrorMessage("");
    setIsTicketModalClosing(true);
    window.setTimeout(() => {
      setIsTicketModalOpen(false);
      setIsTicketModalClosing(false);
    }, 220);
  }

  function scrollToBenefits() {
    document.getElementById("benefits")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function updateQuantity(ticketId: string, nextValue: number) {
    setQuantities((current) => ({
      ...current,
      [ticketId]: clamp(nextValue, 0, 20)
    }));
  }

  function handleContinueToInfo() {
    setErrorMessage("");

    if (selectedTickets.length === 0) {
      setErrorMessage("Vui lòng chọn ít nhất 1 vé.");
      return;
    }

    setModalStep("info");
  }

  async function handleSubmitOrder() {
    setErrorMessage("");

    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.gender) {
      setErrorMessage(
        "Vui lòng điền đầy đủ: Họ tên, Số điện thoại, Email và Giới tính."
      );
      return;
    }

    if (selectedTickets.length === 0) {
      setErrorMessage("Vui lòng chọn ít nhất 1 vé.");
      setModalStep("tickets");
      return;
    }

    setSubmitLoading(true);

    try {
      const clientIp = await fetchPublicIp();
      const tikTokTracking = getTikTokTracking();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          voucherCode: "",
          tickets: selectedTickets,
          source: window.location.href,
          ref: "nextgency",
          utmSource: "nextgency",
          utmMedium: "nextgency",
          utmCampaign: "nextgency",
          fbp: getCookie("_fbp"),
          fbc: getCookie("_fbc") || new URL(window.location.href).searchParams.get("fbclid") || "",
          ttp: tikTokTracking.ttp,
          ttclid: tikTokTracking.ttclid,
          clientIp
        })
      });

      const payload = (await response.json()) as {
        success: boolean;
        data?: { redirect: string };
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Có lỗi xảy ra khi tạo đơn hàng.");
      }

      window.location.href = payload.data.redirect;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Có lỗi xảy ra khi tạo đơn hàng."
      );
      setSubmitLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdownParts());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-[#f8fafc]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#dbeafe] bg-white/92 px-4 py-3 shadow-[0_10px_20px_rgba(8,3,15,0.2)] backdrop-blur-xl sm:px-6 lg:px-[72px]">
        <div className="mx-auto flex min-h-[58px] w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 sm:min-h-[64px] sm:gap-6">
          <a className="inline-flex  items-center justify-center" href="#top" aria-label="The Future Of Business">
            <span className="text-[40px] text-bold text-[#020617]">FOB</span>
          </a>
          <SingleTicketCheckout
            floating={false}
            buttonLabel="Mua vé ngay"
            className="stc-trigger-header"
          />
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#f8fafc] px-3 pb-10 pt-[96px] sm:px-6 sm:pb-14 sm:pt-[112px] lg:px-[72px]" id="top">
        <div className="mx-auto max-w-[1440px] rounded-[22px] border border-[#dbeafe] bg-[#020617] p-2 shadow-[0_30px_90px_rgba(0,0,0,0.36)] sm:rounded-[28px] sm:p-3">
          <img
            className="block w-full rounded-[16px] object-contain sm:rounded-[22px]"
            src="/images/banner.png"
            alt="The Future Of Business"
          />
        </div>
      </section>
      <footer className="border-t border-[#1e293b] bg-[#020617] px-4 py-12 text-[#f8fafc] sm:px-6 lg:px-[72px] lg:py-14">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_0.72fr_1fr] lg:items-start">
          <div>
            <p className="mt-4 max-w-[470px] text-sm font-semibold uppercase leading-7 tracking-wide">
              <strong>The Future Of Business</strong>
            </p>

            <div className="mt-4">
              <h3 className="text-base font-black text-[#60a5fa]">Thông tin liên hệ</h3>
              <p className="mt-5 text-base font-black uppercase leading-7">
                TẠP CHÍ DOANH NGHIỆP VÀ HỘI NHẬP 
              </p>
              <div className="mt-2 space-y-2 text-sm leading-6">
                <p>Địa chỉ toà soạn: Phòng 1102, tầng 11, nhà D, Khách sạn Thể thao, Làng sinh viên Hacinco, đường Lê Văn Thiêm, phường Thanh Xuân, Thành phố Hà Nội.</p>
                <p>Hotline: 024.355.63.010</p>
                <p>Email: banbientap.dnhn@gmail.com.</p>
                <p>Website: https://doanhnghiephoinhap.vn/</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block" />

          <div className="text-center sm:text-left lg:text-center">
            <h3 className="text-base font-black uppercase">Cộng đồng The Future Of Business</h3>
            <p className="mx-auto mt-6 max-w-[420px] text-base font-semibold leading-7">
              Tham gia cộng đồng The Future Of Business để kết nối chuyên sâu với các thương hiệu và chuyên gia.
            </p>
            <img
              className="mt-8 w-[180px] max-w-full bg-white p-1 rounded-[8px] mx-auto"
              src="/images/qr-zalo-me-zalo-me-g-alkrun710.webp"
              alt="QR cộng đồng The Future Of Business"
            />
          </div>
        </div>
        <div className="text-[14xp] font-light text-center mt-8">
          © Bản quyền thuộc về & cung cấp bởi <a href="https://nextgency.vn/">Nextgency</a> 
        </div>
      </footer>

      {isTicketModalOpen ? (
        <TicketOrderModal
          errorMessage={errorMessage}
          form={form}
          loadingTickets={loadingTickets}
          quantities={quantities}
          selectedTickets={selectedTickets}
          step={modalStep}
          submitLoading={submitLoading}
          summary={summary}
          tickets={tickets}
          isClosing={isTicketModalClosing}
          onBack={() => {
            setErrorMessage("");
            setModalStep("tickets");
          }}
          onClose={closeTicketModal}
          onContinue={handleContinueToInfo}
          onFormChange={setForm}
          onSubmit={() => void handleSubmitOrder()}
          onUpdateQuantity={updateQuantity}
        />
      ) : null}
    </main>
  );
}

function ActionButtons({
  align = "center",
  className = "",
  onBuy,
  onViewBenefits
}: {
  align?: "left" | "center";
  className?: string;
  onBuy: () => void;
  onViewBenefits?: () => void;
}) {
  const alignment = align === "left" ? "justify-center sm:justify-start" : "justify-center";

  return (
    <div className={`flex flex-wrap gap-2.5 sm:gap-3 ${alignment} ${className}`}>
      <GlowButton label="Xem quyền lợi" onClick={onViewBenefits} />
      <GlowButton label="Mua vé ngay" onClick={onBuy} />
    </div>
  );
}

function SocialCircle({
  children,
  label
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <a
      className="grid h-14 w-14 place-items-center rounded-full border border-white text-white transition hover:bg-white hover:text-[#211D51]"
      href="#top"
      aria-label={label}
    >
      {children}
    </a>
  );
}

function ImageShowcaseSlider({
  onBuy,
  onViewBenefits: _onViewBenefits,
  slides
}: {
  onBuy: () => void;
  onViewBenefits?: () => void;
  slides: Array<{
    eyebrow: string;
    image: string;
    text: string;
    title: string;
  }>;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];

  function goToSlide(nextIndex: number) {
    const normalizedIndex = (nextIndex + slides.length) % slides.length;
    setActiveIndex(normalizedIndex);
  }

  return (
    <section className="bg-white px-3 py-6 sm:px-6 sm:py-8 lg:px-[54px]">
      <div className="relative mx-auto aspect-[16/9] lg:aspect-[21/9] max-w-[1800px] overflow-hidden rounded-[14px] bg-[#1d4ed8] shadow-[0_24px_70px_rgba(37,99,235,0.18)] sm:rounded-[24px]">
        <div
          key={activeSlide.image}
          className="absolute inset-0 animate-[lp-fade-in_0.55s_ease_both] bg-cover bg-center"
          style={{
            backgroundImage: `url('${activeSlide.image}')`
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.62),rgba(30,64,175,0.20)_44%,rgba(148,163,184,0.08))]" />

        <button
          className="absolute left-3 top-1/2 z-20 grid h-8 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-2xl text-[#161022] shadow-[0_10px_24px_rgba(22,16,34,0.16)] transition hover:scale-105 sm:left-7 sm:h-10 sm:w-14"
          type="button"
          onClick={() => goToSlide(activeIndex - 1)}
          aria-label="Slide trước"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
        </button>

        <button
          className="absolute right-3 top-1/2 z-20 grid h-8 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-2xl text-[#161022] shadow-[0_10px_24px_rgba(22,16,34,0.16)] transition hover:scale-105 sm:right-7 sm:h-10 sm:w-14"
          type="button"
          onClick={() => goToSlide(activeIndex + 1)}
          aria-label="Slide tiếp theo"
        >
          <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
        </button>

        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 sm:bottom-6 sm:right-8 sm:gap-2">
          {slides.map((slide, index) => (
            <button
              className={[
                "h-2.5 w-2.5 rounded-full border border-white transition sm:h-3 sm:w-3",
                index === activeIndex ? "bg-white" : "bg-white/30"
              ].join(" ")}
              key={slide.image}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Chuyển tới slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PhoneProcessSlider({
  activeIndex,
  onChange,
  slides
}: {
  activeIndex: number;
  onChange: (nextIndex: number) => void;
  slides: Array<{
    alt: string;
    image: string;
  }>;
}) {
  const activeSlide = slides[activeIndex];

  function goToSlide(nextIndex: number) {
    const normalizedIndex = (nextIndex + slides.length) % slides.length;
    onChange(normalizedIndex);
  }

  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div className="rounded-[42px] border-[5px] border-[#29264e] bg-[#17142f] p-1.5 shadow-[0_34px_70px_rgba(22,16,34,0.22)]">
        <div className="overflow-hidden rounded-[34px] bg-white">
          <div className="relative aspect-[9/19] bg-[#f8f5fb]">
            <img
              key={activeSlide.image}
              className="h-full w-full animate-[lp-fade-in_0.45s_ease_both] object-cover"
              src={activeSlide.image}
              alt={activeSlide.alt}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            className={[
              "h-2.5 w-2.5 rounded-full transition",
              index === activeIndex ? "bg-[#2563eb]" : "bg-[#cbd5e1]"
            ].join(" ")}
            key={slide.image}
            type="button"
            onClick={() => goToSlide(index)}
            aria-label={`Chuyển tới ảnh demo ${index + 1}`}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-3">
        <button
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[#2563eb] text-[#2563eb] transition hover:-translate-y-0.5 hover:bg-[#eff6ff]"
          type="button"
          onClick={() => goToSlide(activeIndex - 1)}
          aria-label="Ảnh demo trước"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
        </button>
        <button
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[#2563eb] text-[#2563eb] transition hover:-translate-y-0.5 hover:bg-[#eff6ff]"
          type="button"
          onClick={() => goToSlide(activeIndex + 1)}
          aria-label="Ảnh demo tiếp theo"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

function GlowButton({
  href,
  label,
  className = "",
  onClick
}: {
  href?: string;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="relative z-10 whitespace-nowrap">{label}</span>
      <i className="relative z-10 grid h-[34px] w-[34px] place-items-center rounded-full bg-[#050505] text-lg not-italic text-white shadow-[0_8px_18px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,255,255,0.18)] sm:h-[38px] sm:w-[38px] lg:h-[42px] lg:w-[42px] lg:text-[22px]" aria-hidden="true">
        <ArrowUpRight className="h-5 w-5" strokeWidth={2.4} />
      </i>
    </>
  );

  if (href) {
    return (
      <a className={`${glowButtonClass} ${className}`} href={href}>
        {content}
      </a>
    );
  }

  return (
    <button className={`${glowButtonClass} ${className}`} type="button" onClick={onClick}>
      {content}
    </button>
  );
}

function TicketOrderModal({
  errorMessage,
  form,
  isClosing,
  loadingTickets,
  quantities,
  selectedTickets,
  step,
  submitLoading,
  summary,
  tickets,
  onBack,
  onClose,
  onContinue,
  onFormChange,
  onSubmit,
  onUpdateQuantity
}: {
  errorMessage: string;
  form: PurchaseForm;
  isClosing: boolean;
  loadingTickets: boolean;
  quantities: Record<string, number>;
  selectedTickets: CartTicketInput[];
  step: ModalStep;
  submitLoading: boolean;
  summary: ReturnType<typeof calculateCartSummary>;
  tickets: Ticket[];
  onBack: () => void;
  onClose: () => void;
  onContinue: () => void;
  onFormChange: Dispatch<SetStateAction<PurchaseForm>>;
  onSubmit: () => void;
  onUpdateQuantity: (ticketId: string, nextValue: number) => void;
}) {
  return (
    <div
      className={[
        "fixed inset-0 z-[80] grid place-items-start overflow-x-hidden overflow-y-auto bg-[#17051f99] px-2 py-3 backdrop-blur-md sm:place-items-center sm:px-3 sm:py-6",
        isClosing ? "animate-[lp-modal-backdrop-out_0.22s_ease_both]" : "animate-[lp-modal-backdrop-in_0.24s_ease_both]"
      ].join(" ")}
    >
      <section
        className={[
          "relative w-full min-w-0 max-w-[720px] overflow-hidden rounded-[18px] border border-[#dfcdfa] bg-white p-4 text-[#05083c] shadow-[0_24px_70px_rgba(42,15,75,0.24)] sm:p-7",
          isClosing ? "animate-[lp-modal-out_0.22s_ease_both]" : "animate-[lp-modal-in_0.28s_ease_both]"
        ].join(" ")}
      >
        <button
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-[#eadcff] bg-white text-xl font-black text-[#1d1f5f] shadow-sm"
          type="button"
          onClick={onClose}
          aria-label="Đóng popup"
        >
          <X className="h-5 w-5" strokeWidth={2.4} />
        </button>

        {step === "tickets" ? (
          <>
            <div className="mb-6 flex items-center gap-4 pr-10">
              <h2 className="shrink-0 text-base font-black uppercase tracking-[0.22em] text-[#07114a] sm:text-lg">
                Chọn vé theo nhu cầu
              </h2>
              <span className="hidden sm:block h-px flex-1 bg-[#eadcff]" />
            </div>

            {loadingTickets ? (
              <div className="rounded-2xl border border-[#e8d7ff] p-8 text-center font-bold text-[#1d1f5f]">
                Đang tải thông tin vé...
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl border border-[#ffd5df] bg-[#fff5f7] p-5 text-center font-bold text-[#b91c1c]">
                {errorMessage || "Không thể tải thông tin vé. Vui lòng thử lại sau."}
              </div>
            ) : (
              <div className="space-y-3.5">
                {tickets.map((ticket) => (
                  <TicketQuantityRow
                    key={ticket.ticketId}
                    quantity={quantities[ticket.ticketId] ?? 0}
                    ticket={ticket}
                    onChange={(nextValue) => onUpdateQuantity(ticket.ticketId, nextValue)}
                  />
                ))}
              </div>
            )}

            {errorMessage && tickets.length > 0 ? (
              <div className="mt-4 rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-[#be123c]">
                {errorMessage}
              </div>
            ) : null}

            <OrderSummaryBox summary={summary} />

            <button
              className="mt-5 min-h-[54px] w-full rounded-full bg-[linear-gradient(90deg,#e8a2d0,#c0a0f1)] text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_14px_28px_rgba(141,84,210,0.26)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loadingTickets || selectedTickets.length === 0}
              type="button"
              onClick={onContinue}
            >
              Đặt hàng
            </button>
          </>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 pr-10 sm:mb-6 sm:flex sm:gap-4">
              <button
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#eadcff] bg-white text-lg font-black text-[#1d1f5f]"
                type="button"
                onClick={onBack}
                aria-label="Quay lại chọn vé"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
              </button>
              <h2 className="min-w-0 text-[15px] font-black uppercase leading-6 tracking-[0.16em] text-[#07114a] sm:shrink-0 sm:text-lg sm:tracking-[0.22em]">
                Thông tin thanh toán
              </h2>
              <span className="hidden h-px flex-1 bg-[#eadcff] sm:block" />
            </div>

            <div className="grid min-w-0 gap-3.5 md:grid-cols-2 md:gap-4">
              <label className="grid min-w-0 gap-2 text-sm font-bold text-[#07114a] md:col-span-2">
                Họ và tên *
                <input
                  className={checkoutFieldClass}
                  placeholder="Họ và tên"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    onFormChange((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-bold text-[#07114a]">
                Số điện thoại *
                <input
                  className={checkoutFieldClass}
                  placeholder="Số điện thoại đăng ký Zalo"
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    onFormChange((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-bold text-[#07114a]">
                Email *
                <input
                  className={checkoutFieldClass}
                  placeholder="Email nhận thông tin"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    onFormChange((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-bold text-[#07114a] md:col-span-2">
                Giới tính *
                <select
                  className={`${checkoutFieldClass} bg-white`}
                  value={form.gender}
                  onChange={(event) =>
                    onFormChange((current) => ({
                      ...current,
                      gender: event.target.value as PurchaseForm["gender"]
                    }))
                  }
                >
                  <option value="">Chọn giới tính</option>
                  <option value="m">Nam</option>
                  <option value="f">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </label>
            </div>

            <div className="mt-3.5 grid min-w-0 gap-3.5 sm:mt-5 sm:gap-4">
              <label className="grid min-w-0 gap-2 text-sm font-bold text-[#07114a]">
                Bạn là
                <select
                  className={`${checkoutFieldClass} bg-white`}
                  value={form.career}
                  onChange={(event) =>
                    onFormChange((current) => ({ ...current, career: event.target.value }))
                  }
                >
                  <option value="">Chọn thông tin phù hợp</option>
                  {careerOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-bold text-[#07114a]">
                Bạn mong đợi gì ở Beauty Summit
                <select
                  className={`${checkoutFieldClass} bg-white`}
                  value={form.hope}
                  onChange={(event) =>
                    onFormChange((current) => ({ ...current, hope: event.target.value }))
                  }
                >
                  <option value="">Chọn mong đợi của bạn</option>
                  {hopeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-[#be123c]">
                {errorMessage}
              </div>
            ) : null}

            <OrderSummaryBox summary={summary} />

            <button
              className="mt-4 min-h-[50px] w-full rounded-full bg-[linear-gradient(90deg,#e8a2d0,#c0a0f1)] px-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_14px_28px_rgba(141,84,210,0.26)] disabled:cursor-not-allowed disabled:opacity-55 sm:mt-5 sm:min-h-[54px] sm:tracking-[0.14em]"
              disabled={submitLoading}
              type="button"
              onClick={onSubmit}
            >
              {submitLoading ? "Đang xử lý..." : "Thanh toán ngay"}
            </button>
          </>
        )}

        <p className="mt-4 text-center text-[13px] font-semibold italic leading-6 text-[#07114a]">
          Bằng việc ấn nút thanh toán, bạn xác nhận là đã đọc và hiểu về chính sách bảo mật dữ liệu cá nhân của Beauty Summit.{" "}
          <a
            className="font-black text-[#7d3dc5]"
            href="https://beautysummit.vn/chinh-sach-bao-mat-thong-tin"
            rel="noreferrer"
            target="_blank"
          >
            Tại đây
          </a>
        </p>
      </section>
    </div>
  );
}

function TicketQuantityRow({
  quantity,
  ticket,
  onChange
}: {
  quantity: number;
  ticket: Ticket;
  onChange: (nextValue: number) => void;
}) {
  const currentPrice = ticket.moneySale ?? ticket.money;

  return (
    <article className="grid gap-4 rounded-2xl border border-[#dfcdfa] bg-white p-4 shadow-[0_10px_24px_rgba(88,54,130,0.06)] transition hover:border-[#cdaefa] hover:shadow-[0_14px_34px_rgba(88,54,130,0.1)] sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex min-w-0 items-center gap-4">
        {ticket.img ? (
          <img className="h-[58px] w-[140px] sm:w-[168px] shrink-0 object-contain" src={ticket.img} alt={ticket.name} />
        ) : (
          <div className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full border-4 border-[#d6bb72] bg-[#f9f4ea] text-xs font-black uppercase text-[#f43255] shadow-inner">
            {ticket.ticketId}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xl font-black text-[#f43255]">{formatCurrency(currentPrice)}</p>
        </div>
      </div>

      <div className="grid h-12 w-[146px] grid-cols-[48px_50px_48px] overflow-hidden rounded-2xl border border-[#d7b9ff] bg-[#fbf8ff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.75)] justify-self-start sm:h-[54px] sm:w-[164px] sm:grid-cols-[54px_56px_54px] sm:justify-self-end">
        <button
          className="grid place-items-center text-[#7b568c] transition hover:bg-[#f2e8ff] hover:text-[#4f2066] disabled:cursor-not-allowed disabled:text-[#c7b2d2] disabled:hover:bg-transparent"
          disabled={quantity === 0}
          type="button"
          onClick={() => onChange(quantity - 1)}
          aria-label={`Giảm số lượng ${ticket.name}`}
        >
          <Minus className="h-5 w-5" strokeWidth={2.8} />
        </button>
        <input
          className="min-w-0 border-x border-[#d7b9ff] bg-white text-center text-base font-black text-[#07114a] outline-none"
          readOnly
          type="number"
          value={quantity}
          aria-label={`Số lượng ${ticket.name}`}
        />
        <button
          className="grid place-items-center text-[#7b568c] transition hover:bg-[#f2e8ff] hover:text-[#4f2066]"
          type="button"
          onClick={() => onChange(quantity + 1)}
          aria-label={`Tăng số lượng ${ticket.name}`}
        >
          <Plus className="h-5 w-5" strokeWidth={2.8} />
        </button>
      </div>
    </article>
  );
}

function OrderSummaryBox({ summary }: { summary: ReturnType<typeof calculateCartSummary> }) {
  return (
    <div className="mt-5 min-w-0 rounded-2xl border border-[#dfcdfa] bg-[#fffdfd] p-4 sm:mt-7 sm:p-5">
      <div className="flex min-w-0 items-center justify-between gap-3 text-sm text-[#5f5170]">
        <span>Tạm tính</span>
        <span className="min-w-0 text-right font-bold">{formatCurrency(summary.subtotal)}</span>
      </div>
      <div className="mt-4 grid min-w-0 gap-1 border-t border-[#eadcff] pt-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <span className="text-[16px] sm:text-xl font-black text-[#07114a]">Tổng thanh toán</span>
        <span className="text-[20px] sm:text-2xl font-black text-[#bb59e4]">{formatCurrency(summary.total)}</span>
      </div>
    </div>
  );
}

function CountdownItem({ value, label }: { value: string; label: string; compact?: boolean }) {
  return (
    <span className={countdownBox}>
      <strong className="text-[15px] leading-none text-[#211D51] sm:text-[17px] lg:text-xl">{value}</strong>
      {label}
    </span>
  );
}

function HeroCountdownItem({ value, label }: { value: string; label: string }) {
  return (
    <span className="grid min-h-[70px] place-items-center gap-1 rounded-xl border border-white/30 bg-white/16 p-2 text-[10px] font-black uppercase tracking-[0.04em] text-white shadow-[0_18px_36px_rgba(20,8,42,0.22)] backdrop-blur-md sm:min-h-[104px] sm:rounded-2xl sm:p-3 sm:text-sm sm:tracking-[0.08em]">
      <strong className="block text-2xl font-black leading-none text-white sm:text-[42px]">{value}</strong>
      {label}
    </span>
  );
}

function SectionHeading({ eyebrowText, title }: { eyebrowText: string; title: string }) {
  return (
    <div className={sectionHead}>
      <p className={eyebrow}>{eyebrowText}</p>
      <h2 className={heading}>{title}</h2>
    </div>
  );
}

function GiftCard({ image, title, text }: { image: string; title: string; text: string }) {
  return (
    <article className="group overflow-hidden rounded-[24px] border border-[#eadcff] bg-white shadow-[0_22px_60px_rgba(105,62,164,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_75px_rgba(105,62,164,0.18)]">
      <div className="relative aspect-[1.72/1] overflow-hidden bg-[#f5efff]">
        <img
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          src={image}
          alt={title}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(33,29,81,0),rgba(33,29,81,0.56))]" />
        <span className="absolute left-5 top-5 rounded-full bg-white/92 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#2563eb] shadow-[0_10px_24px_rgba(15,23,42,0.16)]">
          Beauty Summit
        </span>
      </div>
      <div className="p-6 lg:p-7">
        <h3 className="text-[22px] font-black uppercase leading-tight text-[#211D51]">{title}</h3>
        <p className="mt-4 text-base font-semibold leading-7 text-[#5b5178]">{text}</p>
      </div>
    </article>
  );
}

function GalleryImage({
  alt,
  className = "",
  image
}: {
  alt: string;
  className?: string;
  image: string;
}) {
  return (
    <figure className={`min-h-[260px] overflow-hidden rounded-[18px] bg-[#f3f3f3] ${className}`}>
      <img className="h-full min-h-[260px] w-full object-cover" src={image} alt={alt} />
    </figure>
  );
}

function ScheduleCard({ title, items }: { title: string; items: string[][] }) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-[#eadcff] bg-white text-[#211D51] shadow-[0_20px_55px_rgba(85,51,146,0.12)]">
      <h3 className="bg-[linear-gradient(90deg,#4B1C9B,#D7565A)] px-7 py-5 text-[24px] font-black uppercase text-white">{title}</h3>
      <div className="p-7">
      {items.map(([time, text]) => (
        <div className="grid gap-2 border-t border-[#efe5ff] py-4 first:border-t-0 first:pt-0 sm:grid-cols-[132px_1fr] sm:gap-5" key={`${title}-${time}`}>
          <strong className="inline-flex h-fit w-fit rounded-full bg-[#dbeafe] px-3 py-1 text-sm font-black text-[#1d4ed8]">{time}</strong>
          <p className="font-semibold leading-6 text-[#3b315a]">{text}</p>
        </div>
      ))}
      </div>
    </article>
  );
}
