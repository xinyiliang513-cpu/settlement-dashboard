import type { Row, Workbook, Worksheet } from "exceljs";

export type DashboardMode = "monthly" | "nonbillable";

export type CellValue = string | number | boolean | Date | null;

export type DateFilter = {
  start?: string;
  end?: string;
};

export type PreparedData = {
  mode: DashboardMode;
  fileName: string;
  sourceRows: number;
  outputRows: number;
  matchedFields: number;
  expectedFields: number;
  missingFields: string[];
  rows: CellValue[][];
  totalHours?: number;
  dateRange?: string;
  availableDateStart?: string;
  availableDateEnd?: string;
  selectedDateStart?: string;
  selectedDateEnd?: string;
};

const MONTHLY_HEADERS = [
  "Owner",
  "Project Type",
  "Project",
  "Language",
  "Role",
  "Tier",
  "Work Type",
  "Shift",
  "Date",
  "Name",
  "Work account",
  "Moderation Task",
  "Non-Moderation Task",
  "Training",
  "Meeting",
  "Rest",
  "Idle",
  "Other",
  "Total Hours",
  "Assigned Hours",
  "Minimum Required Tasks",
  "Cost Hours",
  "Effective Prod Hours",
  "UR",
  "UR Status",
  "Moderation Tasks",
  "AHT",
  "Productivity",
  "Sampled",
  "Qualified",
  "Errors",
  "Accuracy (pre-appeal)",
  "Accepted appeals",
  "Accuracy (post-appeal)",
  "Notes",
  "Need Separate",
] as const;

const MONTHLY_SOURCES: Array<string | null> = [
  "PM",
  "Project Type",
  "Project",
  "Language",
  "Role",
  "Tier",
  "Work Type",
  "Shift",
  "Date",
  "Name",
  "Work account",
  "Moderation Task（ByteWorks hours）",
  "Non-Moderation Task（ByteWorks hours）",
  "Training（ByteWorks hours）",
  "Meeting（ByteWorks hours）",
  "Rest（ByteWorks hours）",
  "Idle（ByteWorks hours）",
  "Other（ByteWorks hours）",
  "Total Hours（ByteWorks Summary）",
  "AP Assigned Hours",
  "Target Output（DataPower）",
  "Paid Hours",
  "EPH（DataPower）",
  "Actual UR（DataPower）",
  null,
  "Moderation Tasks（DataPower）",
  "Actual AHT",
  null,
  "Sampled(Quality)",
  "Qualified(Quality)",
  "Unqualified(Quality)",
  "Pre Accuracy(Quality)",
  "Appeal Won(Quality)",
  "Post Accuracy(Quality)",
  null,
  "Need Separate",
];

const NONBILLABLE_HEADERS = [
  "PM",
  "Project",
  "Language",
  "Location",
  "Timezone",
  "Role",
  "Have Production Task/Not",
  "Name",
  "Working Account",
  "CG Account",
  "China PM",
  "Hourly Rate",
  "Project Period",
  "Invoice Period",
  "Working Days",
  "Total Working Hours",
  "Amount (USD)",
  "Timesheet Link",
  "Other Comments",
  "Need Separate",
] as const;

const NONBILLABLE_SOURCE_FIELDS = [
  "PM",
  "Project",
  "Language",
  "Role",
  "Name",
  "Work account",
  "Date",
  "Actual working hour",
  "Need Separate",
] as const;

const MONTHLY_NUMERIC_FIELDS = new Set([
  "Moderation Task（ByteWorks hours）",
  "Non-Moderation Task（ByteWorks hours）",
  "Training（ByteWorks hours）",
  "Meeting（ByteWorks hours）",
  "Rest（ByteWorks hours）",
  "Idle（ByteWorks hours）",
  "Other（ByteWorks hours）",
  "Total Hours（ByteWorks Summary）",
  "AP Assigned Hours",
  "Target Output（DataPower）",
  "Paid Hours",
  "EPH（DataPower）",
  "Moderation Tasks（DataPower）",
  "Actual AHT",
  "Sampled(Quality)",
  "Qualified(Quality)",
  "Unqualified(Quality)",
  "Appeal Won(Quality)",
]);

