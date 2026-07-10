export type ActiveTab = 'ORDER_MERGE' | 'COMPANY_CLASSIFICATION';

export const TABS: { id: ActiveTab; label: string }[] = [
  { id: 'ORDER_MERGE', label: '주문 병합' },
  { id: 'COMPANY_CLASSIFICATION', label: '기업 분류' },
];
