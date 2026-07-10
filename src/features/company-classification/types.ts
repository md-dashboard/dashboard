import type { SourceType } from '../../schema';

export interface CompanyClassificationRow {
  companyName: string;
  orderCount: number;
  sources: SourceType[];
  shippingBases: string[];
  productNameCount: number;
}
