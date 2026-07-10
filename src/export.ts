import * as XLSX from "xlsx";
import type { Row } from "./merge";
import { ALL_COLUMNS } from "./schema";

// 내부용 필드 — 출력 시 제외
const EXCLUDE_COLUMNS = new Set(["_key"]);

// ALL_COLUMNS 순서를 유지하면서 내부 필드만 뺀 출력 컬럼 목록
const OUTPUT_COLUMNS = ALL_COLUMNS.filter((c) => !EXCLUDE_COLUMNS.has(c));

/**
 * 통합 주문 데이터를 xlsx 파일로 다운로드합니다.
 *
 * @param rows   - 출력할 Row 배열 (Map.values() 등을 Array.from으로 변환해 전달)
 * @param filename - 저장 파일명 (기본값: 통합주문_YYYYMMDD.xlsx)
 */
export function exportToXlsx(rows: Row[], filename?: string): void {
  // OUTPUT_COLUMNS 순서에 맞춰 plain object 배열로 정규화
  const records = rows.map((row) => {
    const record: Record<string, unknown> = {};
    for (const col of OUTPUT_COLUMNS) {
      const v = row[col];
      record[col] = v === null || v === undefined ? "" : v;
    }
    return record;
  });

  const ws = XLSX.utils.json_to_sheet(records, {
    header: OUTPUT_COLUMNS, // 컬럼 순서 고정
    skipHeader: false,
  });

  // 헤더 행 너비 자동 조정 (최소 10, 최대 40 chars)
  ws["!cols"] = OUTPUT_COLUMNS.map((col) => {
    const maxLen = records.reduce((acc, r) => {
      const val = r[col];
      return Math.max(acc, val === "" ? 0 : String(val).length);
    }, col.length);
    return { wch: Math.min(Math.max(maxLen, 10), 40) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "통합주문");

  const today = new Date();
  const yyyymmdd = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("");

  // XLSX.writeFile이 브라우저 환경에서 자체적으로 다운로드를 처리하므로
  // <a> 태그 생성이나 URL.createObjectURL을 직접 다룰 필요가 없음
  XLSX.writeFile(wb, filename ?? `통합주문_${yyyymmdd}.xlsx`);
}
