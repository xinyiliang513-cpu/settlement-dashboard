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
          只对应 Non-biliable。上传后可选择结算周期，再复制结果或下载对应
          Excel。
        </p>
      </section>

      <section className="entry-grid">
        <article className="entry-card entry-card--lime">
          <div className="entry-icon">
            <FileSpreadsheet size={28} />
          </div>
          <span className="entry-kicker">MODERATOR SOURCE</span>
          <h2>Moderator → Monthly Details</h2>
          <p>仅接收 Moderator 原始表，按所选日期逐行生成 Monthly Details。</p>
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
            先筛选结算周期，再按 Project、Language、Role 和 Working Account
            自动汇总工时。
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