const MONTHLY_PERCENT_FIELDS = new Set([
  "Actual UR（DataPower）",
  "Pre Accuracy(Quality)",
  "Post Accuracy(Quality)",
]);

const MONTHLY_SOURCE_SIGNATURES = [
  "Moderation Task（ByteWorks hours）",
  "Actual UR（DataPower）",
  "Moderation Tasks（DataPower）",
] as const;

export function getPreviewHeaders(mode: DashboardMode) {
  return mode === "monthly" ? MONTHLY_HEADERS : NONBILLABLE_HEADERS;
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function buildHeaderIndex(headers: unknown[]) {
  const index = new Map<string, number>();
  headers.forEach((header, position) => {
    const key = normalizeHeader(header);
    if (key && !index.has(key)) index.set(key, position);
  });
  return index;
}

function getByHeader(
  row: CellValue[],
  headerIndex: Map<string, number>,
  field: string,
) {
  const position = headerIndex.get(normalizeHeader(field));
  return position === undefined ? null : (row[position] ?? null);
}

function isBlank(value: CellValue) {
  return value === null || value === "" || value === undefined;
}

function toNumber(value: CellValue) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned.replace(/%$/, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toPercent(value: CellValue) {
  if (typeof value === "number") return value > 1 ? value / 100 : value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned.replace(/%$/, ""));
  if (!Number.isFinite(parsed)) return null;
  return cleaned.endsWith("%") || parsed > 1 ? parsed / 100 : parsed;
}

function excelSerialToDate(serial: number) {
  const epoch = Date.UTC(1899, 11, 30);
  return new Date(epoch + Math.round(serial * 86_400_000));
}

function toDate(value: CellValue) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(
      Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
    );
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return excelSerialToDate(value);
  }
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().replace(/\./g, "/").replace(/-/g, "/");
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    return new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
    );
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateParts(value: CellValue) {
  const date = toDate(value);
  if (!date) {
    const fallback = String(value ?? "").trim();
    return {
      date,
      dayKey: fallback || "unknown-date",
      monthKey: fallback ? `unparsed:${fallback}` : "unknown-month",
    };
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return {
    date,
    dayKey: `${year}-${month}-${day}`,
    monthKey: `${year}-${month}`,
  };
}

function displayDate(value: CellValue) {
  const parsed = dateParts(value);
  if (!parsed.date) return "";
  const year = parsed.date.getUTCFullYear();
  return year >= 2000 && year <= 2100 ? parsed.dayKey : "";
}

function validateDateFilter(filter?: DateFilter) {
  const start = filter?.start?.trim() || undefined;
  const end = filter?.end?.trim() || undefined;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (start && !datePattern.test(start)) {
    throw new Error("开始日期格式不正确，请重新选择。");
  }
  if (end && !datePattern.test(end)) {
    throw new Error("结束日期格式不正确，请重新选择。");
  }
  if (start && end && start > end) {
    throw new Error("开始日期不能晚于结束日期。");
  }
  return { start, end };
}

function isDateInFilter(dayKey: string, filter: ReturnType<typeof validateDateFilter>) {
  if (!filter.start && !filter.end) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return false;
  if (filter.start && dayKey < filter.start) return false;
  if (filter.end && dayKey > filter.end) return false;
  return true;
}

function getAvailableDateRange(dates: string[]) {
  const validDates = dates
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  return {
    availableDateStart: validDates[0],
    availableDateEnd: validDates[validDates.length - 1],
  };
}

function getSelectedDateRange(
  selectedDates: string[],
  filter: ReturnType<typeof validateDateFilter>,
  availableRange: ReturnType<typeof getAvailableDateRange>,
) {
  if (filter.start || filter.end) {
    const start = filter.start ?? availableRange.availableDateStart;
    const end = filter.end ?? availableRange.availableDateEnd;
    return start && end ? `${start} — ${end}` : "—";
  }
  return selectedDates.length
    ? `${selectedDates[0]} — ${selectedDates[selectedDates.length - 1]}`
    : "—";
}

async function readRows(file: File) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), {
    cellDates: false,
    raw: true,
  });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error("未找到可读取的工作表。");
  const rows = XLSX.utils.sheet_to_json<CellValue[]>(firstSheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: true,
  });
  if (!rows.length) throw new Error("工作表为空，未找到字段行。");
  return rows;
}

