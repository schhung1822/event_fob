"use client";

import { useEffect, useState } from "react";

import { careerOptions, hopeOptions } from "@/lib/constants";
import { calculateCartSummary } from "@/lib/pricing";
import type {
  CartTicketInput,
  PurchaseForm,
  Ticket,
  ValidatedVoucher
} from "@/lib/types";
import {
  clamp,
  fetchPublicIp,
  formatCurrency,
  getCookie,
  getTikTokTracking,
  persistTikTokClickId,
  setCookie
} from "@/lib/utils";

const initialForm: PurchaseForm = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  career: "",
  hope: ""
};

const benefitColumns = ["GOLD", "RUBY", "VIP", "V.VIP"] as const;

const benefitRows = [
  {
    label: "Gặp gỡ giao lưu nam diễn viên HÀN QUỐC KIM BUM",
    tiers: ["GOLD", "RUBY", "VIP", "V.VIP"]
  },
  {
    label: "Tham quan toàn bộ khu booth, trải nghiệm sản phẩm",
    tiers: ["GOLD", "RUBY", "VIP", "V.VIP"]
  },
  {
    label: "Cơ hội nhận quà tặng, VOUCHER LÊN TỚI 30% TỪ HƠN 200 BRAND CHÍNH HÃNG",
    tiers: ["GOLD", "RUBY", "VIP", "V.VIP"]
  },
  {
    label: "Tham gia các hoạt động sân khấu theo lịch BTC",
    tiers: ["GOLD", "RUBY", "VIP", "V.VIP"]
  },
  {
    label: "VOUCHER GIẢM 35% khi mua \"6 CẨM NANG KINH DOANH THỰC CHIẾN CHO NGÀNH LÀM ĐẸP\"",
    tiers: ["GOLD", "RUBY"]
  },
  {
    label: "Bộ sách \"6 CẨM NANG KINH DOANH THỰC CHIẾN CHO NGÀNH LÀM ĐẸP\" trị giá 1.200.000 VNĐ",
    tiers: ["VIP", "V.VIP"]
  },
  {
    label: "Tham dự đồng thời Hội thảo chuyên sâu về Da liễu và Hội thảo Marketing",
    tiers: ["RUBY", "VIP", "V.VIP"]
  },
  {
    label: "Quà tặng túi Tote phiên bản giới hạn từ BTC",
    tiers: ["VIP", "V.VIP"]
  },
  {
    label: "Tạp chí xu hướng BEAUTY SUMMIT 2026 - phiên bản giới hạn",
    tiers: ["VIP", "V.VIP"]
  },
  {
    label: "01 suất PRIVATE COACHING 1:1 theo slot giới hạn của BTC để trao đổi trực tiếp, nhận tư vấn cá nhân hoá từ chuyên gia.",
    tiers: ["VIP", "V.VIP"]
  },
  {
    label: "Tham dự HỘI THẢO chuyên đề \"Phát triển thị trường tiêu dùng trong nước đối với ngành hàng hoá mỹ phẩm\", được hỗ trợ chuyên môn bởi Cục Quản lý và Phát triển thị trường trong nước, đơn vị tổ chức: Hoàng Tử Holdings.",
    tiers: ["V.VIP"]
  },
  {
    label: "Tham gia LUXURY GALA DINNER, gặp gỡ trực tiếp ĐẠI SỨ THƯƠNG HIỆU KIM BUM - kết nối cùng dàn diễn giả, KOLs và CEO của nhiều thương hiệu danh tiếng.",
    tiers: ["V.VIP"]
  }
];

