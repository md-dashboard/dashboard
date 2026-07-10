import type { Row } from '../../merge';
import type { SourceType } from '../../schema';
import type { CompanyClassificationRow } from './types';

interface CompanyAccumulator {
  companyName: string;
  orderCount: number;
  sources: Set<SourceType>;
  shippingBases: Set<string>;
  productNameCount: number;
}

export function getCompanyClassificationRows(rows: Row[]): CompanyClassificationRow[] {
  const companies = new Map<string, CompanyAccumulator>();

  for (const row of rows) {
    const companyName = String(row['판매자(협력사/브랜드)명'] || row['출고지'] || '미분류');
    const current = companies.get(companyName) ?? {
      companyName,
      orderCount: 0,
      sources: new Set<SourceType>(),
      shippingBases: new Set<string>(),
      productNameCount: 0,
    };

    current.orderCount += 1;
    if (row['출처']) current.sources.add(row['출처'] as SourceType);
    if (row['출고지']) current.shippingBases.add(String(row['출고지']));
    if (row['상품명']) current.productNameCount += 1;
    companies.set(companyName, current);
  }

  return Array.from(companies.values())
    .map((company) => ({
      companyName: company.companyName,
      orderCount: company.orderCount,
      sources: Array.from(company.sources),
      shippingBases: Array.from(company.shippingBases),
      productNameCount: company.productNameCount,
    }))
    .sort((a, b) => b.orderCount - a.orderCount || a.companyName.localeCompare(b.companyName));
}

export function getUnclassifiedOrderCount(rows: Row[]): number {
  return rows.filter((row) => !row['판매자(협력사/브랜드)명'] && !row['출고지']).length;
}
