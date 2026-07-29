
export interface Bond {
  id: string;
  name: string;
  couponRate: number;
  maturityDate: string;
  displayMaturity?: string; // For bonds where math anchor differs from legal maturity
  frequency: number; 
  currency: string;
  dayCount?: '30E/360' | 'ACT/365' | 'ACT/360' | 'ACT/ACT';
  isFlat?: boolean;
  previousClose?: number;
}

export interface CalculationResult {
  dirtyPrice: number;
  cleanPrice: number;
  accruedInterest: number;
  accruedInterestRaw: number;
  daysAccrued: number;
  principalAmount: number;
  accruedAmount: number;
  totalConsideration: number;
  lastCouponDate: string;
  nextCouponDate: string;
  sinkFactor?: number;
  poolFactor?: number;
  outstandingFaceValue?: number;
}

export type InputSource = 'price' | 'yield';
