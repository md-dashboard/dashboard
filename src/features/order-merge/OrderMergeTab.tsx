import { useMemo, useRef, useState } from 'react';
import { COMPANY_NAMES, getCanonicalCompanyName } from '../../constants/companies';
import type { Row } from '../../merge';
import {
  ALL_COLUMNS, COMPANY_NAME_FIELD, SOURCE_LABEL, SOURCES,
} from '../../schema';
import type { SourceType } from '../../schema';
import type { PendingFileSelection, PendingUploadFile, UploadHistoryEntry } from '../../types/uploadedData';
import './orderMerge.css';

type SourceFilter = 'ALL' | SourceType;

interface OrderMergeTabProps {
  rows: Row[];
  pendingFiles: PendingUploadFile[];
  history: UploadHistoryEntry[];
  onFiles: (files: FileList | File[]) => void | Promise<void>;
  onSelectPendingSource: (id: string, value: PendingFileSelection) => void;
  onConfirmPending: (id: string) => void;
  onChangeCompanyName: (rowKey: string, companyName: string) => void;
}

export function OrderMergeTab({
  rows,
  pendingFiles,
  history,
  onFiles,
  onSelectPendingSource,
  onConfirmPending,
  onChangeCompanyName,
}: OrderMergeTabProps) {
  const [filterSource, setFilterSource] = useState<SourceFilter>('ALL');
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (filterSource !== 'ALL') result = result.filter((row) => row['출처'] === filterSource);
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter((row) => Object.values(row).some((value) => value !== null && String(value).toLowerCase().includes(query)));
    }
    return result;
  }, [rows, filterSource, search]);

  const countsBySource = useMemo(() => {
    const counts: Record<SourceType, number> = { CJ: 0, NAVER: 0, GS: 0 };
    rows.forEach((row) => {
      const source = row['출처'] as SourceType;
      counts[source] = (counts[source] ?? 0) + 1;
    });
    return counts;
  }, [rows]);

  const visibleColumns = useMemo(
    () => ALL_COLUMNS.filter((column) => column !== '_key'),
    [],
  );

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files?.length) onFiles(event.dataTransfer.files);
  }

  function openFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.xlsx,.xls';
    input.onchange = () => { if (input.files) onFiles(input.files); };
    input.click();
  }

  return (
    <>
      <section className="card">
        <div className="card-header">파일 업로드</div>
        <p className="sub">CJ몰 · 네이버 · GS몰 원본 엑셀을 드래그하면 공통 스키마로 합쳐서 보여줍니다. (새로고침 시 초기화됩니다)</p>

        <div
          ref={dropRef}
          className={`dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={openFilePicker}
        >
          엑셀 파일을 여기로 드래그하거나 클릭해서 선택하세요
        </div>

        {pendingFiles.length > 0 && (
          <div className="pending-list">
            {pendingFiles.map((file) => (
              <div className="pending-card" key={file.id}>
                <div className="pending-name">{file.fileName}</div>
                <div className="pending-scores">
                  자동탐지 점수 - CJ:{file.scores.CJ} 네이버:{file.scores.NAVER} GS:{file.scores.GS}
                  {file.guess ? ` -> 추정: ${SOURCE_LABEL[file.guess]}` : ' -> 판단 불가'}
                </div>
                <div className="pending-controls">
                  <select value={file.selected} onChange={(event) => onSelectPendingSource(file.id, event.target.value as PendingFileSelection)}>
                    <option value="">선택 안 함</option>
                    {SOURCES.map((source) => <option key={source} value={source}>{SOURCE_LABEL[source]}</option>)}
                    <option value="SKIP">제외 (무시)</option>
                  </select>
                  <button className="primary" onClick={() => onConfirmPending(file.id)}>확인 후 병합</button>
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
            <input placeholder="검색 (모든 컬럼)" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>

        <div className="status-badges">
          <button
            className={`status-badge ${filterSource === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterSource('ALL')}
          >
            전체 <span className="count">{rows.length}</span>
          </button>
          {SOURCES.map((source) => (
            <button
              key={source}
              className={`status-badge ${filterSource === source ? 'active' : ''}`}
              onClick={() => setFilterSource(source)}
            >
              {SOURCE_LABEL[source]} <span className="count">{countsBySource[source] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>{visibleColumns.map((column) => <th key={column}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row['_key'] as string}>
                  {visibleColumns.map((column) => {
                    const value = row[column];
                    if (column === COMPANY_NAME_FIELD) {
                      const companySelectValue = getCanonicalCompanyName(value) ?? '';
                      return (
                        <td key={column}>
                          <select
                            className="company-tag-select"
                            aria-label="판매자 회사 선택"
                            value={companySelectValue}
                            onChange={(event) => onChangeCompanyName(String(row['_key']), event.target.value)}
                          >
                            <option value="">미지정</option>
                            {COMPANY_NAMES.map((companyName) => (
                              <option key={companyName} value={companyName}>{companyName}</option>
                            ))}
                          </select>
                        </td>
                      );
                    }

                    return (
                      <td key={column}>{value === null || value === undefined ? '' : String(value)}</td>
                    );
                  })}
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
            {history.slice().reverse().map((entry) => (
              <li key={entry.id}>
                [{entry.time}] {entry.fileName} - {entry.source === 'SKIP' ? '제외됨' : `${SOURCE_LABEL[entry.source]} (신규 ${entry.stats?.added ?? 0} / 갱신 ${entry.stats?.updated ?? 0}${entry.skippedNoOrderNumber ? ` / 주문번호 없어 제외 ${entry.skippedNoOrderNumber}` : ''})`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