function coerceMonthlyValue(field: string, value: CellValue) {
  if (field === "Date") return toDate(value) ?? value;
  if (MONTHLY_NUMERIC_FIELDS.has(field)) return toNumber(value) ?? value;
  if (MONTHLY_PERCENT_FIELDS.has(field)) return toPercent(value) ?? value;
  return value;
}

async function prepareMonthly(
  file: File,
  dateFilter?: DateFilter,
): Promise<PreparedData> {
  const allRows = await readRows(file);
  const filter = validateDateFilter(dateFilter);
  const headerIndex = buildHeaderIndex(allRows[0] ?? []);
  const monthlySignatureCount = MONTHLY_SOURCE_SIGNATURES.filter((field) =>
    headerIndex.has(normalizeHeader(field)),
  ).length;
  if (monthlySignatureCount < 2) {
    throw new Error(
      "此接口只接受 Moderator 原始表，并只生成 Monthly Details。请检查上传文件。",
    );
  }
  const mappedFields = MONTHLY_SOURCES.filter(
    (field): field is string => Boolean(field),
  );
  const uniqueFields = [...new Set(mappedFields)];
  const missingFields = uniqueFields.filter(
    (field) => !headerIndex.has(normalizeHeader(field)),
  );
  const availableDates: string[] = [];
  const selectedDates: string[] = [];
  const rows: CellValue[][] = [];

  for (const sourceRow of allRows.slice(1)) {
    const coreFields = ["Project", "Date", "Name", "Work account"];
    const hasCoreValue = coreFields.some(
      (field) => !isBlank(getByHeader(sourceRow, headerIndex, field)),
    );
    if (!hasCoreValue) continue;

    const sourceDate = displayDate(
      getByHeader(sourceRow, headerIndex, "Date"),
    );
    if (sourceDate) availableDates.push(sourceDate);
    if (!isDateInFilter(sourceDate, filter)) continue;

    const outputRow = MONTHLY_SOURCES.map((field) =>
      field
        ? coerceMonthlyValue(
            field,
            getByHeader(sourceRow, headerIndex, field),
          )
        : null,
    );
    const actualUr = toPercent(outputRow[23]);
    const actualAht = toNumber(outputRow[26]);
    outputRow[24] = actualUr !== null && actualUr >= 0.75 ? "Yes" : "No";
    outputRow[27] =
      actualAht !== null && actualAht !== 0 ? 3600 / actualAht : null;
    if (sourceDate) selectedDates.push(sourceDate);
    rows.push(outputRow);
  }

  const sortedSelectedDates = selectedDates.sort();
  const availableRange = getAvailableDateRange(availableDates);
  return {
    mode: "monthly",
    fileName: file.name,
    sourceRows: rows.length,
    outputRows: rows.length,
    matchedFields: uniqueFields.length - missingFields.length,
    expectedFields: uniqueFields.length,
    missingFields,
    rows,
    dateRange: getSelectedDateRange(
      sortedSelectedDates,
      filter,
      availableRange,
    ),
    ...availableRange,
    selectedDateStart: filter.start,
    selectedDateEnd: filter.end,
  };
}

type ManagementGroup = {
  firstSeen: number;
  pm: CellValue;
  project: CellValue;
  language: CellValue;
  role: CellValue;
  name: CellValue;
  account: CellValue;
  needSeparate: CellValue;
  workingDates: Set<string>;
  totalHours: number;
};

