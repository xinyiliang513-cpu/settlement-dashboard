import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Settlement Desk | 结算模板助手",
    template: "%s | Settlement Desk",
  },
  description:
    "在浏览器本地将 Moderator 与 Management Excel 数据转换为严格遵循模板的结算工作簿。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Settlement Desk | 结算模板助手",
    description: "按字段名匹配、自动汇总、严格保留 Excel 模板格式。",
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
