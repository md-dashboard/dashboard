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
        <div className="topbar-logo">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="topbar-logo-icon" />
          <span>MDS Market DashBoard</span>
        </div>
        <nav className="topbar-links">
          <a
            className="topbar-link-guide"
            href="https://github.com/md-dashboard/dashboard"
            target="_blank"
            rel="noopener noreferrer"
          >
            사용 가이드
          </a>
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
              onChangeCompanyName={uploadedOrderData.updateRowCompanyName}
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
