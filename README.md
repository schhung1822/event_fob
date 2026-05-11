# Beauty Summit Ticketing

Web ban ve duoc rebuild tu `congbanve.php` va `thanhtoan.html` bang Next.js App Router.

## Chuc nang

- Trang ban ve: nhap thong tin, chon hang ve, ap voucher, tao don hang
- Trang thanh toan: hien thi chi tiet don, QR chuyen khoan, copy thong tin, polling trang thai
- Trang cam on sau khi thanh toan
- API routes thay vai tro PHP backend
- Ho tro 2 mode:
  - `DB mode`: doc/ghi bang `ticket`, `voucher`, `orders` qua MySQL
  - `Mock mode`: khong can DB, dung du lieu mau trong bo nho de demo giao dien va flow

## Chay local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Bien moi truong

- `BS_DB_*`: ket noi MySQL. Neu bo trong, app tu dong chay mock mode.
- `BS_REGISTER_WEBHOOK_URL`: webhook gui du lieu dang ky sau khi tao order.
- `BS_CHECK_PAYMENT_URL`: endpoint check thanh toan de trang QR polling.
- `BS_PAYMENT_WEBHOOK_SECRET`: secret cho webhook `POST /api/payment-webhook`.

## Route chinh

- `/`: trang ban ve
- `/thanh-toan?orderid=...`: trang QR thanh toan
- `/trang-cam-on?orderid=...`: trang hoan tat

## Webhook xac nhan thanh toan

```bash
curl -X POST http://localhost:3000/api/payment-webhook \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"ODXXXXXXX\",\"secret\":\"your-secret\"}"
```

Neu app dang chay mock mode, webhook tren se mark don hang thanh `paydone` de ban test duoc flow redirect.
