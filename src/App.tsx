import { useMemo, useRef, useState } from 'react';
import './App.css';
import {
  parseXlsx, detectSource, convertToUnifiedRows, upsertRows,
} from './merge';
import type { Row, MergeStats } from './merge';
import { SOURCE_LABEL, ALL_COLUMNS, UPLOAD_DATE_FIELD } from './schema';
import type { SourceType } from './schema';

interface PendingFile {
  id: string;
  fileName: string;
  header: string[];
  rows: unknown[][];
  guess: SourceType | null;
  scores: Record<SourceType, number>;
  selected: SourceType | '' | 'SKIP';
  uploadedDate: string;
}

interface HistoryEntry {
  id: string;
  fileName: string;
  source: SourceType | 'SKIP';
  stats?: MergeStats;
  skippedNoOrderNumber?: number;
  time: string;
}

const SOURCES: SourceType[] = ['CJ', 'NAVER', 'GS'];

function formatUploadDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function App() {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [dataMap, setDataMap] = useState<Map<string, Row>>(new Map());
  const [filterSource, setFilterSource] = useState<'ALL' | SourceType>('ALL');
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => Array.from(dataMap.values()), [dataMap]);

  const filteredRows = useMemo(() => {
    let r = rows;
    if (filterSource !== 'ALL') r = r.filter((row) => row['출처'] === filterSource);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter((row) => Object.values(row).some((v) => v !== null && String(v).toLowerCase().includes(q)));
    }
    return r;
  }, [rows, filterSource, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { CJ: 0, NAVER: 0, GS: 0 };
    rows.forEach((r) => { c[r['출처'] as string] = (c[r['출처'] as string] ?? 0) + 1; });
    return c;
  }, [rows]);

  async function handleFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) continue;
      const parsed = await parseXlsx(file);
      const { guess, scores } = detectSource(parsed.header);
      const uploadedDate = formatUploadDate(new Date());
      setPending((prev) => [...prev, {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        fileName: parsed.fileName,
        header: parsed.header,
        rows: parsed.rows,
        guess,
        scores,
        selected: guess ?? '',
        uploadedDate,
      }]);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  function updatePendingSelection(id: string, value: SourceType | '' | 'SKIP') {
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, selected: value } : p)));
  }

  function confirmPending(id: string) {
    const item = pending.find((p) => p.id === id);
    if (!item) return;
    setPending((prev) => prev.filter((p) => p.id !== id));

    if (item.selected === 'SKIP' || item.selected === '') {
      setHistory((h) => [...h, {
        id, fileName: item.fileName, source: 'SKIP', time: new Date().toLocaleString(),
      }]);
      return;
    }
    const source = item.selected as SourceType;
    const { rows: unifiedRows, skippedNoOrderNumber } = convertToUnifiedRows(source, { fileName: item.fileName, header: item.header, rows: item.rows });
    const datedRows = unifiedRows.map((row) => ({ ...row, [UPLOAD_DATE_FIELD]: item.uploadedDate }));
    const next = new Map(dataMap);
    const stats = upsertRows(next, datedRows);
    setDataMap(next);
    setHistory((h) => [...h, {
      id, fileName: item.fileName, source, stats, skippedNoOrderNumber, time: new Date().toLocaleString(),
    }]);
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-logo">주문 통합 도구</div>
        <nav className="topbar-links">
          <span>사용 가이드</span>
          <span>문의</span>
        </nav>
      </header>

      <div className="body">
        <aside className="sidebar">
          <div className="sidebar-title">메뉴</div>
          <ul className="sidebar-menu">
            <li className="active">주문 병합</li>
          </ul>
        </aside>

        <main className="main">
          <div className="card page-title-card">
            <div className="page-title">주문/배송 통합 대시보드</div>
            <div className="breadcrumb">Home &gt; 주문관리 &gt; 주문 병합</div>
          </div>

          <section className="card">
            <div className="card-header">파일 업로드</div>
            <p className="sub">CJ몰 · 네이버 · GS몰 원본 엑셀을 드래그하면 공통 스키마로 합쳐서 보여줍니다. (새로고침 시 초기화됩니다)</p>

            <div
              ref={dropRef}
              className={`dropzone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = '.xlsx,.xls';
                input.onchange = () => { if (input.files) handleFiles(input.files); };
                input.click();
              }}
            >
              엑셀 파일을 여기로 드래그하거나 클릭해서 선택하세요
            </div>

            {pending.length > 0 && (
              <div className="pending-list">
                {pending.map((p) => (
                  <div className="pending-card" key={p.id}>
                    <div className="pending-name">{p.fileName}</div>
                    <div className="pending-scores">
                      자동탐지 점수 — CJ:{p.scores.CJ} 네이버:{p.scores.NAVER} GS:{p.scores.GS}
                      {p.guess ? ` → 추정: ${SOURCE_LABEL[p.guess]}` : ' → 판단 불가'}
                    </div>
                    <div className="pending-controls">
                      <select value={p.selected} onChange={(e) => updatePendingSelection(p.id, e.target.value as SourceType | '' | 'SKIP')}>
                        <option value="">선택 안 함</option>
                        {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
                        <option value="SKIP">제외 (무시)</option>
                      </select>
                      <button className="primary" onClick={() => confirmPending(p.id)}>확인 후 병합</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="results-header">
              <div className="results-title">검색 결과: {filteredRows.length}건</div>
              <div className="toolbar">
                <input placeholder="검색 (모든 컬럼)" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="status-badges">
              <button
                className={`status-badge ${filterSource === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterSource('ALL')}
              >
                전체 <span className="count">{rows.length}</span>
              </button>
              {SOURCES.map((s) => (
                <button
                  key={s}
                  className={`status-badge ${filterSource === s ? 'active' : ''}`}
                  onClick={() => setFilterSource(s)}
                >
                  {SOURCE_LABEL[s]} <span className="count">{counts[s] ?? 0}</span>
                </button>
              ))}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>{ALL_COLUMNS.filter((c) => c !== '_key').map((c) => <th key={c}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row['_key'] as string}>
                      {ALL_COLUMNS.filter((c) => c !== '_key').map((c) => (
                        <td key={c}>{row[c] === null || row[c] === undefined ? '' : String(row[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRows.length === 0 && (
                <div className="empty-state">표시할 데이터가 없습니다.</div>
              )}
            </div>
          </section>

          {history.length > 0 && (
            <section className="card history">
              <div className="card-header">업로드 이력</div>
              <ul>
                {history.slice().reverse().map((h) => (
                  <li key={h.id}>
                    [{h.time}] {h.fileName} — {h.source === 'SKIP' ? '제외됨' : `${SOURCE_LABEL[h.source]} (신규 ${h.stats?.added ?? 0} / 갱신 ${h.stats?.updated ?? 0}${h.skippedNoOrderNumber ? ` / 주문번호 없어 제외 ${h.skippedNoOrderNumber}` : ''})`}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
