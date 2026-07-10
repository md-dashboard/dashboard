import type { Row } from '../../merge';
import type { CompanyOutputColumn, CompanyOutputRow, CompanyOutputSchema } from './types';

const COMPANY_MATCH_FIELDS = ['판매자(협력사/브랜드)명', '출고지'];

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function normalizeCompanyName(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('ko-KR')
    .replace(/[^0-9a-z가-힣]/g, '');
}

function isCompanyOrder(row: Row, aliases: readonly string[]): boolean {
  const normalizedAliases = aliases.map(normalizeCompanyName).filter(Boolean);

  return COMPANY_MATCH_FIELDS.some((field) => {
    const companyValue = normalizeCompanyName(row[field]);
    return companyValue !== '' && normalizedAliases.some((alias) => companyValue.includes(alias));
  });
}

function getOutputValue(row: Row, column: CompanyOutputColumn): string {
  const sourceField = column.sourceFields.find((field) => hasValue(row[field]));
  return sourceField ? String(row[sourceField]) : '';
}

export function getCompanyOutputRows(rows: Row[], schema: CompanyOutputSchema): CompanyOutputRow[] {
  return rows
    .filter((row) => isCompanyOrder(row, schema.aliases))
    .map((row, index) => ({
      key: String(row['_key'] ?? `${schema.id}-${index}`),
      cells: schema.columns.map((column) => getOutputValue(row, column)),
    }));
}
