export const dynamic = "force-dynamic";

export default function ThankYouPage({
  searchParams
}: {
  searchParams: { orderid?: string };
}) {
  const orderId = searchParams.orderid ?? "";

  return (
    <main className="thanks-page">
      <section className="thanks-card">
        <span className="thanks-badge">Thanh toán thành công</span>
        <h1>Cảm ơn bạn đã đăng ký tham dự Beauty Summit 2026</h1>
        <p>
          Hệ thống đã ghi nhận đơn hàng của bạn. Ban Tổ Chức có thể tiếp tục gửi
          vé và thông tin sự kiện qua email/số điện thoại đã đăng ký.
        </p>
        <p>
          Kiểm tra hòm thư email để biết các thông tin chi tiết liên quan đến sự kiện.
        </p>
        {orderId ? (
          <div className="thanks-order">
            Mã đơn hàng: <strong>{orderId}</strong>
          </div>
        ) : null} <br></br>
        <a className="thanks-link" href="https://beautysummit.vn/cam-nang-mini-app-beauty-summit" target="_blank">
          Xem hướng dẫn checkin sự kiện
        </a>
      </section>
    </main>
  );
}
