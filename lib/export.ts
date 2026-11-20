import type { Cell, SheetData } from "write-excel-file/universal";

/** A sheet that is already turned into cells, so sheets with different row types can share one workbook. */
export interface PreparedSheet {
  name: string;
  data: SheetData;
  widths: number[];
  rowCount: number;
}

/**
 * Excel export of whatever a list shows. Every export is built from the SAME filters the page is
 * using, but covers all matching rows (not just the visible page).
 */

export type ExportValue = string | number | boolean | null | undefined;

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => ExportValue;
  /** money -> 1,234.50 ; number -> plain number ; text (default). Numbers stay numbers so Excel can sum them. */
  kind?: "text" | "money" | "number";
  /** Column width in characters. */
  width?: number;
}

/** The API caps a page at 100 rows. A runaway list stops at this many rows instead of hammering the server. */
export const MAX_EXPORT_ROWS = 5000;

export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<{ rows: T[]; total: number }>,
): Promise<T[]> {
  const limit = 100;
  const all: T[] = [];
  for (let page = 1; all.length < MAX_EXPORT_ROWS; page += 1) {
    const { rows, total } = await fetchPage(page, limit);
    all.push(...rows);
    if (rows.length < limit || all.length >= total) break;
  }
  return all.slice(0, MAX_EXPORT_ROWS);
}

function toCell<T>(column: ExportColumn<T>, row: T): Cell {
  const value = column.value(row);
  if (value === null || value === undefined || value === "") return null;
  if (column.kind === "money" || column.kind === "number") {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    return column.kind === "money" ? { value: n, format: "#,##0.00" } : { value: n };
  }
  // Written as a string cell, never as a formula, so text like "=1+1" stays plain text.
  return { value: String(value) };
}

function defaultWidth<T>(column: ExportColumn<T>): number {
  if (column.width) return column.width;
  return column.kind === "text" || !column.kind ? Math.max(14, column.header.length + 4) : 14;
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildSheet<T>(name: string, columns: ExportColumn<T>[], rows: T[]): PreparedSheet {
  const header: Cell[] = columns.map((c) => ({
    value: c.header,
    fontWeight: "bold" as const,
    backgroundColor: "#e6f5ee",
  }));
  return {
    name: name.slice(0, 31), // Excel's sheet-name limit
    data: [header, ...rows.map((r) => columns.map((c) => toCell(c, r)))],
    widths: columns.map((c) => defaultWidth(c)),
    rowCount: rows.length,
  };
}

/** One .xlsx with several sheets (e.g. a summary plus the rows behind it). */
export async function downloadWorkbook(baseName: string, sheets: PreparedSheet[]): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file/universal");
  const blob = await writeXlsxFile(
    sheets.map((s) => ({
      data: s.data,
      sheet: s.name,
      columns: s.widths.map((width) => ({ width })),
      stickyRowsCount: 1,
    })),
  ).toBlob();
  saveBlob(blob, `${baseName}-${todayStamp()}.xlsx`);
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadXlsx<T>(
  baseName: string,
  sheetName: string,
  columns: ExportColumn<T>[],
  rows: T[],
): Promise<void> {
  await downloadWorkbook(baseName, [buildSheet(sheetName, columns, rows)]);
}
