export const COMPANIES = {
  FRUIT_PRESERVES: '과일수제청',
  DAEWOONG_MORNINGCOM: '대웅모닝컴',
  MAISON_DE_MODULE: '메종드모듈',
  BIWIT_U: '비윗유',
  SINUIJU_SUNDAE: '신의주순대',
  OKAY_DUCK: '오케이덕',
  YOON_JONGHEE_TTEOKBANG: '윤종희전통떡방',
  JEOBER_KOREA: '저버코리아',
  JEJU_HYANGGI: '제주향기',
  TAHYANGGOL: '타향골',
  FRENCH_LUXURY: '프렌치럭셔리',
  PRINT_BAKERY: '프린트베이커리',
  HEYMIL: '헤이밀',
} as const;

export const COMPANY_NAMES = [
  COMPANIES.FRUIT_PRESERVES,
  COMPANIES.DAEWOONG_MORNINGCOM,
  COMPANIES.MAISON_DE_MODULE,
  COMPANIES.BIWIT_U,
  COMPANIES.SINUIJU_SUNDAE,
  COMPANIES.OKAY_DUCK,
  COMPANIES.YOON_JONGHEE_TTEOKBANG,
  COMPANIES.JEOBER_KOREA,
  COMPANIES.JEJU_HYANGGI,
  COMPANIES.TAHYANGGOL,
  COMPANIES.FRENCH_LUXURY,
  COMPANIES.PRINT_BAKERY,
  COMPANIES.HEYMIL,
] as const;

export type CompanyName = typeof COMPANY_NAMES[number];

export const COMPANY_ALIASES: Record<CompanyName, readonly string[]> = {
  [COMPANIES.FRUIT_PRESERVES]: ['과일수제청'],
  [COMPANIES.DAEWOONG_MORNINGCOM]: ['대웅모닝컴'],
  [COMPANIES.MAISON_DE_MODULE]: ['메종드모듈'],
  [COMPANIES.BIWIT_U]: ['비윗유', '비욧유'],
  [COMPANIES.SINUIJU_SUNDAE]: ['신의주순대'],
  [COMPANIES.OKAY_DUCK]: ['오케이덕'],
  [COMPANIES.YOON_JONGHEE_TTEOKBANG]: ['윤종희전통떡방'],
  [COMPANIES.JEOBER_KOREA]: ['저버코리아'],
  [COMPANIES.JEJU_HYANGGI]: ['제주향기'],
  [COMPANIES.TAHYANGGOL]: ['타향골', 'E한글', '이한글'],
  [COMPANIES.FRENCH_LUXURY]: ['프렌치럭셔리'],
  [COMPANIES.PRINT_BAKERY]: ['프린트베이커리'],
  [COMPANIES.HEYMIL]: ['헤이밀'],
};

function normalizeCompanyName(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('ko-KR')
    .replace(/[^0-9a-z가-힣]/g, '');
}

export function getCanonicalCompanyName(value: unknown): CompanyName | null {
  const normalizedValue = normalizeCompanyName(value);
  if (normalizedValue === '') return null;

  return COMPANY_NAMES.find((companyName) => COMPANY_ALIASES[companyName].some((alias) => {
    const normalizedAlias = normalizeCompanyName(alias);
    return normalizedAlias !== '' && normalizedValue.includes(normalizedAlias);
  })) ?? null;
}
