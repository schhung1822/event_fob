"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Check, Loader2, TicketCheck, X } from "lucide-react";

import type { CartTicketInput, PurchaseForm, Ticket } from "@/lib/types";
import {
  fetchPublicIp,
  formatCurrency,
  getCookie,
  getMarketingTracking,
  getTikTokTracking,
  persistMarketingTracking,
  persistTikTokClickId
} from "@/lib/utils";

type Step = "ticket" | "info";

type SingleTicketCheckoutProps = {
  className?: string;
  buttonLabel?: string;
  floating?: boolean;
};

const initialForm: PurchaseForm = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  career: "",
  brand: "",
  hope: ""
};

export function SingleTicketCheckout({
  className = "",
  buttonLabel = "Mua vé ngay",
  floating = true
}: SingleTicketCheckoutProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("ticket");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [form, setForm] = useState<PurchaseForm>(initialForm);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    persistMarketingTracking();
    persistTikTokClickId();
  }, []);

  useEffect(() => {
    if (!open || tickets.length > 0 || loadingTickets) return;

    async function loadTickets() {
      setLoadingTickets(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/tickets", { cache: "no-store" });
        const payload = (await response.json()) as {
          success: boolean;
          data?: Ticket[];
          error?: string;
        };

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || "Không thể tải danh sách vé.");
        }

        setTickets(payload.data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Không thể tải danh sách vé."
        );
      } finally {
        setLoadingTickets(false);
      }
    }

    void loadTickets();
  }, [loadingTickets, open, tickets.length]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.ticketId === selectedTicketId) ?? null,
    [selectedTicketId, tickets]
  );

  const selectedPrice = selectedTicket
    ? selectedTicket.moneySale ?? selectedTicket.money
    : 0;

  function openModal() {
    setStep("ticket");
    setErrorMessage("");
    setOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setOpen(false);
    setErrorMessage("");
  }

  function continueToInfo() {
    setErrorMessage("");

    if (!selectedTicket) {
      setErrorMessage("Vui lòng chọn một hạng vé trước khi tiếp tục.");
      return;
    }

    setStep("info");
  }

  async function submitOrder() {
    setErrorMessage("");

    if (!selectedTicket) {
      setErrorMessage("Vui lòng chọn một hạng vé.");
      setStep("ticket");
      return;
    }

    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.gender) {
      setErrorMessage("Vui lòng điền đầy đủ họ tên, số điện thoại, email và giới tính.");
      return;
    }

    const ticketsPayload: CartTicketInput[] = [
      {
        ticketId: selectedTicket.ticketId,
        name: selectedTicket.name,
        quantity: 1,
        price: selectedPrice
      }
    ];

    setSubmitting(true);

    try {
      const clientIp = await fetchPublicIp();
      const tikTokTracking = getTikTokTracking();
      const marketingTracking = getMarketingTracking();
      const currentUrl = new URL(window.location.href);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          voucherCode: "",
          tickets: ticketsPayload,
          source: window.location.href,
          ref: marketingTracking.ref,
          utmSource: marketingTracking.utmSource,
          utmMedium: marketingTracking.utmMedium,
          utmCampaign: marketingTracking.utmCampaign,
          fbp: getCookie("_fbp"),
          fbc: getCookie("_fbc") || currentUrl.searchParams.get("fbclid") || "",
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
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        className={`stc-trigger ${floating ? "stc-trigger-floating" : "stc-trigger-inline"} ${className}`}
        type="button"
        onClick={openModal}
      >
        <TicketCheck aria-hidden="true" size={20} />
        <span>{buttonLabel}</span>
      </button>

      {open && mounted ? createPortal(
        <div className="stc-backdrop" role="dialog" aria-modal="true">
          <section className="stc-modal" aria-label="Đăng ký mua vé Beauty Summit">
            <button
              className="stc-close"
              type="button"
              onClick={closeModal}
              aria-label="Đóng form đăng ký"
            >
              <X aria-hidden="true" size={20} />
            </button>

            <div className="stc-head">
              <h2>{step === "ticket" ? "Chọn hạng vé" : "Thông tin đăng ký"}</h2>
              <div className="stc-steps" aria-hidden="true">
                <span className="is-active">1</span>
                <i />
                <span className={step === "info" ? "is-active" : ""}>2</span>
              </div>
            </div>

            {step === "ticket" ? (
              <div className="stc-body">
                {loadingTickets ? (
                  <div className="stc-state">
                    <Loader2 className="stc-spin" aria-hidden="true" size={24} />
                    Đang tải danh sách vé...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="stc-error">
                    {errorMessage || "Không có dữ liệu vé. Vui lòng thử lại sau."}
                  </div>
                ) : (
                  <div className="stc-ticket-list">
                    {tickets.map((ticket) => {
                      const active = ticket.ticketId === selectedTicketId;
                      const price = ticket.moneySale ?? ticket.money;

                      return (
                        <button
                          className={`stc-ticket ${active ? "is-selected" : ""}`}
                          key={ticket.ticketId}
                          type="button"
                          onClick={() => setSelectedTicketId(ticket.ticketId)}
                        >
                          {ticket.img ? (
                            <img src={ticket.img} alt={ticket.name} />
                          ) : (
                            <span className="stc-ticket-mark">{ticket.ticketId}</span>
                          )}

                          <span className="stc-ticket-copy">
                            <small>
                              {ticket.moneySale ? (
                                <del>{formatCurrency(ticket.money)}</del>
                              ) : null}
                              {formatCurrency(price)}
                            </small>
                          </span>

                          <span className="stc-radio">
                            {active ? <Check aria-hidden="true" size={16} /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {errorMessage && tickets.length > 0 ? (
                  <div className="stc-error">{errorMessage}</div>
                ) : null}

                <Summary ticket={selectedTicket} total={selectedPrice} />

                <button
                  className="stc-primary"
                  disabled={loadingTickets || !selectedTicket}
                  type="button"
                  onClick={continueToInfo}
                >
                  Tiếp tục đăng ký
                </button>
              </div>
            ) : (
              <div className="stc-body">
                <button className="stc-back" type="button" onClick={() => setStep("ticket")}>
                  <ArrowLeft aria-hidden="true" size={17} />
                  Đổi hạng vé
                </button>

                <div className="stc-form-grid">
                  <label>
                    Họ và tên *
                    <input
                      type="text"
                      value={form.name}
                      placeholder="Nhập họ và tên"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </label>

                  <label>
                    Số điện thoại *
                    <input
                      type="tel"
                      value={form.phone}
                      placeholder="Số điện thoại/Zalo"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>

                  <label>
                    Email *
                    <input
                      type="email"
                      value={form.email}
                      placeholder="Email nhận thông tin vé"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                  </label>

                  <label>
                    Giới tính *
                    <select
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
                  </label>

                  <label>
                    Ngành nghề
                    <input
                      type="text"
                      value={form.career}
                      placeholder="Nhập ngành nghề/lĩnh vực hoạt động"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, career: event.target.value }))
                      }
                    />
                  </label>

                  <label>
                    Doanh nghiệp / Thương hiệu
                    <input
                      type="text"
                      value={form.brand}
                      placeholder="Nhập tên thương hiệu/doanh nghiệp"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, brand: event.target.value }))
                      }
                    />
                  </label>
                </div>

                {errorMessage ? <div className="stc-error">{errorMessage}</div> : null}

                <Summary ticket={selectedTicket} total={selectedPrice} />

                <button
                  className="stc-primary"
                  disabled={submitting}
                  type="button"
                  onClick={() => void submitOrder()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="stc-spin" aria-hidden="true" size={18} />
                      Đang xử lý...
                    </>
                  ) : (
                    "Thanh toán ngay"
                  )}
                </button>

                <p className="stc-note">
                  Bằng việc nhấn thanh toán, bạn xác nhận đã đọc và hiểu chính sách
                  bảo mật dữ liệu cá nhân của The Future Of Business <a href="https://nextgency.vn/chinh-sach-bao-mat">tại đây</a>
                </p>
              </div>
            )}
          </section>
        </div>,
        document.body
      ) : null}
    </>
  );
}

function Summary({ ticket, total }: { ticket: Ticket | null; total: number }) {
  return (
    <div className="stc-summary">
      <div>
        <span>Hạng vé</span>
        <strong>{ticket?.name || "Chưa chọn"}</strong>
      </div>
      <div>
        <span>Số lượng</span>
        <strong>1 vé</strong>
      </div>
      <div className="stc-summary-total">
        <span>Tổng thanh toán</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
    </div>
  );
}