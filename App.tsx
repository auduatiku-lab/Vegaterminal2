
import React, { useState, useEffect, useMemo } from 'react';
import { Bond, CalculationResult, InputSource } from './types';
import { BONDS, DEFAULT_SETTLEMENT } from './constants';
import { calculateBondPrice, calculateYield } from './services/bondCalculator';
import { 
  Calculator, 
  Globe, 
  ArrowRightLeft, 
  Info, 
  Calendar,
  DollarSign,
  Activity,
  Zap,
  TrendingUp,
  Cpu,
  ChevronDown
} from 'lucide-react';

const App: React.FC = () => {
  // Loading parity case: Nigeria 2046, FV $482,015.00, Price 96.75
  // BBG Consideration: 483,096.44 (Accrued: 16,746.93, 137 days)
  const [selectedBondId, setSelectedBondId] = useState<string>('NG-2046'); 
  const [settlementDate, setSettlementDate] = useState<string>(DEFAULT_SETTLEMENT);
  const [faceValueStr, setFaceValueStr] = useState<string>("482,015.00"); 
  const [cleanPriceStr, setCleanPriceStr] = useState<string>("96.75"); 
  const [yieldStr, setYieldStr] = useState<string>("9.48"); 
  const [lastSource, setLastSource] = useState<InputSource>('price');

  const faceValue = useMemo(() => {
    const n = parseFloat(faceValueStr.replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  }, [faceValueStr]);

  const availableBonds = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return BONDS.filter(bond => {
      const maturity = new Date(bond.maturityDate);
      return maturity >= today;
    });
  }, []);

  const activeBond = useMemo(() => 
    availableBonds.find(b => b.id === selectedBondId) || availableBonds[0] || BONDS[0]
  , [selectedBondId, availableBonds]);

  const results: CalculationResult = useMemo(() => {
    const ytm = parseFloat(yieldStr) || 0;
    const baseResults = calculateBondPrice(ytm, activeBond, settlementDate, faceValue);
    
    if (lastSource === 'price') {
      const manualPrice = parseFloat(cleanPriceStr) || 0;
      const principal = (manualPrice / 100) * faceValue;
      // Use unrounded principal and accrued amount to calculate total consideration
      // to match Bloomberg's precision (Total = Round( (Price + AccruedPer100) * FV / 100 ))
      const total = principal + baseResults.accruedAmount;
      
      return {
        ...baseResults,
        cleanPrice: manualPrice,
        principalAmount: Math.round(principal * 100) / 100,
        accruedAmount: Math.round(baseResults.accruedAmount * 100) / 100,
        totalConsideration: Math.round(total * 100) / 100
      };
    }
    
    return {
      ...baseResults,
      principalAmount: Math.round(baseResults.principalAmount * 100) / 100,
      accruedAmount: Math.round(baseResults.accruedAmount * 100) / 100,
      totalConsideration: Math.round(baseResults.totalConsideration * 100) / 100
    };
  }, [yieldStr, cleanPriceStr, activeBond, settlementDate, faceValue, lastSource]);

  const handlePriceChange = (val: string) => {
    const sanitized = val.replace(/[^0-9.]/g, '');
    setCleanPriceStr(sanitized);
    setLastSource('price');
    const numericVal = parseFloat(sanitized);
    if (!isNaN(numericVal) && numericVal > 0) {
      const y = calculateYield(numericVal, activeBond, settlementDate, faceValue);
      if (!isNaN(y)) setYieldStr(y.toFixed(6));
    }
  };

  const handleYieldChange = (val: string) => {
    const sanitized = val.replace(/[^0-9.-]/g, '');
    setYieldStr(sanitized);
    setLastSource('yield');
    const numericVal = parseFloat(sanitized);
    if (!isNaN(numericVal)) {
      const res = calculateBondPrice(numericVal, activeBond, settlementDate, faceValue);
      if (!isNaN(res.cleanPrice) && res.cleanPrice !== 0) {
        setCleanPriceStr(res.cleanPrice.toFixed(4));
      }
    }
  };

  const handleFaceValueChange = (val: string) => {
    // Allow digits and one decimal point
    const sanitized = val.replace(/[^0-9.]/g, '');
    // Handle multiple decimal points by keeping only the first one
    const parts = sanitized.split('.');
    const clean = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
    
    // If it's just a number, format it nicely with commas, but preserve the decimal part
    if (clean && !clean.endsWith('.')) {
      const num = parseFloat(clean);
      if (!isNaN(num)) {
        const formattedInt = Math.floor(num).toLocaleString();
        const decimalPart = clean.includes('.') ? '.' + clean.split('.')[1] : '';
        setFaceValueStr(formattedInt + decimalPart);
        return;
      }
    }
    setFaceValueStr(clean);
  };

  // Re-calculate yield or price when bond, settlement, or face value changes
  useEffect(() => {
    if (lastSource === 'price') {
      const numericPrice = parseFloat(cleanPriceStr);
      if (!isNaN(numericPrice) && numericPrice > 0) {
        const y = calculateYield(numericPrice, activeBond, settlementDate, faceValue);
        if (!isNaN(y)) setYieldStr(y.toFixed(6));
      }
    } else {
      const numericYield = parseFloat(yieldStr);
      if (!isNaN(numericYield)) {
        const res = calculateBondPrice(numericYield, activeBond, settlementDate, faceValue);
        if (!isNaN(res.cleanPrice) && res.cleanPrice !== 0) {
          setCleanPriceStr(res.cleanPrice.toFixed(4));
        }
      }
    }
  }, [selectedBondId, settlementDate, faceValue]);

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return "0.00";
    const fixedVal = val.toFixed(2);
    const [intPart, decimalPart] = fixedVal.split(".");
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${formattedInt}.${decimalPart}`;
  };

  const FormLabel: React.FC<{ label: string; icon?: React.ReactNode }> = ({ label, icon }) => (
    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 flex items-center gap-2">
      <span className="text-zinc-600">{icon}</span>
      {label}
    </label>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 lg:p-10 flex flex-col items-center selection:bg-cyan-500/30 touch-manipulation">
      {/* Header hidden on Mobile/Tablet, visible only on Desktop (lg) */}
      <header className="hidden lg:flex w-full max-w-7xl flex-row items-center justify-between mb-[18px] gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-1.5 rounded-lg shadow-xl shadow-cyan-500/10">
            <Calculator className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-white flex items-center gap-2">
              VEGA <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">TERMINAL</span>
            </h1>
            <div className="flex items-center gap-2 text-[8px] text-zinc-500 font-bold uppercase tracking-[0.3em]">
              <Cpu size={10} className="text-cyan-600" />
              SIA Engine v4.2.0
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-8 bg-zinc-900/50 px-6 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
            <Globe size={14} className="text-cyan-400" />
            ICMA 30/360
          </div>
          <div className="w-px h-4 bg-zinc-800"></div>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
            <Activity size={14} className="text-emerald-400" />
            Live Parity
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 w-full max-w-7xl items-start">
        
        {/* 1. PARAMETERS CARD */}
        {/* Mobile: Top (order-1) | Desktop: Left Column Row 1 */}
        <div className="md:col-span-6 lg:col-span-6 md:col-start-1 md:row-start-1 order-1 flex flex-col gap-6">
          <section className="bg-zinc-900/60 border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
            
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-tight">
                <ArrowRightLeft size={18} className="text-cyan-400" />
                Parameters
              </h2>
            </div>

            <div className="space-y-5 md:space-y-6">
              <div className="relative group">
                <FormLabel label="Select Eurobond" icon={<Zap size={12} />} />
                <div className="relative">
                  <select 
                    value={selectedBondId}
                    onChange={(e) => setSelectedBondId(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm cursor-pointer appearance-none pr-10"
                  >
                    {availableBonds.map(bond => (
                      <option key={bond.id} value={bond.id} className="bg-zinc-950">{bond.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="relative">
                <FormLabel label="Face Value" icon={<TrendingUp size={12} />} />
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <DollarSign size={16} />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={faceValueStr}
                    onChange={(e) => handleFaceValueChange(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <FormLabel label="Price" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cleanPriceStr}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className={`w-full bg-zinc-950 border rounded-xl py-3.5 px-4 font-mono font-bold text-sm focus:outline-none transition-all ${
                      lastSource === 'price' ? 'border-cyan-500 ring-4 ring-cyan-500/10 text-cyan-400 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]' : 'border-white/10 text-zinc-300'
                    }`}
                  />
                </div>
                <div>
                  <FormLabel label="Yield (%)" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={yieldStr}
                    onChange={(e) => handleYieldChange(e.target.value)}
                    className={`w-full bg-zinc-950 border rounded-xl py-3.5 px-4 font-mono font-bold text-sm focus:outline-none transition-all ${
                      lastSource === 'yield' ? 'border-emerald-500 ring-4 ring-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]' : 'border-white/10 text-zinc-300'
                    }`}
                  />
                </div>
              </div>

              <div className="relative">
                <FormLabel label="Value Date" icon={<Calendar size={12} />} />
                <input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3.5 px-4 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm appearance-none color-scheme-dark"
                />
              </div>
            </div>
          </section>
        </div>

        {/* 2. PRICING OUTPUT CARD */}
        {/* Mobile: Second (order-2) | Desktop: Right Column (col-start-7), Spanning Rows 1 & 2 */}
        <div className="md:col-span-6 lg:col-span-6 md:col-start-7 lg:col-start-7 md:row-start-1 md:row-span-2 order-2 h-full flex flex-col">
          <section className="bg-zinc-900/60 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 backdrop-blur-xl shadow-2xl flex-grow flex flex-col relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-600/5 blur-[100px] rounded-full -mb-32 -mr-32"></div>
            
            <div className="flex items-center gap-3 text-zinc-400 mb-8 md:mb-10">
              <Info size={20} className="text-cyan-500" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Pricing Output</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 flex-grow">
              <div className="md:col-span-12">
                <div className="group transition-transform active:scale-[0.99] mb-8 md:mb-10">
                  <FormLabel label="Principal Amount" icon={<DollarSign size={12} />} />
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mono text-white tracking-tighter whitespace-nowrap overflow-visible">
                    <span className="text-zinc-500 text-xl md:text-2xl lg:text-3xl font-medium mr-1">$</span>
                    {formatCurrency(results.principalAmount)}
                  </div>
                </div>

                <div className="group transition-transform active:scale-[0.99]">
                  <FormLabel label={`Accrued Interest (${results.daysAccrued}d)`} />
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mono text-zinc-300 tracking-tighter whitespace-nowrap overflow-visible">
                    <span className="text-zinc-500 text-lg md:text-xl lg:text-2xl font-medium mr-1">$</span>
                    {formatCurrency(results.accruedAmount)}
                  </div>
                </div>

                <div className="mt-[15px] md:mt-[36px]">
                  <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-white/10 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group shadow-2xl transition-all hover:scale-[1.01] hover:shadow-violet-500/10 active:scale-[0.98]">
                    <div className="absolute top-0 right-0 p-4 opacity-5 md:opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap size={60} className="text-violet-500" />
                    </div>
                    <div className="relative z-10">
                      <FormLabel label="Net Settlement (All-in)" />
                      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mono text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500 mb-4 tracking-tighter whitespace-nowrap overflow-visible">
                        ${formatCurrency(results.totalConsideration)}
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold leading-relaxed max-w-xs uppercase tracking-wider italic">
                        Final cash consideration for {activeBond.currency} on {settlementDate}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-[0.2em]">Coupon</p>
                <p className="text-xs md:text-sm font-black text-zinc-100 mono">{activeBond.couponRate.toFixed(4)}%</p>
              </div>
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-[0.2em]">Maturity</p>
                <p className="text-xs md:text-sm font-black text-zinc-100 mono">{activeBond.displayMaturity || activeBond.maturityDate}</p>
              </div>
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-[0.2em]">Currency</p>
                <p className="text-xs md:text-sm font-black text-zinc-100 mono">{activeBond.currency}</p>
              </div>
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-[0.2em]">Cycle</p>
                <p className="text-xs md:text-sm font-black text-cyan-500 mono">{activeBond.frequency === 4 ? 'QUARTERLY' : 'SEMIANNUAL'}</p>
              </div>
            </section>
          </section>
        </div>

        {/* 3. ACCRUAL MATRIX CARD */}
        {/* Mobile: Bottom (order-3) | Desktop: Left Column Row 2 (md:col-start-1 md:row-start-2) */}
        <div className="md:col-span-6 lg:col-span-6 md:col-start-1 md:row-start-2 order-3 flex flex-col gap-6">
          <section className="bg-cyan-950/20 border border-cyan-500/20 rounded-3xl p-6 backdrop-blur-md">
            <h2 className="text-[10px] font-black text-cyan-400 flex items-center gap-2 uppercase tracking-[0.25em] mb-4">
              <Activity size={12} />
              Accrual Matrix
            </h2>
            <div className="space-y-3 font-mono text-[11px] uppercase font-bold text-zinc-400">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Last Coupon</span>
                <span className="text-zinc-200">{results.lastCouponDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Next Coupon</span>
                <span className="text-zinc-200">{results.nextCouponDate}</span>
              </div>
              <div className="h-px bg-white/5 my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-cyan-500/70">Days Accrued</span>
                <span className="text-cyan-400 text-xl font-black">{results.daysAccrued}</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-12 md:mt-16 text-zinc-600 text-[9px] md:text-[10px] uppercase font-black tracking-[0.3em] md:tracking-[0.5em] flex flex-wrap items-center justify-center gap-4 md:gap-6 pb-10 px-4 text-center">
        <span>© 2025 VEGA SECURITIES</span>
        <span className="w-1 h-1 rounded-full bg-zinc-800 hidden sm:inline-block"></span>
        <span className="text-zinc-700">SIA COMPLIANT</span>
        <span className="w-1 h-1 rounded-full bg-zinc-800 hidden sm:inline-block"></span>
        <span className="text-zinc-700">NASD 30/360</span>
        <span className="w-1 h-1 rounded-full bg-zinc-800 hidden sm:inline-block"></span>
        <span className="text-emerald-500/50">BBG PARITY ENGAGE</span>
      </footer>
    </div>
  );
};

export default App;
