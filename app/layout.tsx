import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sukien.eventhub.vn"),
  title: {
    default: "The Future Of Business",
    template: "%s | The Future Of Business"
  },
  description:
    "Đăng ký mua vé The Future Of Business, sự kiện triển lãm, hội thảo và kết nối kinh doanh làm đẹp, spa, clinic và mỹ phẩm.",
  keywords: [
    "The Future Of Business",
    "mua vé The Future Of Business"
  ],
  applicationName: "The Future Of Business",
  authors: [{ name: "The Future Of Business" }],
  creator: "The Future Of Business",
  publisher: "The Future Of Business",
  alternates: {
    canonical: "/dang-ky-mua-ve"
  },
  icons: {
    icon: [
      {
        url: "/images/favicon-bs.webp",
        type: "image/webp"
      }
    ],
    shortcut: "/images/favicon-bs.webp",
    apple: "/images/favicon-bs.webp"
  },
  openGraph: {
    title: "The Future Of Business - Đăng ký mua ve",
    description:
      "Đăng ký mua vé The Future Of Business, gặp gỡ các chuyên gia đầu ngành.",
    url: "/dang-ky-mua-ve",
    siteName: "The Future Of Business",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/images/banner-kim-bum-dai-su-thuong-hieu-bs-26-new_1.webp",
        width: 1200,
        height: 630,
        alt: "The Future Of Business"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "The Future Of Business - Đăng ký mua vé",
    description:
      "Đăng ký mua vé The Future Of Business, Sự kiện kết nối kinh doanh nghành làm đẹp.",
    images: ["/images/banner-kim-bum-dai-su-thuong-hieu-bs-26-new_1.webp"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
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
