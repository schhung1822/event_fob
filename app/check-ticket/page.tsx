import { getPaidTicketByOrderCode } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

type CheckTicketPageProps = {
  searchParams: {
    ordercode?: string;
    orderocde?: string;
  };
};

export default async function CheckTicketPage({ searchParams }: CheckTicketPageProps) {
  const orderCode = (searchParams.ordercode || searchParams.orderocde || "").trim();
  const ticket = await getPaidTicketByOrderCode(orderCode);

  return (
    <main className="check-ticket-page">
      {ticket ? (
        <section className="check-ticket-card" aria-label="Vé tham dự">
          <div className="check-ticket-notes" aria-hidden="true">THE FUTURE OF BUSINESS</div>
          <div className="check-ticket-notes" aria-hidden="true">BUSINESS TICKET</div>
          <div className="check-ticket-notes" aria-hidden="true">VALID PASS</div>

          <div className="check-ticket-header">
            TICKET
            <div className="check-ticket-symbol" aria-hidden="true">#</div>
          </div>

          <div className="check-ticket-body">
            <span className="check-ticket-kicker">The Future Of Business</span>
            <strong>Vé tham dự hợp lệ</strong>
            <span>Vui lòng xuất trình mã QR tại khu vực check-in.</span>
          </div>

          <div className="check-ticket-footer">
            <div className="check-ticket-qr-wrap">
              <img
                className="check-ticket-qr"
                src={`https://quickchart.io/qr?text=${encodeURIComponent(ticket.orderCode)}`}
                alt={`QR mã vé ${ticket.orderCode}`}
              />
            </div>
            <div className="check-ticket-code">{ticket.orderCode}</div>
          </div>

          <div className="check-ticket-bg check-ticket-holographic" />
          <svg className="check-ticket-filter" aria-hidden="true">
            <filter id="check-ticket-bump">
              <feTurbulence
                result="noise"
                numOctaves="3"
                baseFrequency="0.7"
                type="fractalNoise"
              />
              <feSpecularLighting
                in="noise"
                result="specular"
                lightingColor="#fffffc"
                specularExponent="25"
                specularConstant="0.8"
                surfaceScale="0.15"
              >
                <fePointLight z="210" y="100" x="100" />
              </feSpecularLighting>
              <feComposite result="noise2" operator="in" in="specular" in2="SourceGraphic" />
              <feBlend mode="screen" in2="noise2" in="SourceGraphic" />
            </filter>
          </svg>
        </section>
      ) : (
        <section className="check-ticket-empty">
          <h1>Mã vé không hợp lệ</h1>
          <p>Vui lòng kiểm tra lại mã vé hoặc đăng ký vé <a href="/">tại đây</a></p>
        </section>
      )}
    </main>
  );
}