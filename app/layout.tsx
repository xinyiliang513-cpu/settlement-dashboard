import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Settlement Desk | 结算模板助手",
    template: "%s | Settlement Desk",
  },
  description:
    "两个独立转换接口：Moderator 转 Monthly Details，Management 转 Non-biliable Invoice。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Settlement Desk | 结算模板助手",
    description:
      "Moderator 与 Management 分别进入独立接口，结果可复制或下载 Excel。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
