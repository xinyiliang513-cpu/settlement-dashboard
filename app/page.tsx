import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  LockKeyhole,
} from "lucide-react";

export default function Home() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">AP</span>
          <span>
            <strong>Settlement Desk</strong>
            <small>结算模板助手</small>
          </span>
        </div>
        <div className="privacy-chip">
          <LockKeyhole size={14} />
          浏览器本地处理
        </div>
      </header>

      <section className="landing-hero">
        <p className="eyebrow">
          <span />
          TWO INDEPENDENT CONVERTERS
        </p>
        <h1>两个独立的 Excel 转换接口</h1>
        <p>
          两个入口互不混用：Moderator 只对应 Monthly Details，Management
          只对应 Non-biliable。每个入口均可一次上传多个字段顺序不同的文件，
          再统一筛选结算周期并导出一份结果。
        </p>
      </section>

      <section className="entry-grid">
        <article className="entry-card entry-card--lime">
          <div className="entry-icon">
            <FileSpreadsheet size={28} />
          </div>
          <span className="entry-kicker">MODERATOR SOURCE</span>
          <h2>Moderator → Monthly Details</h2>
          <p>
            批量接收 Moderator 原始表，按字段名合并并生成一份 Monthly
            Details。
          </p>
          <ul>
            <li>
              <CheckCircle2 size={15} /> 36 列模板结构
            </li>
            <li>
              <CheckCircle2 size={15} /> 空映射列原样保留
            </li>
            <li>
              <CheckCircle2 size={15} /> 支持结算周期筛选
            </li>
            <li>
              <CheckCircle2 size={15} /> 多文件字段乱序匹配
            </li>
          </ul>
          <Link className="entry-action" href="/monthly-details">
            打开 Monthly Details 接口 <ArrowRight size={18} />
          </Link>
        </article>

        <article className="entry-card entry-card--orange">
          <div className="entry-icon">
            <FileSpreadsheet size={28} />
          </div>
          <span className="entry-kicker">MANAGEMENT SOURCE</span>
          <h2>Management → Non-biliable</h2>
          <p>
            跨多个 Management 文件统一筛选，再按 Project、PM、Language
            和 Role 自动汇总工作天数与工时。
          </p>
          <ul>
            <li>
              <CheckCircle2 size={15} /> 跨月份自动合并
            </li>
            <li>
              <CheckCircle2 size={15} /> 严格遵循模板格式
            </li>
            <li>
              <CheckCircle2 size={15} /> 周期内工时重新汇总
            </li>
            <li>
              <CheckCircle2 size={15} /> 一次筛选所有 PM
            </li>
          </ul>
          <Link className="entry-action" href="/non-billable">
            打开 Non-biliable 接口 <ArrowRight size={18} />
          </Link>
        </article>
      </section>

      <footer>
        <span>Settlement Desk · Template-safe Excel conversion</span>
        <span>
          <LockKeyhole size={13} />
          数据不会离开你的浏览器
        </span>
      </footer>
    </main>
  );
}
