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

const benefits = [
  "Kết nối hợp tác với các thương hiệu lớn và cơ hội trở thành nhà phân phối độc quyền",
  "Cập nhật chiến lược bứt phá tăng trưởng cùng đội ngũ chuyên gia đầu ngành",
  "Tư vấn cá nhân, gỡ rối trực tiếp và ứng dụng ngay qua Private Coaching 1:1"
];

const benefitRows = [
  ["Gặp gỡ giao lưu nam diễn viên Hàn Quốc Kim Bum", true, true, true, true],
  ["Tham quan toàn bộ khu booth, trải nghiệm sản phẩm", true, true, true, true],
  ["Cơ hội nhận quà tặng, voucher lên tới 30% từ hơn 200 brand chính hãng", true, true, true, true],
  ["Tham gia các hoạt động sân khấu theo lịch BTC", true, true, true, true],
  ["Voucher giảm 35% khi mua bộ cẩm nang kinh doanh ngành làm đẹp", true, true, false, false],
  ["Bộ sách 6 CẨM NANG KINH DOANH THỰC CHIẾN CHO NGÀNH LÀM ĐẸP trị giá 1.200.000 VNĐ", false, false, true, true],
  ["Tham dự đồng thời hội thảo Da liễu và hội thảo Marketing", false, true, true, true],
  ["Quà tặng túi Tote phiên bản giới hạn từ BTC", false, false, true, true],
  ["Tạp chí xu hướng Beauty Summit 2026 phiên bản giới hạn", false, false, true, true],
  ["01 suất PRIVATE COACHING 1:1 theo slot giới hạn của BTC để trao đổi trực tiếp, nhận tư vấn cá nhân hoá từ chuyên gia.", false, false, true, true],
  ["Tham dự HỘI THẢO chuyên đề 'Phát triển thị trường tiêu dùng trong nước đối với ngành hàng hóa mỹ phẩm', được hỗ trợ chuyên môn bởi Cục Quản lý và Phát triển thị trường trong nước, đơn vị tổ chức: Hoàng Tú Holdings.", false, false, false, true],
  ["Tham gia LUXURY GALA DINNER, gặp gỡ trực tiếp ĐẠI SỨ THƯƠNG HIỆU KIM BUM – kết nối cùng dàn diễn giả, KOLS và CEO của nhiều thương hiệu danh tiếng.", false, false, false, true]
];

const ticketCards = [
  {
    name: "VÉ GOLD",
    price: "99.000 VNĐ",
    oldPrice: "199k",
    theme: {
      card: "border-[#f5d27a] bg-[linear-gradient(180deg,#fff8e9,#f4d99c)] text-[#4a1118]",
      title: "text-[#8a0f24]",
      price: "text-[#b1132a]",
      oldPrice: "text-[#835c1e]"
    },
    details: [
      "Cơ hội gặp gỡ giao lưu nam diễn viên Hàn Quốc Kim Bum.",
      "Tham quan toàn bộ khu booth, trải nghiệm sản phẩm.",
      "Nhận quà tặng và voucher từ hơn 200 thương hiệu chính hãng.",
      "Tham gia các hoạt động sân khấu theo lịch trình độc quyền từ BTC.",
      "Nhận VOUCHER GIẢM 35% khi mua bộ sách 6 cẩm nang kinh doanh thực chiến cho ngành làm đẹp"
    ]
  },
  {
    name: "VÉ RUBY",
    price: "399.000 VNĐ",
    oldPrice: "599k",
    theme: {
      card: "border-[#f3a0b7] bg-[linear-gradient(180deg,#fff1f5,#ffd6e2)] text-[#4a0d1e]",
      title: "text-[#9f1239]",
      price: "text-[#e11d48]",
      oldPrice: "text-[#7f1d1d]"
    },
    details: [
      "Bao gồm toàn bộ quyền lợi của vé Gold.",
      "Kết nối trực tiếp với hơn 200 thương hiệu trong ngành làm đẹp.",
      "Tham dự hội thảo chuyên sâu về Da liễu và Marketing.",
      "Cập nhật chiến lược tăng trưởng từ đội ngũ chuyên gia đầu ngành."
    ]
  },
  {
    name: "VÉ VIP",
    price: "999.000 VNĐ",
    oldPrice: "1.599k",
    theme: {
      card: "border-[#cab4ff] bg-[linear-gradient(180deg,#f7f0ff,#eadcff)] text-[#251144]",
      title: "text-[#6d28d9]",
      price: "text-[#a855f7]",
      oldPrice: "text-[#6b4a8d]"
    },
    details: [
      "Bao gồm toàn bộ quyền lợi của vé Ruby.",
      "Nhận bộ quà tặng túi Tote phiên bản giới hạn từ BTC.",
      "Sở hữu tạp chí xu hướng Beauty Summit 2026.",
      "Sở hữu trọn bộ sách 6 CẨM NANG KINH DOANH THỰC CHIẾN NGÀNH LÀM ĐẸP trị giá 1.200.000 VNĐ.",
      "Đặc quyền đăng ký Private Coaching 1:1 theo slot giới hạn."
    ]
  }
];

