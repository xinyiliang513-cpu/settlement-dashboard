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
          EXCEL SETTLEMENT WORKSPACE
        </p>
        <h1>Excel 结算模板转换</h1>
        <p>
          选择对应入口上传 Excel。系统按字段名自动匹配，不受原始列顺序影响，
          并严格保留模板中的空白列、格式与计算规则。
        </p>
      </section>

      <section className="entry-grid">
        <Link className="entry-card entry-card--lime" href="/monthly-details">
          <div className="entry-icon">
            <FileSpreadsheet size={28} />
          </div>
          <span className="entry-kicker">MODERATOR & QA</span>
          <h2>Monthly Details</h2>
          <p>逐行映射 Moderator 数据，自动写入 UR 与 Productivity 公式。</p>
          <ul>
            <li>
              <CheckCircle2 size={15} /> 36 列模板结构
            </li>
            <li>
              <CheckCircle2 size={15} /> 空映射列原样保留
            </li>
          </ul>
          <span className="entry-action">
            进入上传页 <ArrowRight size={18} />
          </span>
        </Link>

        <Link className="entry-card entry-card--orange" href="/non-billable">
          <div className="entry-icon">
            <FileSpreadsheet size={28} />
          </div>
          <span className="entry-kicker">MANAGEMENT</span>
          <h2>Non-billable Invoice</h2>
          <p>按项目、语种、人员与月份汇总工时和有效工作天数。</p>
          <ul>
            <li>
              <CheckCircle2 size={15} /> 自动分组汇总
            </li>
            <li>
              <CheckCircle2 size={15} /> 严格遵循模板格式
            </li>
          </ul>
          <span className="entry-action">
            进入上传页 <ArrowRight size={18} />
          </span>
        </Link>
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
