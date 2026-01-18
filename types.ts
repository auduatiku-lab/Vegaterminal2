
export interface Bond {
  id: string;
  name: string;
  couponRate: number;
  maturityDate: string;
  displayMaturity?: string; // For bonds where math anchor differs from legal maturity
  frequency: number; 
  currency: string;
}

export interface CalculationResult {
  dirtyPrice: number;
  cleanPrice: number;
  accruedInterest: number;
  daysAccrued: number;
  principalAmount: number;
  accruedAmount: number;
  totalConsideration: number;
  lastCouponDate: string;
  nextCouponDate: string;
}

export type InputSource = 'price' | 'yield';
