import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Radio, TrendingUp, Network, ShieldAlert, Clock, CloudRain, Cpu } from 'lucide-react';

interface HeroTelemetryProps {
  gameState: {
    district: string;
    sub_district: string | null;
    time: string;
    weather: string;
    action: string;
    health_percent: number;
  };
  activeProfile?: 'cb77' | 'ac';
  alertThreshold: number;
}

export default function HeroTelemetry({ gameState, activeProfile = 'cb77', alertThreshold }: HeroTelemetryProps) {
  const isAc = activeProfile === 'ac';
  
  // Real Ethereum beacon chain slot and epoch simulation based on time elapsed since launch
  const [slot, setSlot] = useState(3025014);
  const [epoch, setEpoch] = useState(94531);
  const [validatorsCount, setValidatorsCount] = useState(14842);
  const [deltaCount, setDeltaCount] = useState(12);

  useEffect(() => {
    // Standard genesis: Dec 1, 2020. Current year: 2026.
    // Calculate slots deterministically from unix timestamp
    const genesisTimeMs = 1606824000000;
    const calculateSlots = () => {
      const diffMs = Date.now() - genesisTimeMs;
      const computedSlot = Math.floor(diffMs / 12000); // 12s per slot
      const computedEpoch = Math.floor(computedSlot / 32); // 32 slots per epoch
      setSlot(computedSlot);
      setEpoch(computedEpoch);
    };

    calculateSlots();
    const interval = setInterval(calculateSlots, 12000); // Update every slot boundary

    // Slowly fluctuate validator delta to feel alive
    const validatorInterval = setInterval(() => {
      setValidatorsCount(prev => prev + (Math.random() > 0.6 ? 1 : Math.random() > 0.9 ? -1 : 0));
      setDeltaCount(prev => Math.max(2, prev + Math.floor(Math.random() * 3) - 1));
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(validatorInterval);
    };
  }, []);

  // Theme adaptations
  const terms = {
    validatorsTitle: isAc ? "Synchronized Animus Relays" : "Active Validators (SenseiNode)",
    validatorsDesc: isAc ? `+${deltaCount} memory links synchronized` : `+${deltaCount} active this epoch`,
    stakeTitle: isAc ? "Synchronized Memories" : "Total Stake (ETH)",
    stakeVal: isAc ? "475.2k Helix" : "475,264 ETH",
    stakeDesc: isAc ? "Rate: 4.82% sync gain" : "4.82% APR (MEV boosted)",
    effectivenessTitle: isAc ? "Sync Harmonization" : "Network Effectiveness",
    effectivenessVal: "99.14%",
    effectivenessDesc: isAc ? "Harmonization lock stable" : "RAVER index optimal",
    healthTitle: isAc ? "Synapse Integrity" : "Node Health Score",
    healthDesc: isAc ? "Animus core stabilizer link" : "Derived from active alerts",
    clockTitle: isAc ? "Sequence Time Index" : "System Epoch Clock",
    clockEpochLabel: isAc ? "Sequence" : "Epoch",
    clockSlotLabel: isAc ? "Subsequence" : "Slot",
  };

  const isAlarm = gameState.health_percent < alertThreshold;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* 1. Active Validators Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className="cp-border p-4 bg-cp-dark/60 border-l-4 border-l-cp-cyan flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-cp-cyan mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">{terms.validatorsTitle}</span>
          <Radio className="w-4 h-4 animate-pulse text-cp-cyan" />
        </div>
        <div>
          <span className="text-3xl font-display font-black text-white tracking-tighter">
            {validatorsCount.toLocaleString()}
          </span>
          <div className="text-[9px] text-cp-cyan/80 mt-1 font-mono uppercase">
            {terms.validatorsDesc}
          </div>
        </div>
      </motion.div>

      {/* 2. Total Stake (ETH) Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="cp-border p-4 bg-cp-dark/60 border-l-4 border-l-cp-yellow flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-cp-yellow mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">{terms.stakeTitle}</span>
          <TrendingUp className="w-4 h-4 text-cp-yellow" />
        </div>
        <div>
          <span className="text-3xl font-display font-black text-white tracking-tighter">
            {terms.stakeVal}
          </span>
          <div className="text-[9px] text-cp-yellow/80 mt-1 font-mono uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            {terms.stakeDesc}
          </div>
        </div>
      </motion.div>

      {/* 3. Network Effectiveness Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="cp-border p-4 bg-cp-dark/60 border-l-4 border-l-cp-cyan flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-cp-cyan mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">{terms.effectivenessTitle}</span>
          <Network className="w-4 h-4 text-cp-cyan" />
        </div>
        <div>
          <span className="text-3xl font-display font-black text-white tracking-tighter">
            {terms.effectivenessVal}
          </span>
          <div className="text-[9px] text-cp-cyan/80 mt-1 font-mono uppercase">
            {terms.effectivenessDesc}
          </div>
        </div>
      </motion.div>

      {/* 4. Health Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className={`cp-border p-4 bg-cp-dark/60 border-l-4 flex flex-col justify-between transition-all ${
          isAlarm ? 'border-l-cp-red bg-cp-red/5 shadow-[inset_0_0_15px_rgba(255,0,60,0.1)]' : 'border-l-green-500'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isAlarm ? 'text-cp-red' : 'text-green-500'}`}>
            {terms.healthTitle}
          </span>
          <ShieldAlert className={`w-4 h-4 ${isAlarm ? 'text-cp-red animate-bounce' : 'text-green-500'}`} />
        </div>
        <div>
          <span className={`text-3xl font-display font-black tracking-tighter ${isAlarm ? 'text-cp-red' : 'text-white'}`}>
            {gameState.health_percent}%
          </span>
          <div className={`text-[9px] mt-1 font-mono uppercase ${isAlarm ? 'text-cp-red/80 font-bold' : 'text-green-500/80'}`}>
            {gameState.health_percent >= alertThreshold ? 'STATUS: OPTIMAL' : 'WARNING: COMPROMISED'}
          </div>
        </div>
      </motion.div>

      {/* 5. Live Clock & Epoch Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="cp-border p-4 bg-cp-dark/60 border-l-4 border-l-cp-cyan flex flex-col justify-between col-span-1 md:col-span-2 lg:col-span-1"
      >
        <div className="flex items-center justify-between text-cp-cyan mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">{terms.clockTitle}</span>
          <Clock className="w-4 h-4 text-cp-cyan animate-spin" style={{ animationDuration: '24s' }} />
        </div>
        <div className="space-y-1 font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 uppercase text-[9px]">{terms.clockEpochLabel}</span>
            <span className="text-white font-bold">{epoch.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 uppercase text-[9px]">{terms.clockSlotLabel}</span>
            <span className="text-cp-yellow font-bold">{slot.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-white/5 text-gray-400">
            <span className="truncate max-w-[70px] uppercase text-[9px]">{gameState.district}</span>
            <span className="text-cp-cyan font-bold text-[8px]">{gameState.weather}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
