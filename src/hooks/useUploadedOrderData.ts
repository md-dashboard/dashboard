import { useMemo, useState } from 'react';
import {
  parseXlsx, detectSource, convertToUnifiedRows, upsertRows,
} from '../merge';
import { COMPANY_NAME_FIELD, UPLOAD_DATE_FIELD } from '../schema';
import type { PendingFileSelection, PendingUploadFile, UploadedOrderDataState } from '../types/uploadedData';
import { formatUploadDate } from '../utils/date';

export function useUploadedOrderData() {
  const [uploadedData, setUploadedData] = useState<UploadedOrderDataState>({
    pendingFiles: [],
    history: [],
    rowsByKey: new Map(),
  });

  const rows = useMemo(() => Array.from(uploadedData.rowsByKey.values()), [uploadedData.rowsByKey]);

  async function addPendingFiles(files: FileList | File[]) {
    const nextPending: PendingUploadFile[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) continue;
      const parsed = await parseXlsx(file);
      const { guess, scores } = detectSource(parsed.header);
      nextPending.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        fileName: parsed.fileName,
        header: parsed.header,
        rows: parsed.rows,
        guess,
        scores,
        selected: guess ?? '',
        uploadedDate: formatUploadDate(new Date()),
      });
    }

    if (nextPending.length === 0) return;
    setUploadedData((current) => ({
      ...current,
      pendingFiles: [...current.pendingFiles, ...nextPending],
    }));
  }

  function updatePendingSelection(id: string, value: PendingFileSelection) {
    setUploadedData((current) => ({
      ...current,
      pendingFiles: current.pendingFiles.map((file) => (file.id === id ? { ...file, selected: value } : file)),
    }));
  }

  function confirmPendingFile(id: string) {
    setUploadedData((current) => {
      const item = current.pendingFiles.find((file) => file.id === id);
      if (!item) return current;

      const pendingFiles = current.pendingFiles.filter((file) => file.id !== id);
      const time = new Date().toLocaleString();

      if (item.selected === 'SKIP' || item.selected === '') {
        return {
          ...current,
          pendingFiles,
          history: [...current.history, {
            id, fileName: item.fileName, source: 'SKIP', time,
          }],
        };
      }

      const { rows: unifiedRows, skippedNoOrderNumber } = convertToUnifiedRows(item.selected, {
        fileName: item.fileName,
        header: item.header,
        rows: item.rows,
      });
      const datedRows = unifiedRows.map((row) => ({ ...row, [UPLOAD_DATE_FIELD]: item.uploadedDate }));
      const rowsByKey = new Map(current.rowsByKey);
      const stats = upsertRows(rowsByKey, datedRows);

      return {
        pendingFiles,
        history: [...current.history, {
          id, fileName: item.fileName, source: item.selected, stats, skippedNoOrderNumber, time,
        }],
        rowsByKey,
      };
    });
  }

  function updateRowCompanyName(rowKey: string, companyName: string) {
    setUploadedData((current) => {
      const row = current.rowsByKey.get(rowKey);
      if (!row) return current;

      const rowsByKey = new Map(current.rowsByKey);
      rowsByKey.set(rowKey, {
        ...row,
        [COMPANY_NAME_FIELD]: companyName.trim() === '' ? null : companyName,
      });

      return {
        ...current,
        rowsByKey,
      };
    });
  }

  return {
    rows,
    pendingFiles: uploadedData.pendingFiles,
    history: uploadedData.history,
    addPendingFiles,
    updatePendingSelection,
    confirmPendingFile,
    updateRowCompanyName,
  };
}
