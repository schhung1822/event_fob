"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { OrderDetail } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type PaymentPageProps = {
  orderId: string;
  bankName: string;
  bankAccount: string;
  bankOwner: string;
  qrBase: string;
};

const PAYMENT_TIMEOUT_SECONDS = 15 * 60;
const REGISTER_URL = "https://smesummit.vn/";

function normalizeOrderStatus(status?: string) {
  return status?.trim().toLowerCase() || "";
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function PaymentPage({
  orderId,
  bankName,
  bankAccount,
  bankOwner,
  qrBase
}: PaymentPageProps) {
  const router = useRouter();
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manualChecking, setManualChecking] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(PAYMENT_TIMEOUT_SECONDS);
  const [paymentExpired, setPaymentExpired] = useState(false);

  useEffect(() => {
    if (!orderDetail || paymentExpired) return;

    const intervalId = window.setInterval(() => {
      void (async () => {
        try {
          const response = await fetch(
            `/api/orders/${encodeURIComponent(orderId)}/payment-status`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ manual: false })
            }
          );

          const payload = (await response.json()) as {
            success: boolean;
            data?: { status: "pending" | "paydone" };
          };

          if (response.ok && payload.success && payload.data?.status === "paydone") {
            router.push(`/trang-cam-on?ordercode=${encodeURIComponent(orderId)}`);
          }
        } catch {
          return;
        }
      })();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [orderDetail, orderId, paymentExpired, router]);

  useEffect(() => {
    if (!orderDetail) return;

    const orderStatus = normalizeOrderStatus(orderDetail.status);
    if (orderStatus === "paydone") {
      router.push(`/trang-cam-on?ordercode=${encodeURIComponent(orderId)}`);
      return;
    }

    if (orderStatus === "expired") {
      setPaymentExpired(true);
      setRemainingSeconds(0);
      return;
    }

    setPaymentExpired(false);
    setRemainingSeconds(PAYMENT_TIMEOUT_SECONDS);
  }, [orderDetail, orderId, router]);

  useEffect(() => {
    if (!orderDetail || paymentExpired) return;

    const timerId = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          setPaymentExpired(true);
          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [orderDetail, paymentExpired]);

  useEffect(() => {
    async function loadOrderDetail() {
      if (!orderId) {
        setError("Không tìm thấy mã đơn hàng trên URL.");
        setLoading(false);
        return;
      }

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
          throw new Error(payload.error || "Không tải được dữ liệu đơn hàng.");
        }

        setOrderDetail(payload.data);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Không tải được dữ liệu đơn hàng."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadOrderDetail();
  }, [orderId]);
  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      window.alert(`Đã sao chép: ${text}`);
    } catch {
      window.alert("Không thể sao chép");
    }
  }

  function downloadQr() {
    if (!orderDetail || paymentExpired) return;
    const link = document.createElement("a");
    link.href = `${qrBase}?acc=${encodeURIComponent(
      bankAccount
    )}&bank=${encodeURIComponent(bankName)}&amount=${orderDetail.totalMoney}&des=${encodeURIComponent(
      orderDetail.transferContent
    )}`;
    link.download = "qr-thanh-toan.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function checkPaymentStatus(manual: boolean) {
    if (!orderId) return false;

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}/payment-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ manual })
        }
      );

      const payload = (await response.json()) as {
        success: boolean;
        data?: { status: "pending" | "paydone" };
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Không thể kiểm tra được trạng thái thanh toán.");
      }

      if (payload.data.status === "paydone") {
        router.push(`/trang-cam-on?ordercode=${encodeURIComponent(orderId)}`);
        return true;
      }

      if (manual) {
        window.alert(
          "Hệ thống chưa ghi nhận được thanh toán. Vui lòng đợi thêm trong giây lát!"
        );
      }
    } catch {
      if (manual) {
        window.alert("Có lỗi xảy ra khi kiểm tra. Vui lòng thử lại sau.");
      }
    }

    return false;
  }

  async function confirmTransferred() {
    setManualChecking(true);
    await checkPaymentStatus(true);
    setManualChecking(false);
  }

  const groupedTickets = orderDetail?.records.reduce<
    Record<string, { name: string; quantity: number; totalPrice: number }>
  >((groups, record, index) => {
    const ticketName = record.className || `Hang ve ${index + 1}`;
    if (!groups[ticketName]) {
      groups[ticketName] = {
        name: ticketName,
        quantity: 0,
        totalPrice: 0
      };
    }

    groups[ticketName].quantity += 1;
    groups[ticketName].totalPrice += record.money;

    return groups;
  }, {});

  return (
    <main className="payment-shell">
      <div className="page-wrap">
        <div className="page-header">
          <span className="text-[0.7rem] font-semibold uppercase text-white/70">The Future of Business 2026</span><br />
          {orderId ? `Thanh toán đơn ${orderId}` : "Thanh toán đơn hàng"}
        </div>

        <div className="page-content-2" id="app">
          {loading ? (
            <div className="loading">Đang tải thông tin đơn hàng...</div>
          ) : error ? (
            <div className="error-box">{error}</div>
          ) : !orderDetail ? (
            <div className="empty-box">Không có dữ liệu đơn hàng.</div>
          ) : paymentExpired ? (
            <PaymentExpiredNotice orderId={orderDetail.orderId || orderId} />
          ) : (
            <>
              <PaymentCountdown remainingSeconds={remainingSeconds} />
              <section className="cardpay payment-order-card">
                <div className="cardpay-title">Thông tin đơn hàng</div>

                <div className="info-grid">
                  <div className="label">Khách hàng</div>
                  <div className="value">{orderDetail.customerName}</div>

                  <div className="label">Điện thoại</div>
                  <div className="value">{orderDetail.phone}</div>

                  <div className="label">Email</div>
                  <div className="value">{orderDetail.email}</div>

                  <div className="label">Mã đơn hàng</div>
                  <div className="value">{orderDetail.orderId}</div>
                </div>

                <div className="divider" />

                <div className="ticket-list">
                  {groupedTickets
                    ? Object.values(groupedTickets).map((ticket) => (
                        <div className="ticket-item" key={ticket.name}>
                          <div className="ticket-name">
                            {ticket.name}
                            <span className="ticket-qty">x{ticket.quantity}</span>
                          </div>
                          <div className="ticket-price">
                            {formatCurrency(ticket.totalPrice)}
                          </div>
                        </div>
                      ))
                    : null}
                </div>

                <div className="total-box">
                  <div className="total-label">Tổng thanh toán</div>
                  <div className="total-value">
                    {formatCurrency(orderDetail.totalMoney)}
                  </div>
                </div>
                <PaymentNotice className="payment-alert-desktop" />
              </section>

              <section className="cardpay payment-bank-card">
                <div className="cardpay-title">Thông tin chuyển khoản</div>

                <div className="pay-grid payment-bank-info">
                  <div className="label">Ngân hàng</div>
                  <div className="value">{bankName}</div>
                  <div />

                  <div className="label">Số tài khoản</div>
                  <button
                    className="value copy-value"
                    type="button"
                    onClick={() => void copyText(bankAccount)}
                  >
                    {bankAccount}
                  </button>
                  <div />

                  <div className="label">Chủ tài khoản</div>
                  <div className="value">{bankOwner}</div>
                  <div />

                  <div className="label">Nội dung CK</div>
                  <button
                    className="value copy-value"
                    type="button"
                    onClick={() => void copyText(orderDetail.transferContent)}
                  >
                    {orderDetail.transferContent}
                  </button>
                  <div />
                </div>

                <div className="divider payment-bank-divider" />

                <div className="qr-box payment-qr-box">
                  <img
                    alt="QR thanh toán"
                    src={`${qrBase}?acc=${encodeURIComponent(
                      bankAccount
                    )}&bank=${encodeURIComponent(
                      bankName
                    )}&amount=${orderDetail.totalMoney}&des=${encodeURIComponent(
                      orderDetail.transferContent
                    )}`}
                  />
                </div>

                <PaymentNotice className="payment-alert-mobile" />

                <div className="btn-row payment-actions">
                  <button className="btn btn-primary" type="button" onClick={downloadQr}>
                    Tải ảnh QR
                  </button>
                  <button
                    className="btn btn-outline"
                    disabled={manualChecking}
                    type="button"
                    onClick={() => void confirmTransferred()}
                  >
                    {manualChecking ? "Đang kiểm tra..." : "Đã chuyển khoản"}
                  </button>
                </div>

                <div className="status-text payment-status-text">
                  Sau khi hệ thống xác nhận thanh toán, bạn sẽ được chuyển tới trang
                  cảm ơn tự động.
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      <section className="payment-contact" aria-label="Thông tin liên hệ Beauty Summit">

        <h2 className="payment-contact-title">The Future Of Business</h2>

        <div className="payment-contact-lines">
          <p>Email: <a href="mailto:event@smesummit.vn">event@smesummit.vn</a></p>
          <p>Website: <a href="https://smesummit.vn/">smesummit.vn</a></p>
          <p>Hotline/Zalo: <a href="tel:0901312342">090 131 2342</a> - <a href="tel:0984845490">098 484 5490</a></p>
        </div>
      </section>
    </main>
  );
}
function PaymentCountdown({ remainingSeconds }: { remainingSeconds: number }) {
  return (
    <div className="payment-countdown" role="status">
      <span>Thời gian thanh toán còn lại</span>
      <strong>{formatCountdown(remainingSeconds)}</strong>
    </div>
  );
}

function PaymentExpiredNotice({ orderId }: { orderId: string }) {
  return (
    <section className="payment-expired-card">
      <div className="cardpay-title">Đơn hàng đã quá thời gian thanh toán</div>
      <p>
        Đơn hàng {orderId} đã quá thời gian thanh toán. Nếu vẫn có nhu cầu mua vé,
        vui lòng click vào nút đăng ký vé để đăng ký vé mới.
      </p>
      <a className="btn btn-primary payment-register-link" href={REGISTER_URL}>
        Đăng ký vé
      </a>
    </section>
  );
}

function PaymentNotice({ className = "" }: { className?: string }) {
  return (
    <div className={`alert-box ${className}`}>
      <strong>Lưu ý:</strong> Quý khách vui lòng quét mã QR để thông tin được nhập tự động chính xác.
      Nếu chuyển khoản thủ công, xin lưu ý nhập đúng nội dung chuyển khoản để hệ thống ghi nhận và gửi vé.
    </div>
  );
}