const dayOne = [
  ["9h00 - 11h00", "Hội thảo chuyên đề 'Phát triển thị trường tiêu dùng trong nước đối với ngành hàng hóa mỹ phẩm', được hỗ trợ chuyên môn bởi Cục Quản lý và Phát triển thị trường trong nước. Đơn vị tổ chức: Hoàng Tú Holdings."],
  ["11h00 - 11h30", "Khai mạc Beauty Summit 2026."],
  ["11h30 - 12h00", "Giao lưu cùng đại sứ thương hiệu Kim Bum."],
  ["13h00 - 17h00", "Hội thảo Da liễu: cập nhật phác đồ điều trị và xu hướng thẩm mỹ 2026."],
  ["13h00 - 16h00", "Private Coaching 1:1 về Marketing & Sales: tăng trưởng doanh số."],
  ["13h00 - 16h00", "TalkZone 360 – Giới thiệu sản phẩm & Demo Công nghệ"],
  ["13h00 - 16h00", "Megalive – Đại tiệc Shopping Mỹ Phẩm Beauty Summit 2026"]
];

const dayTwo = [
  ["8h00 - 9h00", "Đón khách và check-in."],
  ["9h00 - 12h00", "Hội thảo Marketing – Phiên 1: 'Kiến tạo hệ thống tăng trưởng doanh thu trong kỷ nguyên AI & thương mại điện tử'"],
  ["9h00 - 12h00", "TalkZone 360 – Giới thiệu sản phẩm & Demo Công nghệ"],
  ["13h30 - 14h30", "Megalive – Đại tiệc Shopping Mỹ Phẩm Beauty Summit 2026"],
  ["13h30 - 16h00", "Hội thảo Marketing – Phiên 2: 'Xây dựng bộ máy Marketing hiệu suất cao: Từ công cụ đến con người'"],
  ["13h30 - 15h00", "TalkZone 360 – Giới thiệu sản phẩm & Demo Công nghệ"],
  ["16h00 - 17h00", "Lễ trao chứng chỉ tốt nghiệp ISO 17024"],
  ["17h00", "Bế mạc Beauty Summit 2026"]
];

const steps = [
  ["1", "Chọn hạng vé", "Chọn các hạng vé theo nhu cầu của bạn"],
  ["2", "Đăng ký thông tin", "Điền đầy đủ thông tin theo hướng dẫn từ ban tổ chức."],
  ["3", "Thanh toán vé", "Xác nhận thông tin và hoàn tất thanh toán theo tài khoản nhận."],
  ["4", "Nhận vé tham dự", "Vé điện tử được gửi tới email và zalo của bạn sau khi thanh toán thành công."]
];

const speakerSlides = [
  {
    image: "/images/banner-kim-bum-dai-su-thuong-hieu-bs-26-new_1.webp",
    title: "Dàn diễn giả và chuyên gia đầu ngành",
    eyebrow: "Beauty Summit 2026",
    text: "Không gian hội thảo, triển lãm và kết nối kinh doanh dành cho chủ spa, clinic và thương hiệu làm đẹp."
  },
  {
    image: "/images/banner-dien-gia-tc-25526.webp",
    title: "Cập nhật chiến lược tăng trưởng",
    eyebrow: "Hội thảo chuyên sâu",
    text: "Gặp gỡ các chuyên gia giàu kinh nghiệm trong lĩnh vực da liễu, marketing, vận hành và phát triển thương hiệu."
  },
  {
    image: "/images/banner-dien-gia-tc-19526.webp",
    title: "Kết nối cộng đồng ngành làm đẹp",
    eyebrow: "Networking",
    text: "Tạo cơ hội hợp tác giữa chủ spa, clinic, nhà phân phối và các thương hiệu mỹ phẩm chính hãng."
  },
  {
    image: "/images/dai-su-kim-bum-ban-ve-bs-26-34416.webp",
    title: "Kết nối cộng đồng ngành làm đẹp",
    eyebrow: "Networking",
    text: "Tạo cơ hội hợp tác giữa chủ spa, clinic, nhà phân phối và các thương hiệu mỹ phẩm chính hãng."
  }
];

