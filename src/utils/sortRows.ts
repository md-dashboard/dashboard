import type { Row } from '../merge';

// 한글로 시작하는 문자열을 항상 우선(먼저) 배치하기 위한 그룹 판정
function isHangulLeading(text: string): boolean {
  return /^[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text);
}

// 한글 문자열이 항상 먼저 오고, 같은 그룹(한글끼리/그 외끼리) 안에서는 가나다순 내림차순
function compareTextDesc(x: unknown, y: unknown): number {
  const xs = String(x ?? '');
  const ys = String(y ?? '');
  const xHangul = isHangulLeading(xs);
  const yHangul = isHangulLeading(ys);
  if (xHangul !== yHangul) return xHangul ? -1 : 1;
  return ys.localeCompare(xs, 'ko');
}

// 상품명 -> 옵션명 -> 수량 -> 주문자명, 전부 내림차순(문자는 한글 우선 + 가나다순 역순)
export function compareRowsDesc(a: Row, b: Row): number {
  let cmp = compareTextDesc(a['상품명'], b['상품명']);
  if (cmp !== 0) return cmp;
  cmp = compareTextDesc(a['옵션명'], b['옵션명']);
  if (cmp !== 0) return cmp;
  const qtyA = Number(a['수량']) || 0;
  const qtyB = Number(b['수량']) || 0;
  if (qtyA !== qtyB) return qtyB - qtyA;
  return compareTextDesc(a['주문자명'], b['주문자명']);
}