async function prepareNonbillable(
  file: File,
  dateFilter?: DateFilter,
): Promise<PreparedData> {
  const allRows = await readRows(file);
  const filter = validateDateFilter(dateFilter);
  const headerIndex = buildHeaderIndex(allRows[0] ?? []);
  if (!headerIndex.has(normalizeHeader("Actual working hour"))) {
    throw new Error(
      "此接口只接受 Management 原始表，并只生成 Non-biliable Invoice。请检查上传文件。",
    );
  }
  const missingFields = NONBILLABLE_SOURCE_FIELDS.filter(
    (field) => !headerIndex.has(normalizeHeader(field)),
  );
  const groups = new Map<string, ManagementGroup>();
  const availableDates: string[] = [];
  const selectedDates: string[] = [];
  let sourceRows = 0;

  allRows.slice(1).forEach((sourceRow, rowIndex) => {
    const pm = getByHeader(sourceRow, headerIndex, "PM");
    const project = getByHeader(sourceRow, headerIndex, "Project");
    const language = getByHeader(sourceRow, headerIndex, "Language");
    const role = getByHeader(sourceRow, headerIndex, "Role");
    const name = getByHeader(sourceRow, headerIndex, "Name");
    const account = getByHeader(sourceRow, headerIndex, "Work account");
    const dateValue = getByHeader(sourceRow, headerIndex, "Date");
    const hoursValue = getByHeader(
      sourceRow,
      headerIndex,
      "Actual working hour",
    );
    const needSeparate = getByHeader(
      sourceRow,
      headerIndex,
      "Need Separate",
    );
    const hasCoreValue = [project, name, account, dateValue, hoursValue].some(
      (value) => !isBlank(value),
    );
    if (!hasCoreValue) return;

    const { dayKey } = dateParts(dateValue);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
      availableDates.push(dayKey);
    }
    if (!isDateInFilter(dayKey, filter)) return;

    sourceRows += 1;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
      selectedDates.push(dayKey);
    }
    const key = [project, language, role, account]
      .map((value) => normalizeHeader(value))
      .join("\u001f");
    const group =
      groups.get(key) ??
      ({
        firstSeen: rowIndex,
        pm,
        project,
        language,
        role,
        name,
        account,
        needSeparate,
        workingDates: new Set<string>(),
        totalHours: 0,
      } satisfies ManagementGroup);

    const hours = toNumber(hoursValue);
    if (hours !== null && hours > 0) {
      group.workingDates.add(dayKey);
      group.totalHours += hours;
    }
    groups.set(key, group);
  });

  const orderedGroups = [...groups.values()].sort(
    (a, b) => a.firstSeen - b.firstSeen,
  );
  const rows = orderedGroups.map<CellValue[]>((group) => [
    group.pm,
    group.project,
    group.language,
    null,
    null,
    group.role,
    null,
    group.name,
    group.account,
    null,
    group.pm,
    null,
    null,
    null,
    group.workingDates.size,
    Number(group.totalHours.toFixed(5)),
    null,
    null,
    null,
    group.needSeparate,
  ]);
  const sortedSelectedDates = selectedDates.sort();
  const availableRange = getAvailableDateRange(availableDates);

  return {
    mode: "nonbillable",
    fileName: file.name,
    sourceRows,
    outputRows: rows.length,
    matchedFields:
      NONBILLABLE_SOURCE_FIELDS.length - missingFields.length,
    expectedFields: NONBILLABLE_SOURCE_FIELDS.length,
    missingFields: [...missingFields],
    rows,
    totalHours: orderedGroups.reduce(
      (total, group) => total + group.totalHours,
      0,
    ),
    dateRange: getSelectedDateRange(
      sortedSelectedDates,
      filter,
      availableRange,
    ),
    ...availableRange,
    selectedDateStart: filter.start,
    selectedDateEnd: filter.end,
  };
}

export async function prepareWorkbook(
  file: File,
  mode: DashboardMode,
  dateFilter?: DateFilter,
): Promise<PreparedData> {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    throw new Error("请上传 .xlsx 或 .xls 格式的 Excel 文件。");
  }
  return mode === "monthly"
    ? prepareMonthly(file, dateFilter)
    : prepareNonbillable(file, dateFilter);
}

function clone<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

async function loadTemplateWorkbook(templateBuffer?: ArrayBuffer) {
  const ExcelJSModule = await import("exceljs/dist/exceljs.min.js");
  const ExcelJS = ExcelJSModule.default;
  let buffer = templateBuffer;
  if (!buffer) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const response = await fetch(`${basePath}/结算模版.xlsx`);
    if (!response.ok) throw new Error("模板文件加载失败，请刷新页面后重试。");
    buffer = await response.arrayBuffer();
  }
  const workbook = new ExcelJS.Workbook() as Workbook;
  await workbook.xlsx.load(buffer as never);
  return workbook;
}

