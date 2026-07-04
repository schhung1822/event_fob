export const dynamic = "force-dynamic";

export default function ThankYouPage({
  searchParams
}: {
  searchParams: { orderid?: string; ordercode?: string };
}) {
  const orderCode = (searchParams.ordercode || searchParams.orderid || "").trim();
  const checkTicketHref = orderCode
    ? `/check-ticket?ordercode=${encodeURIComponent(orderCode)}`
    : "/check-ticket";

  return (
    <main className="thanks-page">
      <section className="thanks-card" aria-label="Thanh toán thành công">
        <div className="thanks-glow" aria-hidden="true" />
        <div className="thanks-corner thanks-corner-top" aria-hidden="true" />
        <div className="thanks-corner thanks-corner-bottom" aria-hidden="true" />

        <div className="thanks-icon-wrap" aria-hidden="true">
          <div className="thanks-icon-ring" />
          <div className="thanks-icon-ring thanks-icon-ring-delay" />
          <div className="thanks-icon">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M9.2 16.6 4.9 12.3l-1.4 1.4 5.7 5.7L21 7.6l-1.4-1.4L9.2 16.6Z" />
            </svg>
          </div>
        </div>

        <span className="thanks-badge">Thanh toán thành công</span>
        <h1>Cảm ơn bạn đã đăng ký tham dự The Future Of Business</h1>
        <p>
          Hệ thống đã xác nhận đơn hàng của bạn. Vui lòng lưu mã vé hoặc mở QR check-in
          để xuất trình tại khu vực đón khách.
        </p>

        {orderCode ? (
          <div className="thanks-order">
            Mã vé: <strong>{orderCode}</strong>
          </div>
        ) : null}

        <div className="thanks-divider" aria-hidden="true" />

        <div className="thanks-actions">
          <a className="thanks-link" href={checkTicketHref}>
            Xem QR code check-in
          </a>
          <a
            className="thanks-link thanks-link-secondary"
            href="https://thiepmoi.sukien.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tạo thiệp mời
          </a>
        </div>

        <div className="thanks-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}