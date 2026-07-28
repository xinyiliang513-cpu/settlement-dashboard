import type { Metadata } from "next";
import SettlementDashboard from "@/components/SettlementDashboard";

export const metadata: Metadata = {
  title: "Monthly Details | Settlement Desk",
  description: "将 Moderator & QA 原始数据转换为 Monthly Details 结算模板。",
};

export default function MonthlyDetailsPage() {
  return <SettlementDashboard mode="monthly" />;
}