function preserveOnlyWorksheet(
  workbook: Workbook,
  sheetName: string,
) {
  const target =
    workbook.getWorksheet(sheetName) ??
    workbook.worksheets.find(
      (sheet) => sheet.name.trim() === sheetName.trim(),
    );
  if (!target) throw new Error(`模板中未找到 ${sheetName} 工作表。`);
  workbook.worksheets.forEach((sheet) => {
    if (sheet.id !== target.id) workbook.removeWorksheet(sheet.id);
  });
  return target;
}

function snapshotRow(
  worksheet: Worksheet | undefined,
  rowNumber: number,
  columnCount: number,
) {
  if (!worksheet) throw new Error("模板工作表不可用。");
  const row = worksheet.getRow(rowNumber);
  return {
    height: row.height,
    cells: Array.from({ length: columnCount }, (_, index) => {
      const cell = row.getCell(index + 1);
      return {
        style: clone(cell.style),
        dataValidation: clone(cell.dataValidation),
        protection: clone(cell.protection),
      };
    }),
  };
}

function clearRowsAfter(
  worksheet: Worksheet,
  headerRows: number,
) {
  const count = Math.max(0, worksheet.rowCount - headerRows);
  if (count) worksheet.spliceRows(headerRows + 1, count);
}

function applyTemplateRow(
  worksheet: Worksheet,
  rowNumber: number,
  snapshot: ReturnType<typeof snapshotRow>,
) {
  const row = worksheet.getRow(rowNumber);
  row.height = snapshot.height;
  snapshot.cells.forEach((templateCell, index) => {
    const cell = row.getCell(index + 1);
    cell.style = clone(templateCell.style);
    cell.dataValidation = clone(templateCell.dataValidation);
    cell.protection = clone(templateCell.protection);
  });
  return row;
}

function setFormulaCells(
  row: Row,
  rowNumber: number,
  values: CellValue[],
) {
  const actualUr = toPercent(values[23]);
  const actualAht = toNumber(values[26]);
  row.getCell(25).value = {
    formula: `IF(X${rowNumber}>=75%,"Yes","No")`,
    result: actualUr !== null && actualUr >= 0.75 ? "Yes" : "No",
  };
  row.getCell(28).value = {
    formula: `IFERROR(3600/AA${rowNumber},"")`,
    result:
      actualAht !== null && actualAht !== 0 ? 3600 / actualAht : "",
  };
}

export async function buildOutputWorkbook(
  prepared: PreparedData,
  templateBuffer?: ArrayBuffer,
) {
  const workbook = await loadTemplateWorkbook(templateBuffer);
  const isMonthly = prepared.mode === "monthly";
  const sheetName = isMonthly ? "Monthly Details" : "Non-biliable Invoice";
  const worksheet = preserveOnlyWorksheet(workbook, sheetName);
  const headerRows = isMonthly ? 2 : 1;
  const columnCount = isMonthly ? 36 : 20;
  const templateSnapshot = snapshotRow(
    worksheet,
    headerRows + 1,
    columnCount,
  );
  clearRowsAfter(worksheet, headerRows);

  prepared.rows.forEach((values, rowIndex) => {
    const rowNumber = headerRows + rowIndex + 1;
    const row = applyTemplateRow(worksheet, rowNumber, templateSnapshot);
    values.forEach((value, columnIndex) => {
      row.getCell(columnIndex + 1).value = value;
    });
    if (isMonthly) setFormulaCells(row, rowNumber, values);
    row.commit();
  });

  worksheet.views = [
    {
      state: "frozen",
      ySplit: headerRows,
      topLeftCell: `A${headerRows + 1}`,
      activeCell: `A${headerRows + 1}`,
    },
  ];
  worksheet.autoFilter = {
    from: { row: headerRows, column: 1 },
    to: {
      row: Math.max(headerRows, headerRows + prepared.rows.length),
      column: columnCount,
    },
  };

  return workbook.xlsx.writeBuffer();
}

export function downloadBuffer(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
