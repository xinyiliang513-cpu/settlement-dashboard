"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy as CopyIcon,
  Download,
  FileSpreadsheet,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import {
  buildOutputWorkbook,
  DateFilter,
  DashboardMode,
  downloadBuffer,
  getPreviewHeaders,
  prepareWorkbook,
  PreparedData,
} from "@/lib/excel";
import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from "react";

type Props = {
  mode: DashboardMode;
};

const COPY = {
  monthly: {
    eyebrow: "MODERATOR & QA",
    title: "Monthly Details",
    description:
      "此接口只接收 Moderator 原始表。上传后选择结算周期，只生成该周期内的 Monthly Details，空映射列原样保留。",
    uploadLabel: "上传 Moderator Excel",
    outputName: "Monthly Details",
    accent: "lime",
    rules: [
      "先按选择的结算周期筛选 Date，再生成结果",
      "每条原始记录对应模板中的一行",
      "字段名匹配，不依赖原始列顺序",
      "UR Status 与 Productivity 自动写入公式",
      "模板未映射列完整保留并保持空白",
    ],
  },
  nonbillable: {
    eyebrow: "MANAGEMENT",
    title: "Non-biliable Invoice",
    description:
      "此接口只接收 Management 原始表。上传后选择结算周期，再按项目、语种、角色和 Working Account 汇总该周期内的工时。",
    uploadLabel: "上传 Management Excel",
    outputName: "Non-biliable Invoice",
    accent: "orange",
    rules: [
      "先按选择的结算周期筛选 Date，再执行汇总",
      "Project、Language、Role、Working Account 相同即合并",
      "所选周期可跨月份；不同工作日期累计为 Working Days",
      "Actual working hour 累加为 Total Working Hours",
      "PM、Name、Need Separate 保留该组第一条记录的值",
    ],
  },
} as const;

function formatCell(value: unknown) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(value);
  }
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 5,
    }).format(value);
  }
  return value == null ? "" : String(value);
}

