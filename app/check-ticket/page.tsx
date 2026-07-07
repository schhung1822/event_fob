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
        <section className="check-ticket-card" aria-label="V&#233; tham d&#7921;">
          <div className="check-ticket-notes" aria-hidden="true">THE FUTURE OF BUSINESS</div>
          <div className="check-ticket-notes" aria-hidden="true">BUSINESS TICKET</div>
          <div className="check-ticket-notes" aria-hidden="true">VALID PASS</div>

          <div className="check-ticket-header">
            TICKET
            <div className="check-ticket-symbol" aria-hidden="true">#</div>
          </div>

          <div className="check-ticket-body">
            <span className="check-ticket-kicker">The Future Of Business</span>
            <strong>V&#233; tham d&#7921; h&#7907;p l&#7879;</strong>
            <span>Vui l&#242;ng xu&#7845;t tr&#236;nh m&#227; QR t&#7841;i khu v&#7921;c check-in.</span>
          </div>

          <div className="check-ticket-footer">
            <div className="check-ticket-qr-wrap">
              <img
                className="check-ticket-qr"
                src={`https://quickchart.io/qr?text=${encodeURIComponent(ticket.orderCode)}`}
                alt={`QR ma ve ${ticket.orderCode}`}
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
                baseFrequency="0.52"
                type="fractalNoise"
              />
              <feSpecularLighting
                in="noise"
                result="specular"
                lightingColor="#ffffff"
                specularExponent="18"
                specularConstant="0.45"
                surfaceScale="0.1"
              >
                <fePointLight z="190" y="90" x="100" />
              </feSpecularLighting>
              <feComposite result="noise2" operator="in" in="specular" in2="SourceGraphic" />
              <feBlend mode="screen" in2="noise2" in="SourceGraphic" />
            </filter>
          </svg>
        </section>
      ) : (
        <section className="check-ticket-empty" aria-label="V&#233; kh&#244;ng h&#7907;p l&#7879;">
          <div className="check-ticket-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5c.55 0 1 .45 1 1v5a1 1 0 1 1-2 0V8c0-.55.45-1 1-1Zm0 11.1a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" />
            </svg>
          </div>
          <span className="check-ticket-empty-kicker">Kh&#244;ng t&#236;m th&#7845;y v&#233;</span>
          <h1>M&#227; v&#233; kh&#244;ng h&#7907;p l&#7879;</h1>
          <p>
            Vui l&#242;ng ki&#7875;m tra l&#7841;i m&#227; v&#233; ho&#7863;c li&#234;n h&#7879; ban t&#7893; ch&#7913;c &#273;&#7875; &#273;&#432;&#7907;c h&#7895; tr&#7907;.
          </p>
          <a className="check-ticket-empty-link" href="https://smesummit.vn/">
            Quay l&#7841;i trang ch&#7911;
          </a>
        </section>
      )}
    </main>
  );
}