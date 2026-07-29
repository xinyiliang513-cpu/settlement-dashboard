import type { Metadata } from "next";
import SettlementDashboard from "@/components/SettlementDashboard";

export const metadata: Metadata = {
  title: "Non-biliable Invoice | Settlement Desk",
  description:
    "批量合并 Management 原始数据，统一筛选日期并生成 Non-biliable Invoice。",
};

export default function NonBillablePage() {
  return <SettlementDashboard mode="nonbillable" />;
}