export function TicketPurchasePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [form, setForm] = useState<PurchaseForm>(initialForm);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<ValidatedVoucher | null>(null);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [voucherMessageType, setVoucherMessageType] = useState<"ok" | "err" | "">(
    ""
  );
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentQueryString, setCurrentQueryString] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    setCurrentQueryString(url.search);
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

  const summary = calculateCartSummary(selectedTickets, voucher);

  function updateQuantity(ticketId: string, nextValue: number) {
    setQuantities((current) => ({
      ...current,
      [ticketId]: clamp(nextValue, 0, 20)
    }));
  }

  function buildLinkWithCurrentQuery(targetUrl: string) {
    if (!targetUrl) return "#";

    try {
      const url = new URL(
        targetUrl,
        typeof window !== "undefined" ? window.location.origin : undefined
      );
      const currentParams = new URLSearchParams(currentQueryString);
      const keys = new Set<string>();

      currentParams.forEach((_value, key) => {
        keys.add(key);
      });

      keys.forEach((key) => {
        url.searchParams.delete(key);
      });

      currentParams.forEach((value, key) => {
        url.searchParams.append(key, value);
      });

      return url.toString();
    } catch {
      return targetUrl;
    }
  }

  async function handleApplyVoucher() {
    const code = voucherInput.trim();
    if (!code) {
      setVoucher(null);
      setVoucherMessage("Vui lòng nhập mã giảm giá.");
      setVoucherMessageType("err");
      return;
    }

    setVoucherLoading(true);
    setVoucherMessage("");
    setVoucherMessageType("");

    try {
      const response = await fetch("/api/voucher/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ voucher: code })
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: ValidatedVoucher;
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Mã giảm giá không hợp lệ.");
      }

      setVoucher(payload.data);
      const label =
        payload.data.classy === "money"
          ? `Giảm ${formatCurrency(payload.data.money ?? 0)}`
          : `Giảm ${payload.data.rate ?? 0}%`;

      setVoucherMessage(
        payload.data.class ? `${label} (vé ${payload.data.class})` : label
      );
      setVoucherMessageType("ok");
    } catch (error) {
      setVoucher(null);
      setVoucherMessage(
        error instanceof Error ? error.message : "Mã giảm giá không hợp lệ."
      );
      setVoucherMessageType("err");
    } finally {
      setVoucherLoading(false);
    }
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
          voucherCode: voucher?.voucher || "",
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
      return;
    }
  }

  return (
    <main className="page-shell">
      <div className="bsp" id="bspW">
        <header className="bsp-hero">
          <h1 className="bsp-hero-title">
            <span>ĐĂNG KÝ THAM DỰ</span>
            <span>BEAUTY SUMMIT 2026</span>
          </h1>
          <div className="bsp-hero-line" />
          <div className="bsp-backup-links">
            <a
              className="bsp-backup-link"
              href={buildLinkWithCurrentQuery(
                process.env.NEXT_PUBLIC_PRIMARY_LINK ||
                  "https://beautysummit.vn/dang-ky-mua-ve"
              )}
            >
              Link đăng ký chính
            </a>
            <a
              className="bsp-backup-link"
              href={buildLinkWithCurrentQuery(
                process.env.NEXT_PUBLIC_BACKUP_LINK_1 ||
                  process.env.NEXT_PUBLIC_BACKUP_LINK_2 ||
                  "https://beautysummit.activate.vn/"
              )}
            >
              Link dự phòng 2
            </a>
          </div>
        </header>
        {loadingTickets ? (
          <div className="bsp-de">
            <p>Đang tải thông tin vé...</p>
            <p>Vui lòng đợi trong giây lát.</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bsp-de">
            <p>Không thể tải thông tin vé.</p>
            <p>{errorMessage || "Vui lòng thử lại sau hoặc liên hệ Ban Tổ Chức."}</p>
          </div>
        ) : (
          <>
            {errorMessage ? <div className="bsp-err show">{errorMessage}</div> : null}

            <div className="bsp-g">
              <section className="bsp-c">
                <div className="bsp-ct">Thông tin đăng ký</div>

                <div className="bsp-f">
                  <label className="bsp-lb">
                    Họ và tên <span className="bsp-rq">*</span>
                  </label>
                  <input
                    className="bsp-in"
                    type="text"
                    placeholder="Họ và tên"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </div>

                <div className="bsp-f">
                  <label className="bsp-lb">
                    Số điện thoại <span className="bsp-rq">*</span>
                  </label>
                  <input
                    className="bsp-in"
                    type="tel"
                    placeholder="Số điện thoại đăng ký Zalo"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                  />
                </div>

                <div className="bsp-f">
                  <label className="bsp-lb">
                    Email <span className="bsp-rq">*</span>
                  </label>
                  <input
                    className="bsp-in"
                    type="email"
                    placeholder="Email nhận thông tin"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </div>

                <div className="bsp-f">
                  <label className="bsp-lb">
                    Giới tính <span className="bsp-rq">*</span>
                  </label>
                  <select
                    className="bsp-sl"
                    value={form.gender}
                    onChange={(event) =>
                      setForm((current) => ({
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
                </div>

                <div className="bsp-sep" />

                <div className="bsp-f">
                  <label className="bsp-lb">Bạn là</label>
                  <div className="bsp-rs">
                    {careerOptions.map((option) => (
                      <label className="bsp-rd" key={option}>
                        <input
                          checked={form.career === option}
                          name="bs_career"
                          type="radio"
                          value={option}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              career: event.target.value
                            }))
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bsp-sep" />

                <div className="bsp-f">
                  <label className="bsp-lb">Bạn mong đợi gì ở Beauty Summit</label>
                  <div className="bsp-rs">
                    {hopeOptions.map((option) => (
                      <label className="bsp-rd" key={option}>
                        <input
                          checked={form.hope === option}
                          name="bs_hope"
                          type="radio"
                          value={option}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              hope: event.target.value
                            }))
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section className="bsp-c">
                <div className="bsp-ct">Chọn vé & Thanh toán</div>

                <div className="bsp-tl" id="bsTL">
                  {tickets.map((ticket) => {
                    const currentQuantity = quantities[ticket.ticketId] ?? 0;
                    const currentPrice = ticket.moneySale ?? ticket.money;
                    return (
                      <article
                        className={`bsp-tk ${currentQuantity > 0 ? "on" : ""}`}
                        key={ticket.ticketId}
                      >
                        <div className="bsp-tk-bd">
                          {ticket.img ? (
                            <div className="bsp-tk-img-wrap">
                              <img
                                alt={ticket.name}
                                className="bsp-tk-img"
                                src={ticket.img}
                              />
                            </div>
                          ) : (
                            <div className="bsp-tk-avatar">{ticket.ticketId}</div>
                          )}

                          <div>
                            <div className="bsp-tk-nm">{ticket.name}</div>
                            <div className="bsp-tk-pr">
                              {ticket.moneySale ? (
                                <span className="bsp-tk-old">
                                  {formatCurrency(ticket.money)}
                                </span>
                              ) : null}
                              {formatCurrency(currentPrice)}
                            </div>
                          </div>
                        </div>

                        <div className="bsp-q">
                          <button
                            className="bsp-qb"
                            type="button"
                            onClick={() =>
                              updateQuantity(ticket.ticketId, currentQuantity - 1)
                            }
                          >
                            -
                          </button>
                          <input
                            className="bsp-qv"
                            readOnly
                            type="number"
                            value={currentQuantity}
                          />
                          <button
                            className="bsp-qb"
                            type="button"
                            onClick={() =>
                              updateQuantity(ticket.ticketId, currentQuantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="bsp-f">
                  <label className="bsp-lb">Mã giảm giá (nếu có)</label>
                  <div className="bsp-vw">
                    <input
                      className="bsp-vi"
                      placeholder="Nhập mã giảm giá"
                      type="text"
                      value={voucherInput}
                      onChange={(event) =>
                        setVoucherInput(event.target.value.toUpperCase())
                      }
                    />
                    <button
                      className="bsp-vb"
                      disabled={voucherLoading}
                      type="button"
                      onClick={() => void handleApplyVoucher()}
                    >
                      {voucherLoading ? "Đang kiểm tra..." : "Áp dụng"}
                    </button>
                  </div>
                  <div className={`bsp-vm ${voucherMessageType}`}>
                    {voucherMessage}
                  </div>
                </div>

                <div className="bsp-sm">
                  <div className="bsp-sr">
                    <span>Tạm tính</span>
                    <span>{formatCurrency(summary.subtotal)}</span>
                  </div>

                  {summary.discount > 0 ? (
                    <div className="bsp-sr dc">
                      <span>Giảm giá</span>
                      <span>-{formatCurrency(summary.discount)}</span>
                    </div>
                  ) : null}

                  <div className="bsp-sr tt">
                    <span>Tổng thanh toán</span>
                    <span>{formatCurrency(summary.total)}</span>
                  </div>
                </div>

                <button
                  className="bsp-pay"
                  disabled={selectedTickets.length === 0 || submitLoading}
                  type="button"
                  onClick={() => void handleSubmitOrder()}
                >
                  <span>{submitLoading ? "Đang xử lý..." : "Thanh toán ngay"}</span>
                </button>

                <p className="note-dang-ky">
                  Bằng việc nhấn nút thanh toán, bạn xác nhận đã đọc và hiểu về chính
                  sách bảo mật dữ liệu cá nhân của Beauty Summit.{" "}
                  <a
                    href="https://beautysummit.vn/chinh-sach-bao-mat-thong-tin"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Tại đây
                  </a>
                </p>

              </section>
            </div>

            <section className="bsp-benefits">
              <div className="bsp-benefits-head">
                <h2 className="bsp-benefits-title">
                  <span>SỐ LƯỢNG VÉ GIỚI HẠN - ĐẶT MUA VÉ SỚM</span>
                  <span>GIÁ TỐT HƠN - ƯU ĐÃI NHIỀU HƠN</span>
                </h2>
                <p className="bsp-benefits-note">
                  <span>LƯU Ý QUAN TRỌNG:</span>{" "}
                  Mỗi mã vé chỉ được check-in 01 lần duy nhất. Quý khách vui lòng
                  không check-in trước thời gian diễn ra sự kiện chính thức để đảm
                  bảo quyền lợi của mình.
                </p>
              </div>

              <div className="bsp-benefits-table-wrap">
                <table className="bsp-benefits-table">
                  <thead>
                    <tr>
                      <th>QUYỀN LỢI</th>
                      {benefitColumns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {benefitRows.map((row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        {benefitColumns.map((column) => (
                          <td key={`${row.label}-${column}`}>
                            {row.tiers.includes(column) ? (
                              <span className="bsp-benefits-check">✓</span>
                            ) : null}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {submitLoading ? (
              <div className="bsp-ov show">
                <div className="bsp-sp" />
                <div className="bsp-st">Đang xử lý đơn hàng...</div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
