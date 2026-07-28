import type { Metadata } from "next";
import SettlementDashboard from "@/components/SettlementDashboard";

export const metadata: Metadata = {
  title: "Non-billable Invoice | Settlement Desk",
  description: "汇总 Management 原始数据并生成 Non-billable Invoice 结算模板。",
};

export default function NonBillablePage() {
  return <SettlementDashboard mode="nonbillable" />;
}
