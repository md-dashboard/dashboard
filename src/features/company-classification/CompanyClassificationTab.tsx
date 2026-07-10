import { useMemo, useState } from 'react';
import type { Row } from '../../merge';
import { getCompanyOutputRows } from './companyClassification';
import { COMPANY_OUTPUT_SCHEMAS } from './companySchemas';
import './companyClassification.css';

export function CompanyClassificationTab({ rows }: { rows: Row[] }) {
  const [activeCompanyId, setActiveCompanyId] = useState(COMPANY_OUTPUT_SCHEMAS[0].id);
  const activeSchema = COMPANY_OUTPUT_SCHEMAS.find((schema) => schema.id === activeCompanyId)
    ?? COMPANY_OUTPUT_SCHEMAS[0];
  const companyRows = useMemo(
    () => getCompanyOutputRows(rows, activeSchema),
    [rows, activeSchema],
  );

  return (
    <section className="card company-classification">
      <div className="company-tabs" role="tablist" aria-label="기업 선택">
        {COMPANY_OUTPUT_SCHEMAS.map((schema) => (
          <button
            key={schema.id}
            type="button"
            role="tab"
            aria-selected={schema.id === activeSchema.id}
            className={schema.id === activeSchema.id ? 'active' : ''}
            onClick={() => setActiveCompanyId(schema.id)}
          >
            {schema.name}
          </button>
        ))}
      </div>

      <div className="company-results">
        <div className="results-header">
          <div>
            <div className="results-title">{activeSchema.name}</div>
            <p className="sub compact">분류된 주문 {companyRows.length}건 · 출력 컬럼 {activeSchema.columns.length}개</p>
          </div>
        </div>

        <div className="table-wrap classification-table">
          <table>
            <thead>
              <tr>
                {activeSchema.columns.map((column, index) => (
                  <th key={`${column.header}-${index}`}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companyRows.map((row) => (
                <tr key={row.key}>
                  {row.cells.map((cell, index) => (
                    <td key={`${activeSchema.columns[index].header}-${index}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {companyRows.length === 0 && (
            <div className="empty-state">
              {rows.length === 0
                ? '주문 병합 탭에서 엑셀 파일을 먼저 병합해 주세요.'
                : `${activeSchema.name}으로 분류된 주문이 없습니다.`}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
