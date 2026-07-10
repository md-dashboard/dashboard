import { useState } from 'react';
import './App.css';
import { TABS } from './constants/tabs';
import type { ActiveTab } from './constants/tabs';
import { CompanyClassificationTab } from './features/company-classification/CompanyClassificationTab';
import { OrderMergeTab } from './features/order-merge/OrderMergeTab';
import { useUploadedOrderData } from './hooks/useUploadedOrderData';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ORDER_MERGE');
  const uploadedOrderData = useUploadedOrderData();
  const activeTabLabel = TABS.find((tab) => tab.id === activeTab)?.label ?? '';

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
            {TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  className={activeTab === tab.id ? 'active' : ''}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="main">
          <div className="card page-title-card">
            <div className="page-title">주문/배송 통합 대시보드</div>
            <div className="breadcrumb">Home &gt; 주문관리 &gt; {activeTabLabel}</div>
          </div>

          {activeTab === 'ORDER_MERGE' ? (
            <OrderMergeTab
              rows={uploadedOrderData.rows}
              pendingFiles={uploadedOrderData.pendingFiles}
              history={uploadedOrderData.history}
              onFiles={uploadedOrderData.addPendingFiles}
              onSelectPendingSource={uploadedOrderData.updatePendingSelection}
              onConfirmPending={uploadedOrderData.confirmPendingFile}
            />
          ) : (
            <CompanyClassificationTab rows={uploadedOrderData.rows} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