const gallerySlides = [
  {
    image: "/images/banner-dien-gia-ban-ve-26-34-2.webp",
    title: "Không gian triển lãm quy mô lớn",
    eyebrow: "Beauty Summit Experience",
    text: "Khám phá booth thương hiệu, sản phẩm mới, hoạt động sân khấu và các khu trải nghiệm xuyên suốt sự kiện."
  },
  {
    image: "/images/banner-dien-gia-ban-ve-26-34-4.webp",
    title: "Trải nghiệm sản phẩm chính hãng",
    eyebrow: "Brand Showcase",
    text: "Cập nhật xu hướng chăm sóc sắc đẹp và nhận ưu đãi từ hệ sinh thái hơn 200 thương hiệu tham dự."
  },
  {
    image: "/images/banner-dien-gia-ban-ve-26-34-5.webp",
    title: "Khoảnh khắc kết nối và giao lưu",
    eyebrow: "Community",
    text: "Nơi cộng đồng ngành làm đẹp gặp gỡ, học hỏi, trao đổi kinh nghiệm và mở rộng cơ hội kinh doanh."
  },
  {
    image: "/images/banner-dien-gia-ban-ve-26-34-3.webp",
    title: "Khoảnh khắc kết nối và giao lưu",
    eyebrow: "Community",
    text: "Nơi cộng đồng ngành làm đẹp gặp gỡ, học hỏi, trao đổi kinh nghiệm và mở rộng cơ hội kinh doanh."
  },
  {
    image: "/images/anh-giua-bai-lp-25526-1.webp",
    title: "Khoảnh khắc kết nối và giao lưu",
    eyebrow: "Community",
    text: "Nơi cộng đồng ngành làm đẹp gặp gỡ, học hỏi, trao đổi kinh nghiệm và mở rộng cơ hội kinh doanh."
  }
];

const processPhoneSlides = [
  {
    image: "/images/chon_ve.webp",
    alt: "Demo màn hình đăng ký Beauty Summit"
  },
  {
    image: "/images/dien_thong_tin.webp",
    alt: "Demo quy trình mua vé Beauty Summit"
  },
  {
    image: "/images/thanh_toan.webp",
    alt: "Demo nhận vé tham dự Beauty Summit"
  },
  {
    image: "/images/zbs.webp",
    alt: "Demo thông tin sự kiện Beauty Summit"
  }
];

