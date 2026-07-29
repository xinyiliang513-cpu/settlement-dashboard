import type { Metadata } from "next";
import SettlementDashboard from "@/components/SettlementDashboard";

export const metadata: Metadata = {
  title: "Monthly Details | Settlement Desk",
  description:
    "批量合并 Moderator & QA 原始数据，统一筛选日期并生成 Monthly Details 结算模板。",
};

export default function MonthlyDetailsPage() {
  return <SettlementDashboard mode="monthly" />;
}
