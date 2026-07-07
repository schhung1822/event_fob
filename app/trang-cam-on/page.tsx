import { getOrderDetail } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

export default async function ThankYouPage({
  searchParams
}: {
  searchParams: { orderid?: string; ordercode?: string };
}) {
  const orderId = (searchParams.ordercode || searchParams.orderid || "").trim();
  const orderDetail = orderId ? await getOrderDetail(orderId) : null;
  const tickets = orderDetail?.records ?? [];
  const latestTicketCode = tickets.at(-1)?.orderCode || orderId;
  const inviteHref = latestTicketCode
    ? `https://thiepmoi.sukien.io/?ordercode=${encodeURIComponent(latestTicketCode)}`
    : "https://thiepmoi.sukien.io/";

  return (
    <main className="thanks-page">
      <section className="thanks-card thanks-card-with-tickets" aria-label="Thanh to&#225;n th&#224;nh c&#244;ng">
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

        <span className="thanks-badge">Thanh to&#225;n th&#224;nh c&#244;ng</span>
        <h1>C&#7843;m &#417;n b&#7841;n &#273;&#227; &#273;&#259;ng k&#253; tham d&#7921; The Future Of Business</h1>
        <p>
          H&#7879; th&#7889;ng &#273;&#227; x&#225;c nh&#7853;n &#273;&#417;n h&#224;ng c&#7911;a b&#7841;n. Vui l&#242;ng l&#432;u m&#227; v&#233; ho&#7863;c m&#7903; QR check-in &#273;&#7875; xu&#7845;t tr&#236;nh t&#7841;i khu v&#7921;c &#273;&#243;n kh&#225;ch.
        </p>

        {orderId ? (
          <div className="thanks-order">
            M&#227; &#273;&#417;n: <strong>{orderDetail?.orderId || orderId}</strong>
          </div>
        ) : null}

        <div className="thanks-divider" aria-hidden="true" />

        <div className="thanks-ticket-section">
          <div className="thanks-ticket-title">Danh s&#225;ch v&#233;</div>
          {tickets.length > 0 ? (
            <div className="thanks-ticket-list">
              {tickets.map((ticket, index) => (
                <div className="thanks-ticket-item" key={`${ticket.orderCode}-${index}`}>
                  <div className="thanks-ticket-info">
                    <span className="thanks-ticket-name">{ticket.className || `Ve ${index + 1}`}</span>
                    <span className="thanks-ticket-code">M&#227; v&#233;: {ticket.orderCode}</span>
                  </div>
                  <a
                    className="thanks-ticket-action"
                    href={`/check-ticket?ordercode=${encodeURIComponent(ticket.orderCode)}`}
                  >
                    Xem QR check-in
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="thanks-ticket-empty">
              Ch&#432;a t&#7843;i &#273;&#432;&#7907;c danh s&#225;ch v&#233;. Vui l&#242;ng ki&#7875;m tra l&#7841;i m&#227; &#273;&#417;n h&#224;ng.
            </div>
          )}
        </div>

        <div className="thanks-actions">
          <a
            className="thanks-link thanks-link-secondary"
            href={inviteHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            T&#7841;o thi&#7879;p m&#7901;i
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