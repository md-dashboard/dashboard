import { useMemo, useRef, useState } from 'react';
import { COMPANY_NAMES, getCanonicalCompanyName } from '../../constants/companies';
import type { Row } from '../../merge';
import {
  ALL_COLUMNS, COMPANY_NAME_FIELD, SOURCE_LABEL, SOURCES,
} from '../../schema';
import type { SourceType } from '../../schema';
import type { PendingFileSelection, PendingUploadFile, UploadHistoryEntry } from '../../types/uploadedData';
import { compareRowsDesc } from '../../utils/sortRows';
import './orderMerge.css';
import { exportToXlsx } from '../../export';

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
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
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

  const sortedRows = useMemo(() => [...filteredRows].sort(compareRowsDesc), [filteredRows]);

  // sortedRows 기준 전체선택 상태
  const allFilteredChecked = sortedRows.length > 0 && sortedRows.every((row) => checkedKeys.has(row['_key'] as string));
  const someFilteredChecked = sortedRows.some((row) => checkedKeys.has(row['_key'] as string));

  function toggleCheck(key: string) {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAllFiltered() {
    if (allFilteredChecked) {
      // 현재 sortedRows에 있는 것만 해제 (다른 체크는 유지)
      setCheckedKeys((prev) => {
        const next = new Set(prev);
        sortedRows.forEach((row) => next.delete(row['_key'] as string));
        return next;
      });
    } else {
      setCheckedKeys((prev) => {
        const next = new Set(prev);
        sortedRows.forEach((row) => next.add(row['_key'] as string));
        return next;
      });
    }
  }

  // 체크된 행 (rows 전체에서 추출 — 필터 밖 체크도 포함, export도 동일한 정렬 순서를 따름)
  const checkedRows = useMemo(
    () => rows.filter((row) => checkedKeys.has(row['_key'] as string)).sort(compareRowsDesc),
    [rows, checkedKeys],
  );

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
          <div className="results-title">
            검색 결과: {filteredRows.length}건
            {checkedKeys.size > 0 && (
              <span className="checked-count">{checkedKeys.size}건 선택됨</span>
            )}
          </div>
          <div className="toolbar">
            <input placeholder="검색 (모든 컬럼)" value={search} onChange={(event) => setSearch(event.target.value)} />
            {checkedKeys.size > 0 && (
              <button className="ghost" onClick={() => setCheckedKeys(new Set())}>
                선택 해제
              </button>
            )}
            <button
              className="primary"
              disabled={checkedKeys.size === 0}
              onClick={() => exportToXlsx(checkedRows)}
            >
              선택 다운로드 {checkedKeys.size > 0 ? `(${checkedKeys.size}건)` : ''}
            </button>
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
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    checked={allFilteredChecked}
                    ref={(el) => { if (el) el.indeterminate = !allFilteredChecked && someFilteredChecked; }}
                    onChange={toggleAllFiltered}
                    disabled={sortedRows.length === 0}
                  />
                </th>
                {visibleColumns.map((column) => <th key={column}>{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const key = row['_key'] as string;
                const checked = checkedKeys.has(key);
                return (
                  <tr key={key} className={checked ? 'row-checked' : ''} onClick={() => toggleCheck(key)}>
                    <td className="col-check" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={checked} onChange={() => toggleCheck(key)} />
                    </td>
                    {visibleColumns.map((column) => {
                      const value = row[column];
                      if (column === COMPANY_NAME_FIELD) {
                        const companySelectValue = getCanonicalCompanyName(value) ?? '';
                        return (
                          <td key={column} onClick={(event) => event.stopPropagation()}>
                            <select
                              className="company-tag-select"
                              aria-label="판매자 회사 선택"
                              value={companySelectValue}
                              onChange={(event) => onChangeCompanyName(key, event.target.value)}
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
                );
              })}
            </tbody>
          </table>
          {sortedRows.length === 0 && (
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
