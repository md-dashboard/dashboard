import * as XLSX from 'xlsx';
import type { CompanyOutputRow, CompanyOutputSchema } from './types';

function formatDateForFilename(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
}

function getColumnWidth(header: string, rows: CompanyOutputRow[], columnIndex: number): number {
  const maxLength = rows.reduce((max, row) => {
    const cell = row.cells[columnIndex] ?? '';
    return Math.max(max, String(cell).length);
  }, header.length);

  return Math.min(Math.max(maxLength, 10), 40);
}

function toSheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || '기업분류';
}

export function exportCompanyOutputToXlsx(
  schema: CompanyOutputSchema,
  rows: CompanyOutputRow[],
  filename?: string,
): void {
  const headers = schema.columns.map((column) => column.header);
  const worksheetData = [
    headers,
    ...rows.map((row) => row.cells),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  worksheet['!cols'] = headers.map((header, index) => ({
    wch: getColumnWidth(header, rows, index),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, toSheetName(schema.name));

  XLSX.writeFile(
    workbook,
    filename ?? `${schema.name}_${formatDateForFilename(new Date())}.xlsx`,
  );
}
