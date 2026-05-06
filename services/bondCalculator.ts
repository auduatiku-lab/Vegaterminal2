
import { Bond, CalculationResult } from '../types';

export function getDays30360(start: Date, end: Date): number {
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  let d1 = start.getDate();
  let m1 = start.getMonth() + 1;
  let y1 = start.getFullYear();
  let d2 = end.getDate();
  let m2 = end.getMonth() + 1;
  let y2 = end.getFullYear();

  // 30E/360 (ICMA / Eurobond Basis)
  if (d1 === 31) d1 = 30;
  if (d2 === 31) d2 = 30;

  return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1);
}

export function getDaysACT(start: Date, end: Date): number {
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function getCouponDates(settlement: Date, maturity: Date, frequency: number) {
  const monthsBetween = 12 / frequency;
  const matDay = maturity.getDate();
  const matMonth = maturity.getMonth();
  const matYear = maturity.getFullYear();

  let periods = 0;
  let prevC = new Date(maturity);
  let nextC = new Date(maturity);

  while (periods < 1200) {
    const checkDate = new Date(matYear, matMonth - (periods * monthsBetween), 1);
    const lastDay = new Date(matYear, matMonth - (periods * monthsBetween) + 1, 0).getDate();
    checkDate.setDate(Math.min(matDay, lastDay));

    if (checkDate <= settlement) {
      prevC = checkDate;
      const nextDate = new Date(matYear, matMonth - ((periods - 1) * monthsBetween), 1);
      const nextLastDay = new Date(matYear, matMonth - ((periods - 1) * monthsBetween) + 1, 0).getDate();
      nextDate.setDate(Math.min(matDay, nextLastDay));
      nextC = nextDate;
      break;
    }
    periods++;
  }
  
  return { prevC, nextC };
}

export function calculateBondPrice(
  ytm: number,
  bond: Bond,
  settlementDate: string,
  faceValue: number
): CalculationResult {
  const set = new Date(settlementDate);
  const mat = new Date(bond.maturityDate);
  
  if (isNaN(set.getTime()) || isNaN(mat.getTime()) || isNaN(ytm) || isNaN(faceValue)) {
    return {
      dirtyPrice: 0, cleanPrice: 0, accruedInterest: 0, accruedInterestRaw: 0, daysAccrued: 0,
      principalAmount: 0, accruedAmount: 0, totalConsideration: 0,
      lastCouponDate: '', nextCouponDate: ''
    };
  }

  const freq = bond.frequency || 2;
  const cp = bond.couponRate;
  const dc = bond.dayCount || '30E/360';
  const r = (ytm / 100) / freq;

  const { prevC, nextC } = getCouponDates(set, mat, freq);

  let daysAccrued: number;
  let daysInPeriod: number;

  if (dc === 'ACT/365') {
    daysAccrued = getDaysACT(prevC, set);
    daysInPeriod = 365 / freq;
  } else if (dc === 'ACT/360') {
    daysAccrued = getDaysACT(prevC, set);
    daysInPeriod = 360 / freq;
  } else {
    // Default 30E/360
    daysAccrued = getDays30360(prevC, set);
    daysInPeriod = 360 / freq; 
  }
  
  // Accrued Interest per 100 par
  const aiPer100 = (cp / freq) * (daysAccrued / daysInPeriod);
  const aiPer100Rounded = Math.round(aiPer100 * 1000000) / 1000000;

  const totalMonthsRemaining = (mat.getFullYear() * 12 + mat.getMonth()) - (nextC.getFullYear() * 12 + nextC.getMonth());
  const n = Math.max(0, Math.round(totalMonthsRemaining / (12 / freq))) + 1;

  let daysToNext: number;
  if (dc === 'ACT/365' || dc === 'ACT/360') {
    daysToNext = getDaysACT(set, nextC);
  } else {
    daysToNext = getDays30360(set, nextC);
  }

  const w = daysToNext / daysInPeriod;
  const v = 1 / (1 + r);
  
  let couponSum = 0;
  for (let i = 1; i <= n; i++) {
    couponSum += (cp / freq) / Math.pow(1 + r, i - 1 + w);
  }
  const dirtyPrice = (100 / Math.pow(1 + r, n - 1 + w)) + couponSum;
  const cleanPrice = dirtyPrice - aiPer100Rounded;

  // Calculate Principal and Accrued separately then sum for Total Consideration
  // Using unrounded AI for amount calculation as BBG often does
  const principalAmount = Math.round((cleanPrice / 100 * faceValue) * 100 + 1e-9) / 100;
  const accruedAmount = Math.round((aiPer100 * faceValue / 100) * 100 + 1e-9) / 100;
  const totalConsideration = Math.round((principalAmount + accruedAmount) * 100 + 1e-9) / 100;

  return {
    dirtyPrice, cleanPrice, accruedInterest: aiPer100Rounded, accruedInterestRaw: aiPer100, daysAccrued,
    principalAmount, accruedAmount, totalConsideration,
    lastCouponDate: prevC.toISOString().split('T')[0],
    nextCouponDate: nextC.toISOString().split('T')[0]
  };
}

export function calculateYield(
  targetCleanPrice: number,
  bond: Bond,
  settlementDate: string,
  faceValue: number
): number {
  if (isNaN(targetCleanPrice) || targetCleanPrice <= 0) return 0;
  
  let y = 8.0; 
  const tolerance = 1e-10;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    const res = calculateBondPrice(y, bond, settlementDate, faceValue);
    const p = res.cleanPrice;
    if (Math.abs(p - targetCleanPrice) < tolerance) break;
    const h = 0.00001;
    const p_plus = calculateBondPrice(y + h, bond, settlementDate, faceValue).cleanPrice;
    const deriv = (p_plus - p) / h;
    if (Math.abs(deriv) < 1e-12) break;
    const nextY = y - (p - targetCleanPrice) / deriv;
    if (isNaN(nextY) || !isFinite(nextY)) break;
    y = nextY;
  }
  return y;
}