const sectionShell = "px-4 py-10 sm:px-6 sm:py-18 lg:px-[72px] lg:py-[72px]";
const sectionHead = "mx-auto mb-8 w-full max-w-[980px] text-center";
const eyebrow = "text-sm font-extrabold uppercase text-[#f2c76b]";
const heading = "mt-2 text-[28px] font-black uppercase leading-[1.08] text-white sm:text-[40px] lg:text-[52px]";
const countdownBox = "grid min-h-[50px] place-items-center gap-0.5 rounded-xl border border-[#d9c7ff] bg-[linear-gradient(180deg,#ffffff,#f6efff)] p-1.5 text-[10px] font-black uppercase text-[#7c4fc7] shadow-[0_8px_18px_rgba(111,70,190,0.12)]";
const glowButtonClass = "relative inline-flex min-h-11 min-w-[142px] cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-full bg-[linear-gradient(135deg,#2b3064_0%,#8e44ad_50%,#e91e63_100%)] py-1.5 pl-4 pr-1.5 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(92,42,156,0.32),inset_0_0_0_1px_rgba(255,255,255,0.3)] transition-transform duration-200 ease-out before:absolute before:bottom-[-40%] before:left-[-70px] before:top-[-40%] before:w-[54px] before:rotate-[18deg] before:animate-[lp-cta-shine_2.2s_ease-in-out_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.8),transparent)] hover:-translate-y-1 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-h-12 sm:min-w-[164px] sm:pl-5 sm:text-sm lg:min-h-[54px] lg:min-w-[188px] lg:pl-6 lg:text-base";
const checkoutFieldClass = "min-h-11 w-full min-w-0 rounded-xl border border-[#dfcdfa] px-3.5 text-sm font-medium outline-none focus:border-[#9c64df] focus:ring-4 focus:ring-[#b16bea24] sm:min-h-12 sm:px-4 sm:text-base";

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
  const [processStepIndex, setProcessStepIndex] = useState(0);

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

  function updateProcessStep(nextIndex: number) {
    const normalizedIndex = (nextIndex + processPhoneSlides.length) % processPhoneSlides.length;
    setProcessStepIndex(normalizedIndex);
  }

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
    <main className="min-h-screen overflow-hidden bg-[#fff] text-[#fff8e8]">
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 grid min-h-[66px] grid-cols-[1fr_auto] items-center gap-x-3 border-b border-[#f2c76b3d] bg-[#fff] px-3.5 py-2 opacity-0 shadow-[0_18px_45px_rgba(25,2,8,0.28)] backdrop-blur-[18px] transition duration-300 sm:min-h-[72px] sm:grid-cols-[150px_1fr_180px] sm:gap-3 sm:px-4 lg:min-h-[76px] lg:grid-cols-[220px_minmax(280px,1fr)_220px] lg:gap-[22px] lg:px-[72px]",
          showHeader ? "translate-y-0 opacity-100" : "-translate-y-full"
        ].join(" ")}
      >
        <a className="inline-flex w-fit items-center" href="#top" aria-label="Beauty Summit 2026">
          <img className="block w-[96px] sm:w-[126px] lg:w-[142px]" src="/images/logo_bs.png" alt="Beauty Summit" />
        </a>
        <div className="hidden w-full grid-cols-4 gap-1.5 sm:grid sm:w-[360px] sm:justify-self-center lg:w-[430px] lg:gap-2" aria-label="Đồng hồ đếm ngược Beauty Summit 2026">
          <CountdownItem value={countdown.days} label="Ngày" compact />
          <CountdownItem value={countdown.hours} label="Giờ" compact />
          <CountdownItem value={countdown.minutes} label="Phút" compact />
          <CountdownItem value={countdown.seconds} label="Giây" compact />
        </div>
        <GlowButton className="justify-self-end" label="Mua vé ngay" onClick={openTicketModal} />
      </header>

      <section
        className="relative flex min-h-[640px] flex-col bg-[linear-gradient(90deg,rgba(43,4,10,0.94)_0%,rgba(86,9,22,0.84)_45%,rgba(135,18,35,0.58)_100%),url('/images/banner-web.webp')] bg-cover bg-center px-4 pb-10 pt-4 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-[180px] sm:min-h-[760px] sm:px-6 sm:pb-14 lg:min-h-[92vh] lg:px-[72px] lg:pb-[72px] lg:pt-[22px]"
        id="top"
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          <a className="inline-flex items-center" href="#top" aria-label="Beauty Summit 2026">
            <img className="block w-[118px] sm:w-[150px]" src="/images/logo_bs_white.png" alt="Beauty Summit" />
          </a>
          <GlowButton
            className="min-w-[138px] scale-90 justify-self-end sm:scale-100"
            label="Mua vé ngay"
            onClick={openTicketModal}
          />
        </div>
        <div className="relative z-10 mt-auto w-full max-w-[760px] pt-[70px] lg:pt-[12vh]">
          <p className="mb-4 inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_10px_28px_rgba(255,255,255,0.12)] backdrop-blur-md sm:text-base">Đếm ngược tới</p>
          <h1 className="text-[38px] font-black uppercase leading-[0.96] text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.42)] sm:text-[72px] sm:leading-[0.92] lg:text-[104px]">
            Beauty Summit 2026
          </h1>
          <p className="mt-4 max-w-[640px] text-sm font-medium leading-6 text-[#ffe7c0] sm:mt-6 sm:text-xl sm:leading-7">
            Triển lãm thương mại quốc tế ngành làm đẹp lớn nhất Việt Nam, nơi hội tụ thương hiệu,
            chuyên gia, spa, clinic và cộng đồng kinh doanh làm đẹp toàn quốc.
          </p>
          <div className="my-5 grid w-full max-w-[640px] grid-cols-4 gap-2 sm:my-7 sm:gap-3" aria-label="Đếm ngược sự kiện">
            <HeroCountdownItem value={countdown.days} label="Ngày" />
            <HeroCountdownItem value={countdown.hours} label="Giờ" />
            <HeroCountdownItem value={countdown.minutes} label="Phút" />
            <HeroCountdownItem value={countdown.seconds} label="Giây" />
          </div>
          <ActionButtons align="left" onBuy={openTicketModal} onViewBenefits={scrollToBenefits} />
        </div>
      </section>

      <ImageShowcaseSlider slides={speakerSlides} onBuy={openTicketModal} onViewBenefits={scrollToBenefits} />

      <section className={`${sectionShell} bg-white text-[#121018]`}>
        <div className="mx-auto mb-10 w-full max-w-[980px] text-center">
          <p className="text-sm font-extrabold uppercase text-[#211D51]">Hơn 1000 chủ spa/clinic đã đăng ký tham dự</p>
          <h2 className="mt-2 bg-[linear-gradient(90deg,#5E2493,#F13550)] bg-clip-text text-[28px] font-black uppercase leading-[1.35] text-transparent sm:text-[40px] lg:text-[52px]">
            Họ đến vì điều gì?
          </h2>
        </div>
        <div className="mx-auto grid w-full max-w-[1220px] gap-8 lg:grid-cols-3">
          {benefits.map((item) => (
            <article className="group relative flex min-h-[190px] items-center justify-center rounded-[48px] border-2 border-[#17151e] bg-white px-8 pb-9 pt-12 text-center shadow-[0_18px_42px_rgba(20,16,32,0.06)] transition-shadow duration-300 ease-out hover:shadow-[0_24px_54px_rgba(92,42,156,0.18)]" key={item}>
              <span className="absolute left-1/2 top-0 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#17151e] bg-white transition-colors duration-300 ease-out group-hover:bg-[#ef4266]">
                <BadgeCheck className="h-7 w-7 text-[#17151e] transition-colors duration-300 ease-out group-hover:text-white" strokeWidth={1.9} />
              </span>
              <p className="transform-gpu text-base font-bold leading-7 text-[#17151e] transition-transform duration-300 ease-out group-hover:-rotate-1 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:rotate-0 motion-reduce:group-hover:scale-100 sm:text-lg">{item}</p>
            </article>
          ))}
        </div>
        <ActionButtons className="mt-8" onBuy={openTicketModal} onViewBenefits={scrollToBenefits} />
      </section>

      <section className={`${sectionShell} bg-[#fff] text-[#370912]`} id="benefits">
        <div className={sectionHead}>
          <p className="text-sm font-extrabold uppercase text-[#211D51]">Số lượng vé giới hạn</p>
          <h2 className="mt-2 text-[28px] font-black uppercase leading-[1.35] bg-[linear-gradient(90deg,#5E2493,#F13550)] bg-clip-text text-transparent sm:text-[40px] lg:text-[52px]">
            Đặt mua vé sớm, giá tốt hơn, ưu đãi nhiều hơn
          </h2>
        </div>

        <div className="mx-auto py-4 grid w-full max-w-[1180px] gap-4 lg:grid-cols-3">
          {ticketCards.map((ticket) => (
            <article className={`rounded-[12px] border p-7 shadow-[0_18px_36px_rgba(22,2,7,0.18)] ${ticket.theme.card}`} key={ticket.name}>
              <h3 className={`text-[28px] font-black ${ticket.theme.title}`}>{ticket.name}</h3>
              <p className={`my-3 text-[22px] font-black ${ticket.theme.price}`}>
                {ticket.price} <span className={`text-sm ${ticket.theme.oldPrice}`}>({ticket.oldPrice})</span>
              </p>
              <ul className="list-disc pl-5 marker:text-current">
                {ticket.details.map((detail) => (
                  <li className="mt-2.5 text-sm font-semibold leading-6" key={detail}>{detail}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mx-auto mb-5 w-full max-w-[1120px] text-center text-sm font-extrabold leading-7 text-[#8d1528]">
          Lưu ý quan trọng: mỗi mã vé chỉ được check-in 01 lần duy nhất. Quý khách vui lòng không
          check-in trước thời gian diễn ra sự kiện chính thức để đảm bảo quyền lợi.
        </div>
        <div className="mx-auto w-full max-w-[1180px] overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse bg-[#fff]">
            <thead>
              <tr>
                <th className="border border-[#752f0c2e] bg-[#5E2493] p-4 text-sm uppercase text-[#fff]">Quyền lợi</th>
                {["Gold", "Ruby", "VIP", "V.VIP"].map((tier) => (
                  <th className="border border-[#752f0c2e] bg-[#5E2493] p-4 text-sm uppercase text-[#fff]" key={tier}>{tier}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {benefitRows.map(([label, gold, ruby, vip, vvip]) => (
                <tr key={String(label)}>
                  <td className="border border-[#752f0c2e] p-3 lg:p-4 text-sm font-semibold leading-6 text-[#3d1320]">{label}</td>
                  {[gold, ruby, vip, vvip].map((enabled, index) => (
                    <td className="border border-[#752f0c2e] p-4 text-center text-[28px] font-black text-[#771124]" key={index}>
                      {enabled ? <Check className="mx-auto h-7 w-7" strokeWidth={3} /> : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ActionButtons className="mt-8" onBuy={openTicketModal} onViewBenefits={scrollToBenefits} />
      </section>

      <ImageShowcaseSlider slides={gallerySlides} onBuy={openTicketModal} onViewBenefits={scrollToBenefits} />

      <section className={`${sectionShell} bg-[linear-gradient(180deg,#ffffff,#fff6fb_52%,#f5efff)]`}>
        <div className="mx-auto mb-9 max-w-[980px] text-center">
          <p className="inline-flex rounded-full bg-[#f1e7ff] px-5 py-2 text-sm font-black uppercase tracking-[0.16em] text-[#8b5cf6]">
            Đặc quyền tham dự
          </p>
          <h2 className="mt-4 text-[26px] font-black uppercase leading-[1.35] bg-[linear-gradient(90deg,#5E2493,#F13550)] bg-clip-text text-transparent sm:text-[40px] lg:text-[48px]">
            Quà tặng & trải nghiệm độc quyền vé VIP
          </h2>
        </div>
        <div className="mx-auto grid max-w-[1480px] gap-6 lg:grid-cols-3">
          <GiftCard image="/images/anh-sec-5-ban-ve-24-26-1.webp" title="Hệ thống chiến lược tăng doanh thu & mở rộng quy mô spa" text="Dành riêng cho chủ spa, clinic và nhà quản lý trong ngành làm đẹp." />
          <GiftCard image="/images/anh-ben-phai-moi-2426.webp" title="Bộ quà tặng độc quyền chỉ có tại Beauty Summit 2026" text="Bao gồm túi Tote phiên bản giới hạn và tạp chí xu hướng Beauty Summit." />
          <GiftCard image="/images/banner-dien-gia-tc-19526.webp" title="Private Coaching 1:1" text="20 phút gặp trực tiếp chuyên gia để xác định vấn đề và định hướng giải pháp." />
        </div>
        <div className="mt-8">
          <ActionButtons onBuy={openTicketModal} onViewBenefits={scrollToBenefits} />
        </div>
      </section>

      <section className={`${sectionShell} bg-[linear-gradient(180deg,#ffffff_0%,#fff4fb_48%,#f3edff_100%)]`} id="timeline">
        <div className="mx-auto mb-9 max-w-[980px] text-center">
          <p className="inline-flex rounded-full bg-[#f1e7ff] px-5 py-2 text-sm font-black uppercase tracking-[0.16em] text-[#8b5cf6]">
            Beauty Summit 2026
          </p>
          <h2 className="mt-4 text-[30px] font-black uppercase leading-[1.35] bg-[linear-gradient(90deg,#5E2493,#F13550)] bg-clip-text text-transparent sm:text-[44px] lg:text-[58px]">
            Timeline sự kiện
          </h2>
          <p className="mx-auto mt-4 max-w-[720px] text-base font-semibold leading-7 text-[#5b5178]">
            Hai ngày trải nghiệm hội thảo, triển lãm, giao lưu đại sứ thương hiệu và kết nối cộng đồng ngành làm đẹp.
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-[1180px] gap-5 lg:grid-cols-2">
          <ScheduleCard title="Ngày 1: 19.06.2026" items={dayOne} />
          <ScheduleCard title="Ngày 2: 20.06.2026" items={dayTwo} />
        </div>
        <ActionButtons className="mt-8" onBuy={openTicketModal} onViewBenefits={scrollToBenefits} />
      </section>

      <section className="bg-white px-4 py-8 sm:px-6 lg:px-12" aria-label="Không khí sự kiện">
        <div className="mx-auto grid max-w-[1480px] gap-4 lg:grid-cols-3 lg:grid-rows-[320px_320px_320px]">
          <GalleryImage
            alt="Khách mời Beauty Summit"
            className="lg:row-span-2"
            image="/images/img-1.webp"
          />
          <GalleryImage
            alt="Sân khấu Beauty Summit"
            image="/images/img2.webp"
          />
          <GalleryImage
            alt="Khách tham quan nhận quà tại booth"
            image="/images/img-3.webp"
          />
          <GalleryImage
            alt="Không khí đông đảo tại triển lãm"
            image="/images/img-4.webp"
          />
          <GalleryImage
            alt="Nhóm khách mời với túi quà Beauty Summit"
            image="/images/img-5.webp"
          />
          <GalleryImage
            alt="Khách trải nghiệm sản phẩm tại booth"
            image="/images/img-6.webp"
          />
          <GalleryImage
            alt="Khu vực gian hàng Beauty Summit"
            image="/images/img-7.webp"
          />
          <GalleryImage
            alt="Trải nghiệm dịch vụ chăm sóc sắc đẹp"
            image="/images/img-8.webp"
          />
        </div>
      </section>

      <section className="overflow-hidden bg-[radial-gradient(circle_at_18%_42%,rgba(236,35,133,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fff7fb_100%)] px-4 py-12 sm:px-6 lg:px-[72px] lg:py-20">
        <div className="mx-auto grid w-full max-w-[1320px] items-center gap-10 lg:grid-cols-[430px_1fr] lg:gap-16">
          <PhoneProcessSlider
            activeIndex={processStepIndex}
            onChange={updateProcessStep}
            slides={processPhoneSlides}
          />

          <div className="relative">
            <p className="inline-flex rounded-full bg-[#fde6f4] px-5 py-2 text-sm font-black uppercase tracking-[0.14em] text-[#ec2385]">
              Quy trình tham dự
            </p>
            <h2 className="mt-4 text-[24px] font-black uppercase leading-[1.08] tracking-[0.02em] text-[#202033] sm:text-[36px] lg:text-[46px]">
              Hướng dẫn mua vé
            </h2>

            <div className="relative mt-8 space-y-4">
              <div className="absolute bottom-8 left-6 top-8 w-0.5 bg-[linear-gradient(180deg,#ec2385,#9b22c8)] sm:left-8" />
              {steps.map(([number, title, text], index) => {
                const isActive = index === processStepIndex;

                return (
                  <button
                    className="group relative grid w-full cursor-pointer grid-cols-[48px_1fr] gap-4 text-left sm:grid-cols-[64px_1fr] sm:gap-5"
                    key={number}
                    type="button"
                    onClick={() => updateProcessStep(index)}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span
                      className={[
                        "relative z-10 grid h-12 w-12 place-items-center self-start rounded-full text-xl font-black text-white shadow-[0_12px_24px_rgba(210,22,151,0.34)] transition duration-300 sm:h-16 sm:w-16",
                        isActive
                          ? "bg-[linear-gradient(135deg,#ff238f,#9b22c8)] scale-105"
                          : "bg-[linear-gradient(135deg,#dc1a9a,#b21fca)] group-hover:-translate-y-1"
                      ].join(" ")}
                    >
                      {number}
                    </span>
                    <span
                      className={[
                        "block rounded-2xl border px-5 py-4 shadow-[0_16px_42px_rgba(236,35,133,0.09)] backdrop-blur transition duration-300 sm:px-6",
                        isActive
                          ? "border-[#ec2385]/45 bg-[#fff0f8] shadow-[0_20px_54px_rgba(236,35,133,0.16)]"
                          : "border-[#f8d4ea] bg-white/86 group-hover:border-[#ec2385]/40 group-hover:shadow-[0_20px_54px_rgba(236,35,133,0.14)]"
                      ].join(" ")}
                    >
                      <span className="block text-lg font-black uppercase text-[#eb2385] sm:text-xl">{title}</span>
                      <span className="mt-2 block text-sm font-medium leading-7 text-[#474253] sm:text-base">{text}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 border-l-[3px] border-[#ec2385] bg-[#fff0f8] px-5 py-4 text-sm italic leading-7 text-[#363241] sm:px-6">
              <strong className="font-black uppercase text-[#ec2385]">Lưu ý quan trọng:</strong> Mỗi mã vé chỉ được check-in 01 lần duy nhất. Quý khách vui lòng không check-in trước thời gian diễn ra sự kiện chính thức để đảm bảo quyền lợi của mình.
            </div>

            <ActionButtons align="left" className="mt-8" onBuy={openTicketModal} onViewBenefits={scrollToBenefits} />
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(110deg,#ef4266_0%,#9520a8_100%)] px-4 py-12 sm:px-6 lg:px-[72px] lg:py-14 lg:pb-24">
        <h2 className="text-center text-[30px] font-black uppercase tracking-wide text-white sm:text-[42px] lg:text-[52px]">
          Quy định vé Beauty Summit
        </h2>

        <div className="relative mx-auto mt-9 max-w-[1480px] rounded-2xl bg-[#ffe4ee] px-6 py-7 text-[#33333b] sm:px-9 lg:px-12 lg:py-9 pb-14 lg:pb-14">
          <ul className="space-y-5 text-sm font-bold leading-7 sm:text-base">
            <li className="flex gap-3">
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#ff5b72]" strokeWidth={3} />
              <p>
                Vé là vé điện tử được gửi về zalo của số điện thoại đăng ký sau khi đặt vé thành công.
                <br />
                Mỗi mã vé chỉ dành cho 01 người và 01 lần sử dụng.
              </p>
            </li>
            <li className="flex gap-3">
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#ff5b72]" strokeWidth={3} />
              <p>
                Người mua vé có trách nhiệm tự bảo mật mã vé điện tử của mình.
                <br />
                Trong trường hợp phát sinh nhiều người sử dụng cùng một mã vé, BTC chỉ ghi nhận người check-in đầu tiên là hợp lệ và từ chối giải quyết các trường hợp còn lại.
              </p>
            </li>
            <li className="flex gap-3">
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#ff5b72]" strokeWidth={3} />
              <p>Trẻ em dưới 14 tuổi phải có người lớn (18 tuổi trở lên) đi cùng trong suốt thời gian diễn ra sự kiện.</p>
            </li>
            <li className="flex gap-3">
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#ff5b72]" strokeWidth={3} />
              <p>
                BTC chỉ phân phối vé duy nhất thông qua website chính thức https://beautysummit.vn/dang-ky-mua-ve, link phụ và các trang web ủy quyền. Quý khách vui lòng cảnh giác với những dịch vụ đặt vé không có nguồn gốc rõ ràng và các bên trung gian. BTC sẽ không giải quyết mọi trường hợp tranh chấp vé.
              </p>
            </li>
            <li className="flex gap-3">
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#ff5b72]" strokeWidth={3} />
              <p>
                Vé đã mua KHÔNG ĐƯỢC HOÀN TRẢ trong bất kỳ trường hợp nào.
                <br />
                Việc sử dụng hoặc phân phối vé cho mục đích tiếp thị quảng cáo mà không có sự cho phép của BTC được coi là trái quy định. BTC có quyền thu hồi lại vé và không hoàn tiền.
              </p>
            </li>
            <li className="flex gap-3">
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#ff5b72]" strokeWidth={3} />
              <p>Bằng việc xác nhận mua vé. Người mua đồng ý với tất cả Điều khoản & Điều kiện từ BTC.</p>
            </li>
          </ul>

          <div className="absolute -bottom-10 left-1/2 w-[min(450px,90%)] -translate-x-1/2 rounded-2xl bg-white px-6 py-4 text-center text-[24px] font-black uppercase text-[#d10000] shadow-[0_18px_36px_rgba(81,21,91,0.18)] sm:text-[32px]">
            Hotline: 0971.895.886
          </div>
        </div>
      </section>

      <footer className="bg-[#211D51] px-4 py-12 text-white sm:px-6 lg:px-[72px] lg:py-14">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_0.72fr_1fr] lg:items-start">
          <div>
            <img className="w-[214px] max-w-full" src="/images/logo_bs_white.png" alt="Beauty Summit" />
            <p className="mt-4 max-w-[470px] text-sm font-semibold uppercase leading-7 tracking-wide">
              <strong>Beauty Summit</strong> - Triển lãm thương mại quốc tế ngành làm đẹp lớn nhất Việt Nam
            </p>

            <div className="mt-4">
              <h3 className="text-base font-black text-[#ff4aa0]">Thông tin liên hệ</h3>
              <p className="mt-5 text-base font-black uppercase leading-7">
                Công ty Cổ phần Tập đoàn Hoàng Tú Holdings
              </p>
              <div className="mt-2 space-y-2 text-sm leading-6">
                <p>CS HN: Toà Star Tower - Dương Đình Nghệ, Cầu Giấy, Hà Nội</p>
                <p>CS HCM: 238-242 Nguyễn Oanh, phường 17, Gò Vấp, HCM</p>
                <p>Hotline: 0971.895.886 - 0971.985.886</p>
                <p>Email: beautysummit@hoangtuholdings.com</p>
                <p>Website: beautysummit.vn</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block" />

          <div className="text-center sm:text-left lg:text-center">
            <h3 className="text-base font-black uppercase">Cộng đồng Beauty Summit</h3>
            <p className="mx-auto mt-6 max-w-[420px] text-base font-semibold leading-7">
              Tham gia cộng đồng Beauty Summit để kết nối chuyên sâu với các thương hiệu và chuyên gia uy tín của ngành làm đẹp.
            </p>
            <img
              className="mt-8 w-[208px] max-w-full bg-white p-1 rounded-[8px] mx-auto"
              src="/images/qr-zalo-me-zalo-me-g-alkrun710.webp"
              alt="QR cộng đồng Beauty Summit"
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
      <div className="relative mx-auto aspect-[16/9] lg:aspect-[21/9] max-w-[1800px] overflow-hidden rounded-[14px] bg-[#8d78ff] shadow-[0_24px_70px_rgba(87,61,180,0.18)] sm:rounded-[24px]">
        <div
          key={activeSlide.image}
          className="absolute inset-0 animate-[lp-fade-in_0.55s_ease_both] bg-cover bg-center"
          style={{
            backgroundImage: `url('${activeSlide.image}')`
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,14,75,0.58),rgba(82,42,152,0.16)_44%,rgba(199,94,236,0.08))]" />

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
              index === activeIndex ? "bg-[#ec2385]" : "bg-[#c9c9c9]"
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
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[#ec2385] text-[#ec2385] transition hover:-translate-y-0.5 hover:bg-[#fff0f8]"
          type="button"
          onClick={() => goToSlide(activeIndex - 1)}
          aria-label="Ảnh demo trước"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
        </button>
        <button
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[#ec2385] text-[#ec2385] transition hover:-translate-y-0.5 hover:bg-[#fff0f8]"
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
        <span className="absolute left-5 top-5 rounded-full bg-white/92 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#8b5cf6] shadow-[0_10px_24px_rgba(33,29,81,0.16)]">
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
          <strong className="inline-flex h-fit w-fit rounded-full bg-[#f1e7ff] px-3 py-1 text-sm font-black text-[#8b5cf6]">{time}</strong>
          <p className="font-semibold leading-6 text-[#3b315a]">{text}</p>
        </div>
      ))}
      </div>
    </article>
  );
}
