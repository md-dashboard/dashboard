import type { MergeStats, Row } from '../merge';
import type { SourceType } from '../schema';

export type PendingFileSelection = SourceType | '' | 'SKIP';

export interface PendingUploadFile {
  id: string;
  fileName: string;
  header: string[];
  rows: unknown[][];
  guess: SourceType | null;
  scores: Record<SourceType, number>;
  selected: PendingFileSelection;
  uploadedDate: string;
}

export interface UploadHistoryEntry {
  id: string;
  fileName: string;
  source: SourceType | 'SKIP';
  stats?: MergeStats;
  skippedNoOrderNumber?: number;
  time: string;
}

export interface UploadedOrderDataState {
  pendingFiles: PendingUploadFile[];
  history: UploadHistoryEntry[];
  rowsByKey: Map<string, Row>;
}
