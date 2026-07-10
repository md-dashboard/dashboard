import * as XLSX from 'xlsx';
import type { SourceType } from './schema';
import {
  FINGERPRINTS, MAPS, AUDIT_ONLY, ALL_COLUMNS, KEY_FIELDS,
} from './schema';

export type Row = Record<string, unknown>;

export interface ParsedFile {
  fileName: string;
  header: string[];
  rows: unknown[][];
}

export interface DetectionResult {
  guess: SourceType | null;
  scores: Record<SourceType, number>;
}

// 엑셀 날짜/시간 셀은 raw 숫자(일련번호)로 읽히므로, 화면에 보이던 서식 텍스트를 그대로 쓴다.
// (sheet_to_json + cellDates 조합은 로케일에 따라 셀 값을 잘못된 시간대로 되돌리는 문제가 있어 직접 셀을 순회한다)
function sheetToRows(ws: XLSX.WorkSheet): unknown[][] {
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  const rows: unknown[][] = [];
  for (let r = range.s.r; r <= range.e.r; r += 1) {
    const row: unknown[] = [];
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell) { row.push(null); continue; }
      row.push(cell.t === 'd' ? (cell.w ?? null) : (cell.v ?? null));
    }
    rows.push(row);
  }
  return rows;
}

export async function parseXlsx(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = sheetToRows(ws);
  const headerRow = (raw[0] ?? []) as unknown[];
  const header = headerRow.map((h, i) => (h === null || h === undefined || h === '' ? `(빈헤더_${i + 1})` : String(h)));
  // dedupe duplicate header names
  const seen = new Map<string, number>();
  const dedup = header.map((h) => {
    const n = (seen.get(h) ?? 0) + 1;
    seen.set(h, n);
    return n === 1 ? h : `${h}_${n}`;
  });
  const dataRows = raw.slice(1)
    .filter((r) => Array.isArray(r) && r.some((v) => v !== null && v !== undefined && v !== ''));
  return { fileName: file.name, header: dedup, rows: dataRows };
}

export function detectSource(header: string[]): DetectionResult {
  const scores = { CJ: 0, NAVER: 0, GS: 0 } as Record<SourceType, number>;
  (Object.keys(FINGERPRINTS) as SourceType[]).forEach((src) => {
    scores[src] = FINGERPRINTS[src].filter((col) => header.includes(col)).length;
  });
  const entries = Object.entries(scores) as [SourceType, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [topSrc, topScore] = entries[0];
  const [, secondScore] = entries[1];
  // 최소 2개 이상 겹치고, 2등과 확실히 차이 나야 확신
  const guess = topScore >= 2 && topScore > secondScore ? topSrc : null;
  return { guess, scores };
}

export function buildRowKey(source: SourceType, row: Row): string {
  const keyParts = KEY_FIELDS.map((f) => (row[f] === null || row[f] === undefined ? '' : String(row[f])));
  return [source, ...keyParts].join('||');
}

export interface ConvertResult {
  rows: Row[];
  skippedNoOrderNumber: number;
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function shouldSkipMappedValue(source: SourceType, header: string, target: string, value: unknown, out: Row): boolean {
  if (source !== 'NAVER' || target !== '택배사') return false;
  if (header === '택배사') return hasValue(out['택배사']);
  if (header === '택배사(주문 기준)') return !hasValue(value) && hasValue(out['택배사']);
  return false;
}

// 주문번호가 비어있는 행은 실제 주문이 아니라 합계/푸터 행일 가능성이 높아 제외한다.
export function convertToUnifiedRows(source: SourceType, parsed: ParsedFile): ConvertResult {
  const map = MAPS[source];
  const auditMap = AUDIT_ONLY[source];
  const { header, rows } = parsed;
  const result: Row[] = [];
  let skippedNoOrderNumber = 0;
  for (const r of rows) {
    const out: Row = {};
    ALL_COLUMNS.forEach((c) => { out[c] = null; });
    out['출처'] = source;
    header.forEach((h, i) => {
      const v = r[i];
      if (h in map) {
        const target = map[h];
        if (!shouldSkipMappedValue(source, h, target, v, out)) {
          out[target] = v ?? null;
        }
      } else if (h in auditMap) {
        out[auditMap[h]] = v ?? null;
      }
    });
    const orderNo = out['주문번호'];
    if (orderNo === null || orderNo === undefined || String(orderNo).trim() === '') {
      skippedNoOrderNumber += 1;
      continue;
    }
    out['_key'] = buildRowKey(source, out);
    result.push(out);
  }
  return { rows: result, skippedNoOrderNumber };
}

export interface MergeStats {
  added: number;
  updated: number;
  total: number;
}

// 누적 상태(Map)에 upsert
export function upsertRows(state: Map<string, Row>, newRows: Row[]): MergeStats {
  let added = 0;
  let updated = 0;
  for (const row of newRows) {
    const key = row['_key'] as string;
    if (state.has(key)) {
      updated += 1;
    } else {
      added += 1;
    }
    state.set(key, row);
  }
  return { added, updated, total: state.size };
}
