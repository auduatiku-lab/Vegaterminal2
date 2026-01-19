
import React, { useState, useEffect, useMemo } from 'react';
import { Bond, CalculationResult, InputSource } from './types';
import { BONDS, DEFAULT_SETTLEMENT } from './constants';
import { calculateBondPrice, calculateYield } from './services/bondCalculator';
import { getMarketInsight } from './services/geminiService';
import { 
  Calculator, 
  Globe, 
  ArrowRightLeft, 
  Info, 
  Calendar,
  DollarSign,
  Activity,
  Zap,
  MessageSquare,
  TrendingUp,
  Cpu
} from 'lucide-react';

const App: React.FC = () => {
  const [selectedBondId, setSelectedBondId] = useState<string>(BONDS[1].id); 
  const [settlementDate, setSettlementDate] = useState<string>("2025-12-29");
  const [faceValueStr, setFaceValueStr] = useState<string>("1,000,000"); 
  const [cleanPriceStr, setCleanPriceStr] = useState<string>("108.25");
  const [yieldStr, setYieldStr] = useState<string>("7.45");
  const [lastSource, setLastSource] = useState<InputSource>('price');
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);

  const faceValue = useMemo(() => {
    const n = parseFloat(faceValueStr.replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  }, [faceValueStr]);

  const activeBond = useMemo(() => 
    BONDS.find(b => b.id === selectedBondId) || BONDS[0]
  , [selectedBondId]);

  const results: CalculationResult = useMemo(() => {
    const ytm = parseFloat(yieldStr) || 0;
    const baseResults = calculateBondPrice(ytm, activeBond, settlementDate, faceValue);
    
    if (lastSource === 'price') {
      const manualPrice = parseFloat(cleanPriceStr) || 0;
      const principal = (manualPrice / 100) * faceValue;
      const roundedPrincipal = Math.round(principal * 100) / 100;
      const total = roundedPrincipal + baseResults.accruedAmount;
      
      return {
        ...baseResults,
        cleanPrice: manualPrice,
        principalAmount: roundedPrincipal,
        totalConsideration: Math.round(total * 100) / 100
      };
    }
    
    return baseResults;
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
    const sanitized = val.replace(/[^0-9]/g, '');
    const numeric = parseInt(sanitized || "0", 10);
    setFaceValueStr(numeric.toLocaleString());
  };

  useEffect(() => {
    const triggerInsight = async () => {
      setLoadingInsight(true);
      const text = await getMarketInsight(activeBond.name, parseFloat(yieldStr) || 0);
      setInsight(text || '');
      setLoadingInsight(false);
    };
    triggerInsight();
  }, [selectedBondId]);

  /**
   * Strictly formats numbers to 2 decimal places with thousands separators.
   * Forces .00 even if the value is a whole number.
   */
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-10 flex flex-col items-center selection:bg-cyan-500/30">
      {/* Navigation / Header */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-2xl shadow-xl shadow-cyan-500/10">
            <Calculator className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
              VEGA <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">TERMINAL</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">
              <Cpu size={12} className="text-cyan-600" />
              SIA Engine v4.2.0
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-8 bg-zinc-900/50 px-6 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
            <Globe size={14} className="text-cyan-400" />
            NASD 30/360
          </div>
          <div className="w-px h-4 bg-zinc-800"></div>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
            <Activity size={14} className="text-emerald-400" />
            Live Parity
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl">
        {/* LEFT COLUMN: INPUTS */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-zinc-900/60 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-tight">
                <ArrowRightLeft size={18} className="text-cyan-400" />
                Parameters
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <FormLabel label="Instrument" icon={<Zap size={12} />} />
                <select 
                  value={selectedBondId}
                  onChange={(e) => setSelectedBondId(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm cursor-pointer appearance-none"
                >
                  {BONDS.map(bond => (
                    <option key={bond.id} value={bond.id} className="bg-zinc-950">{bond.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <FormLabel label="Nominal Value" icon={<TrendingUp size={12} />} />
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <DollarSign size={16} />
                  </div>
                  <input
                    type="text"
                    value={faceValueStr}
                    onChange={(e) => handleFaceValueChange(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <FormLabel label="Price" />
                  <input
                    type="text"
                    value={cleanPriceStr}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className={`w-full bg-zinc-950 border rounded-xl py-3 px-4 font-mono font-bold text-sm focus:outline-none transition-all ${
                      lastSource === 'price' ? 'border-cyan-500 ring-4 ring-cyan-500/10 text-cyan-400 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]' : 'border-white/10 text-zinc-300'
                    }`}
                  />
                </div>
                <div>
                  <FormLabel label="Yield (%)" />
                  <input
                    type="text"
                    value={yieldStr}
                    onChange={(e) => handleYieldChange(e.target.value)}
                    className={`w-full bg-zinc-950 border rounded-xl py-3 px-4 font-mono font-bold text-sm focus:outline-none transition-all ${
                      lastSource === 'yield' ? 'border-emerald-500 ring-4 ring-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]' : 'border-white/10 text-zinc-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <FormLabel label="Value Date" icon={<Calendar size={12} />} />
                <input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 px-4 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm invert-[0.9] brightness-[1.5]"
                />
              </div>
            </div>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-[2rem] p-6 backdrop-blur-md">
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
          </div>
        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-zinc-900/60 border border-white/5 rounded-[3rem] p-10 backdrop-blur-xl shadow-2xl h-full flex flex-col relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-600/5 blur-[100px] rounded-full -mb-32 -mr-32"></div>
            
            <div className="flex items-center gap-3 text-zinc-400 mb-10">
              <Info size={20} className="text-cyan-500" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Pricing Output</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-8 space-y-10">
                <div>
                  <FormLabel label="Principal Amount" icon={<DollarSign size={12} />} />
                  <div className="text-3xl md:text-4xl font-black mono text-white tracking-tighter break-all">
                    <span className="text-zinc-500 text-2xl font-medium mr-1">$</span>
                    {formatCurrency(results.principalAmount)}
                  </div>
                  <div className="text-[10px] text-cyan-400/70 mt-2 uppercase font-black tracking-widest bg-cyan-500/10 inline-block px-2 py-0.5 rounded">
                    @{results.cleanPrice.toFixed(4)}% SIA
                  </div>
                </div>

                <div>
                  <FormLabel label={`Accrued Interest (${results.daysAccrued}d)`} />
                  <div className="text-2xl md:text-3xl font-black mono text-zinc-300 tracking-tighter break-all">
                    <span className="text-zinc-500 text-xl font-medium mr-1">$</span>
                    {formatCurrency(results.accruedAmount)}
                  </div>
                </div>

                <div className="pt-4">
                  <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl transition-all hover:scale-[1.01] hover:shadow-violet-500/10">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap size={60} className="text-violet-500" />
                    </div>
                    <div className="relative z-10">
                      <FormLabel label="Net Settlement (All-in)" />
                      <div className="text-3xl md:text-4xl font-black mono text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500 mb-4 tracking-tighter break-all">
                        ${formatCurrency(results.totalConsideration)}
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold leading-relaxed max-w-xs uppercase tracking-wider italic">
                        Final cash consideration for {activeBond.currency} settlement on {settlementDate}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 hidden md:flex flex-col justify-center border-l border-white/5 pl-12">
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 text-zinc-500">
                       <Activity size={24} className="text-cyan-500 opacity-50" />
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Analytics Status</p>
                         <p className="text-xs font-bold text-zinc-400">VALUATION ENGINE ACTIVE</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 text-zinc-500">
                       <Globe size={24} className="text-blue-500 opacity-50" />
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Region Coverage</p>
                         <p className="text-xs font-bold text-zinc-400">EMEA SOVEREIGN DEBT</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* AI INSIGHT SECTION */}
            <div className="mt-14 pt-10 border-t border-white/5">
               <div className="flex items-center gap-3 mb-6 text-violet-400 uppercase text-[10px] font-black tracking-[0.4em]">
                 <MessageSquare size={16} />
                 Vega Alpha Intelligence
               </div>
               <div className="bg-zinc-950/80 rounded-2xl p-6 border border-white/5 text-sm text-zinc-300 leading-relaxed min-h-[80px] flex items-center relative overflow-hidden">
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-transparent"></div>
                 {loadingInsight ? (
                   <div className="flex gap-2 items-center">
                     <span className="text-zinc-500 italic font-mono uppercase text-[10px]">Processing macro data</span>
                     <div className="flex gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></div>
                       <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse [animation-delay:-0.2s]"></div>
                       <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse [animation-delay:-0.4s]"></div>
                     </div>
                   </div>
                 ) : (
                   <span className="font-medium">{insight || "Analyze historical credit spreads and local macro trends..."}</span>
                 )}
               </div>
            </div>

            {/* SPECS FOOTER */}
            <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-[0.2em]">Coupon</p>
                <p className="text-sm font-black text-zinc-100 mono">{activeBond.couponRate.toFixed(4)}%</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-[0.2em]">Maturity</p>
                <p className="text-sm font-black text-zinc-100 mono">{activeBond.displayMaturity || activeBond.maturityDate}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-[0.2em]">Currency</p>
                <p className="text-sm font-black text-zinc-100 mono">{activeBond.currency}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-[0.2em]">Cycle</p>
                <p className="text-sm font-black text-cyan-500 mono">{activeBond.frequency === 4 ? 'QUARTERLY' : 'SEMIANNUAL'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-16 text-zinc-600 text-[10px] uppercase font-black tracking-[0.5em] flex flex-wrap items-center justify-center gap-6 pb-10">
        <span>© 2025 VEGA SECURITIES</span>
        <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
        <span className="text-zinc-700">SIA COMPLIANT</span>
        <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
        <span className="text-zinc-700">NASD 30/360</span>
        <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
        <span className="text-emerald-500/50">BBG PARITY ENGAGE</span>
      </footer>
    </div>
  );
};

export default App;
