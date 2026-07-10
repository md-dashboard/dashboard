import { useMemo } from 'react';
import type { Row } from '../../merge';
import { SOURCE_LABEL } from '../../schema';
import type { SourceType } from '../../schema';
import './companyClassification.css';

export function CompanyClassificationTab({ rows }: { rows: Row[] }) {
  const companyRows = useMemo(() => {
    const companies = new Map<string, {
      companyName: string;
      orderCount: number;
      sources: Set<SourceType>;
      shippingBases: Set<string>;
      productNameCount: number;
    }>();

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
  }, [rows]);
  const unclassifiedCount = useMemo(
    () => rows.filter((row) => !row['판매자(협력사/브랜드)명'] && !row['출고지']).length,
    [rows],
  );

  return (
    <>
      <section className="card summary-grid">
        <div className="summary-item">
          <div className="summary-label">업로드 주문</div>
          <div className="summary-value">{rows.length}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">분류 후보 기업</div>
          <div className="summary-value">{companyRows.length}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">미분류 주문</div>
          <div className="summary-value">{unclassifiedCount}</div>
        </div>
      </section>

      <section className="card">
        <div className="results-header">
          <div>
            <div className="results-title">기업 분류 기준 데이터</div>
            <p className="sub compact">확정된 주문 데이터 기준으로 기업/출고지 후보를 집계합니다.</p>
          </div>
        </div>

        <div className="table-wrap classification-table">
          <table>
            <thead>
              <tr>
                <th>기업/출고지</th>
                <th>주문 수</th>
                <th>출처</th>
                <th>출고지</th>
                <th>상품명 보유 건</th>
              </tr>
            </thead>
            <tbody>
              {companyRows.map((row) => (
                <tr key={row.companyName}>
                  <td>{row.companyName}</td>
                  <td>{row.orderCount}</td>
                  <td>{row.sources.map((source) => SOURCE_LABEL[source]).join(', ')}</td>
                  <td>{row.shippingBases.join(', ')}</td>
                  <td>{row.productNameCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {companyRows.length === 0 && (
            <div className="empty-state">주문 병합 탭에서 엑셀을 업로드하고 병합하면 기업 분류 후보가 표시됩니다.</div>
          )}
        </div>
      </section>
    </>
  );
}