function formatCellForCopy(value: unknown) {
  if (value instanceof Date) {
    return [
      value.getUTCFullYear(),
      String(value.getUTCMonth() + 1).padStart(2, "0"),
      String(value.getUTCDate()).padStart(2, "0"),
    ].join("-");
  }
  return value == null
    ? ""
    : String(value).replace(/\t/g, " ").replace(/\r?\n/g, " ");
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function todayStamp() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function SettlementDashboard({ mode }: Props) {
  const copy = COPY[mode];
  const headers = getPreviewHeaders(mode);
  const inputRef = useRef<HTMLInputElement>(null);
  const [prepared, setPrepared] = useState<PreparedData | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [error, setError] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const appliedDateStart =
    prepared?.selectedDateStart ?? prepared?.availableDateStart ?? "";
  const appliedDateEnd =
    prepared?.selectedDateEnd ?? prepared?.availableDateEnd ?? "";
  const hasPendingDateChange =
    Boolean(prepared) &&
    (dateStart !== appliedDateStart || dateEnd !== appliedDateEnd);

  const stats = useMemo(() => {
    if (!prepared) return [];
    const common = [
      {
        label: "来源记录",
        value: prepared.sourceRows.toLocaleString("en-US"),
        note: "所选周期内有效数据行",
      },
      {
        label: mode === "monthly" ? "输出记录" : "汇总记录",
        value: prepared.outputRows.toLocaleString("en-US"),
        note: mode === "monthly" ? "一对一写入" : "分组后结果",
      },
      {
        label: "字段匹配",
        value: `${prepared.matchedFields}/${prepared.expectedFields}`,
        note: prepared.missingFields.length ? "存在未匹配字段" : "全部匹配",
      },
      {
        label: "结算周期",
        value: prepared.dateRange ?? "—",
        note: "复制与下载均按此范围",
      },
    ];
    if (mode === "monthly") {
      return common;
    }
    return [
      ...common,
      {
        label: "累计工时",
        value: (prepared.totalHours ?? 0).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        }),
        note: "Actual working hour",
      },
    ];
  }, [mode, prepared]);

  async function processFile(
    file: File,
    dateFilter?: DateFilter,
    initialize = false,
  ) {
    if (initialize) {
      setSourceFile(file);
      setPrepared(null);
      setDateStart("");
      setDateEnd("");
    }
    setError("");
    setIsProcessing(true);
    try {
      const result = await prepareWorkbook(file, mode, dateFilter);
      setPrepared(result);
      if (initialize) {
        setDateStart(result.availableDateStart ?? "");
        setDateEnd(result.availableDateEnd ?? "");
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "文件处理失败，请检查后重试。",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void processFile(file, undefined, true);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file, undefined, true);
  }

  async function handleApplyDateFilter() {
    if (!sourceFile) return;
    if (!dateStart || !dateEnd) {
      setError("请选择完整的开始日期和结束日期。");
      return;
    }
    await processFile(sourceFile, { start: dateStart, end: dateEnd });
  }

  async function handleResetDateFilter() {
    if (!sourceFile || !prepared) return;
    setDateStart(prepared.availableDateStart ?? "");
    setDateEnd(prepared.availableDateEnd ?? "");
    await processFile(sourceFile);
  }

  function handleDropzoneKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  async function handleDownload() {
    if (!prepared) return;
    setError("");
    setIsDownloading(true);
    try {
      const buffer = await buildOutputWorkbook(prepared);
      const prefix =
        mode === "monthly" ? "Monthly Details" : "Non-biliable Invoice";
      downloadBuffer(buffer as ArrayBuffer, `${prefix}_${todayStamp()}.xlsx`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "模板生成失败，请稍后重试。",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleCopy() {
    if (!prepared) return;
    setError("");
    const text = [
      headers.map(formatCellForCopy).join("\t"),
      ...prepared.rows.map((row) =>
        headers
          .map((_, columnIndex) => formatCellForCopy(row[columnIndex]))
          .join("\t"),
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("已复制全部数据");
      window.setTimeout(() => setCopyStatus(""), 2200);
    } catch {
      setError("复制失败，请使用下载 Excel。");
    }
  }

  return (
    <main className={`dashboard-page dashboard-page--${copy.accent}`}>
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">AP</span>
          <span>
            <strong>Settlement Desk</strong>
            <small>结算模板助手</small>
          </span>
        </Link>
        <nav className="mode-nav" aria-label="选择处理页面">
          <Link
            className={mode === "monthly" ? "active" : ""}
            href="/monthly-details"
          >
            Moderator → Monthly Details
          </Link>
          <Link
            className={mode === "nonbillable" ? "active" : ""}
            href="/non-billable"
          >
            Management → Non-biliable
          </Link>
        </nav>
        <div className="privacy-chip">
          <LockKeyhole size={14} />
          浏览器本地处理
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span />
            {copy.eyebrow}
          </p>
          <h1>{copy.title}</h1>
          <p className="hero-description">{copy.description}</p>
        </div>
      </section>

      <section className="workspace">
        <div className="upload-column">
          <div
            className={`dropzone ${isDragging ? "dragging" : ""} ${
              isProcessing ? "processing" : ""
            }`}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onKeyDown={handleDropzoneKey}
            role="button"
            tabIndex={0}
            aria-label={copy.uploadLabel}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleInput}
              hidden
            />
            <div className="upload-icon">
              {isProcessing ? (
                <RefreshCw className="spin" size={28} />
              ) : (
                <UploadCloud size={30} />
              )}
            </div>
            <div>
              <strong>
                {isProcessing ? "正在读取并匹配字段…" : copy.uploadLabel}
              </strong>
              <p>拖放文件到这里，或点击选择文件</p>
            </div>
            <span className="file-type">XLSX / XLS</span>
          </div>

          {sourceFile && (
            <div className="selected-file">
              <div className="file-icon">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <strong>{sourceFile.name}</strong>
                <span>{formatFileSize(sourceFile.size)}</span>
              </div>
              {prepared && (
                <div className="ready-label">
                  <CheckCircle2 size={16} /> 已完成
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="message message--error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {prepared?.missingFields.length ? (
            <div className="message message--warning">
              <AlertCircle size={18} />
              <span>
                未找到以下字段，对应模板列将保持空白：
                {prepared.missingFields.join("、")}
              </span>
            </div>
          ) : null}
        </div>

        <aside className="rules-card">
          <div className="rules-title">
            <Sparkles size={18} />
            <div>
              <strong>本页处理规则</strong>
              <span>已按模板说明配置</span>
            </div>
          </div>
          <ol>
            {copy.rules.map((rule, index) => (
              <li key={rule}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {rule}
              </li>
            ))}
          </ol>
        </aside>
      </section>

      {prepared && (
        <section className="date-filter" aria-labelledby="date-filter-title">
          <div className="date-filter-heading">
            <CalendarDays size={20} />
            <div>
              <strong id="date-filter-title">选择结算周期</strong>
              <span>
                原始数据可选范围：
                {prepared.availableDateStart && prepared.availableDateEnd
                  ? `${prepared.availableDateStart} 至 ${prepared.availableDateEnd}`
                  : "未识别到有效日期"}
              </span>
            </div>
          </div>
          <div className="date-controls">
            <label>
              开始日期
              <input
                type="date"
                value={dateStart}
                min={prepared.availableDateStart}
                max={prepared.availableDateEnd}
                onChange={(event) => setDateStart(event.target.value)}
                disabled={!prepared.availableDateStart || isProcessing}
              />
            </label>
            <span className="date-separator">至</span>
            <label>
              结束日期
              <input
                type="date"
                value={dateEnd}
                min={prepared.availableDateStart}
                max={prepared.availableDateEnd}
                onChange={(event) => setDateEnd(event.target.value)}
                disabled={!prepared.availableDateEnd || isProcessing}
              />
            </label>
            <button
              className="apply-filter-button"
              onClick={() => void handleApplyDateFilter()}
              disabled={
                isProcessing ||
                !prepared.availableDateStart ||
                !hasPendingDateChange
              }
            >
              {isProcessing ? (
                <RefreshCw className="spin" size={16} />
              ) : (
                <Check size={16} />
              )}
              {isProcessing ? "正在更新…" : "应用日期筛选"}
            </button>
            <button
              className="reset-filter-button"
              onClick={() => void handleResetDateFilter()}
              disabled={
                isProcessing ||
                (!hasPendingDateChange &&
                  !prepared.selectedDateStart &&
                  !prepared.selectedDateEnd)
              }
            >
              重置全部日期
            </button>
          </div>
          <p className={hasPendingDateChange ? "filter-note pending" : "filter-note"}>
            {hasPendingDateChange
              ? "日期已修改，请点击“应用日期筛选”后再复制或下载。"
              : mode === "nonbillable"
                ? `当前周期 ${prepared.dateRange ?? "—"}：已重新汇总工时与工作天数。`
                : `当前周期 ${prepared.dateRange ?? "—"}：仅保留该范围内的明细。`}
          </p>
        </section>
      )}

      {prepared && (
        <section className="results" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                <span />
                READY TO EXPORT
              </p>
              <h2>处理结果</h2>
              <span className="result-target">
                仅生成：{copy.outputName}
              </span>
            </div>
            <div className="result-actions">
              <button
                className="copy-button"
                onClick={() => void handleCopy()}
                disabled={hasPendingDateChange || isProcessing}
              >
                {copyStatus ? <Check size={18} /> : <CopyIcon size={18} />}
                {copyStatus || `复制 ${copy.outputName} 数据`}
              </button>
              <button
                className="download-button"
                onClick={() => void handleDownload()}
                disabled={
                  isDownloading || hasPendingDateChange || isProcessing
                }
              >
                {isDownloading ? (
                  <RefreshCw className="spin" size={18} />
                ) : (
                  <Download size={18} />
                )}
                {isDownloading
                  ? "正在生成…"
                  : `下载 ${copy.outputName} Excel`}
                {!isDownloading && <ArrowRight size={18} />}
              </button>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <span>{stat.label}</span>
                <strong title={stat.value}>{stat.value}</strong>
                <small>{stat.note}</small>
              </article>
            ))}
          </div>

          <div className="preview-card">
            <div className="preview-heading">
              <div>
                <strong>输出预览</strong>
                <span>展示前 {Math.min(8, prepared.rows.length)} 条记录</span>
              </div>
              <div className="template-status">
                <CheckCircle2 size={16} />
                仅含 {copy.outputName}
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prepared.rows.slice(0, 8).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map((_, columnIndex) => (
                        <td key={columnIndex}>
                          {formatCell(row[columnIndex]) || (
                            <span className="empty-cell">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <footer>
        <span>Settlement Desk · Template-safe Excel conversion</span>
        <span>
          <LockKeyhole size={13} />
          文件只在当前浏览器中处理
        </span>
      </footer>
    </main>
  );
}
