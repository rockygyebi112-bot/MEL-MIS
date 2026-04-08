"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  filename: string;
  columns?: { key: string; label: string }[];
}

export function ExportButton({ data, filename, columns }: ExportButtonProps) {
  function handleExport() {
    if (data.length === 0) return;

    let sheetData: Record<string, unknown>[];
    if (columns) {
      sheetData = data.map((row) => {
        const obj: Record<string, unknown> = {};
        for (const col of columns) {
          obj[col.label] = row[col.key];
        }
        return obj;
      });
    } else {
      sheetData = data;
    }

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-1" />
      Export Excel
    </Button>
  );
}
