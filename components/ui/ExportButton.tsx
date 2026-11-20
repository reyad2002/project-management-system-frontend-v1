"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { publishAppError } from "@/lib/error-bus";
import { downloadWorkbook, downloadXlsx, MAX_EXPORT_ROWS, type ExportColumn, type PreparedSheet } from "@/lib/export";

interface ExportButtonProps<T> {
  /** File name without extension; today's date is appended. */
  filename: string;
  sheet: string;
  columns: ExportColumn<T>[];
  /** Load every row that matches the page's current filters. */
  fetchRows: () => Promise<T[]>;
}

/**
 * "Export" next to the filters: downloads an Excel file of everything the current filters match
 * (all pages, not only the one on screen).
 */
export function ExportButton<T>({ filename, sheet, columns, fetchRows }: ExportButtonProps<T>) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const rows = await fetchRows();
      if (rows.length === 0) {
        publishAppError("Nothing to export with the current filters.");
        return;
      }
      await downloadXlsx(filename, sheet, columns, rows);
      if (rows.length >= MAX_EXPORT_ROWS) {
        publishAppError(`Only the first ${MAX_EXPORT_ROWS} rows were exported. Narrow the filters to get the rest.`);
      }
    } catch (err) {
      publishAppError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" loading={busy} onClick={handleClick} aria-label="Export to Excel">
      <Download className="h-4 w-4" />
      <span className="ml-2 hidden sm:inline">Export</span>
    </Button>
  );
}

interface ExportWorkbookButtonProps {
  filename: string;
  /** Builds the sheets when the button is pressed (so any data it needs is loaded fresh). */
  buildSheets: () => Promise<PreparedSheet[]>;
}

/** Same button, for exports made of several sheets. */
export function ExportWorkbookButton({ filename, buildSheets }: ExportWorkbookButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const sheets = await buildSheets();
      if (sheets.every((s) => s.rowCount === 0)) {
        publishAppError("Nothing to export for this period.");
        return;
      }
      await downloadWorkbook(filename, sheets);
    } catch (err) {
      publishAppError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" loading={busy} onClick={handleClick} aria-label="Export to Excel">
      <Download className="h-4 w-4" />
      <span className="ml-2 hidden sm:inline">Export Excel</span>
    </Button>
  );
}
