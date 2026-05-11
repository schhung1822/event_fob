import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Beauty Summit 2026 - Đặt vé chính thức",
  description: "Đặt mua vé Beauty Summit 2026 - Sự kiện làm đẹp hàng đầu Việt Nam. Nhanh tay sở hữu vé để trải nghiệm những xu hướng và bí quyết làm đẹp mới nhất từ các chuyên gia hàng đầu trong ngành."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
