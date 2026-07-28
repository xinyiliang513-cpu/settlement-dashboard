"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import {
  buildOutputWorkbook,
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
      "上传 Moderator 原始表，按字段名自动对齐到 Monthly Details 模板。列顺序可以变化，空映射列会原样保留。",
    uploadLabel: "上传 Moderator Excel",
    outputName: "Monthly Details",
    accent: "lime",
    rules: [
      "每条原始记录对应模板中的一行",
      "字段名匹配，不依赖原始列顺序",
      "UR Status 与 Productivity 自动写入公式",
      "模板未映射列完整保留并保持空白",
    ],
  },
  nonbillable: {
    eyebrow: "MANAGEMENT",
    title: "Non-billable Invoice",
    description:
      "上传 Management 原始表，按项目、语种、人员与月份汇总，生成严格遵循模板的 Non-billable Invoice。",
    uploadLabel: "上传 Management Excel",
    outputName: "Non-billable Invoice",
    accent: "orange",
    rules: [
      "按项目、语种、人员与月份分别汇总",
      "有正工时的不同日期计为 Working Days",
      "Actual working hour 累加为 Total Working Hours",
      "所有未映射字段按模板保留为空白",
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
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    if (!prepared) return [];
    const common = [
      {
        label: "来源记录",
        value: prepared.sourceRows.toLocaleString("en-US"),
        note: "有效数据行",
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
    ];
    if (mode === "monthly") {
      return [
        ...common,
        {
          label: "日期范围",
          value: prepared.dateRange ?? "—",
          note: "按源数据识别",
        },
      ];
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

  async function processFile(file: File) {
    setSourceFile(file);
    setPrepared(null);
    setError("");
    setIsProcessing(true);
    try {
      const result = await prepareWorkbook(file, mode);
      setPrepared(result);
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
    if (file) void processFile(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
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
      const prefix = mode === "monthly" ? "Monthly Details" : "Non-billable Invoice";
      downloadBuffer(buffer as ArrayBuffer, `${prefix}_${todayStamp()}.xlsx`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "模板生成失败，请稍后重试。",
      );
    } finally {
      setIsDownloading(false);
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
            Moderator
          </Link>
          <Link
            className={mode === "nonbillable" ? "active" : ""}
            href="/non-billable"
          >
            Management
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
        <section className="results" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                <span />
                READY TO EXPORT
              </p>
              <h2>处理结果</h2>
            </div>
            <button
              className="download-button"
              onClick={() => void handleDownload()}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <RefreshCw className="spin" size={18} />
              ) : (
                <Download size={18} />
              )}
              {isDownloading ? "正在生成模板…" : "下载 Excel 模板"}
              {!isDownloading && <ArrowRight size={18} />}
            </button>
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
                模板结构已锁定
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
