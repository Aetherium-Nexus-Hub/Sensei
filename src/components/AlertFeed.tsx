import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, CheckCircle, Zap, RefreshCw, Cpu, 
  Coins, Sparkles, HelpCircle, AlertTriangle 
} from 'lucide-react';

interface AlertFeedProps {
  activeProfile?: 'cb77' | 'ac';
  handleManualSync: () => void;
  syncStatus: string;
  addLog: (msg: string) => void;
  triggerOracle: (prompt: string) => void;
}

export default function AlertFeed({
  activeProfile = 'cb77',
  handleManualSync,
  syncStatus,
  addLog,
  triggerOracle
}: AlertFeedProps) {
  const isAc = activeProfile === 'ac';
  const [activeTab, setActiveTab] = useState<'alerts' | 'actions'>('alerts');
  const [claimedRewards, setClaimedRewards] = useState(12.84);
  const [claimState, setClaimState] = useState<'idle' | 'claiming' | 'success'>('idle');

  const [alerts, setAlerts] = useState([
    {
      id: 'a1',
      title: isAc ? 'Ancestral Memory Flux' : 'Client Imbalance Risk',
      severity: 'HIGH' as const,
      time: '2m ago',
      desc: isAc 
        ? 'Prysm genetic anchor represents >60% share. Risk of memory desynchronization.'
        : 'Prysm consensus client represents >60% network share. High risk of correlated slashing.',
      queryText: isAc 
        ? "Explain the ancestral memory flux desynchronization risk" 
        : "Explain the client diversity slashing risk and why Prysm representing >60% share is bad."
    },
    {
      id: 'a2',
      title: isAc ? 'Beacon Synapse Leak' : 'Low Peer Count',
      severity: 'MEDIUM' as const,
      time: '14m ago',
      desc: isAc
        ? 'Genetic node peer connections dropped below critical threshold (12/30).'
        : 'Validator node peer count dropped below critical boundary (current: 12, threshold: 30).',
      queryText: isAc 
        ? "Explain the beacon synapse leak warning" 
        : "What are peer counts on Ethereum nodes and why is a low peer count like 12 dangerous?"
    },
    {
      id: 'a3',
      title: isAc ? 'Helix Tribute Delay' : 'MEV Relay Delay',
      severity: 'LOW' as const,
      time: '1h ago',
      desc: isAc
        ? 'Flashbots memory relay experiencing 400ms transfer latency.'
        : 'Flashbots builder relay experiencing 400ms ingress network latency.',
      queryText: isAc 
        ? "Explain the helix tribute transfer delay" 
        : "What is an MEV relay delay and how does 400ms ingress latency affect block proposals?"
    }
  ]);

  const handleClaim = () => {
    if (claimedRewards <= 0 || claimState !== 'idle') return;
    
    setClaimState('claiming');
    addLog(`SYSTEM: Executing smart contract reward release for ${claimedRewards} ETH...`);

    setTimeout(() => {
      setClaimState('success');
      addLog(`SUCCESS: Transferred ${claimedRewards} ETH securely to cold storage ledger [0x8aF...2026]`);
      setClaimedRewards(0);
      
      // Auto-reset claim flow back to idle after a few seconds
      setTimeout(() => {
        setClaimState('idle');
      }, 4000);
    }, 2500);
  };

  return (
    <div className="cp-border p-5 bg-cp-dark/60 flex-grow font-mono flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 text-[8px] text-gray-500 uppercase tracking-[0.2em]">
        {isAc ? "RECON PROTOCOL" : "TACTICAL CRITICAL ALERTS"}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 pb-1 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeTab === 'alerts' 
              ? 'text-cp-cyan border-cp-cyan' 
              : 'text-gray-500 border-transparent hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> 
          {isAc ? "Synapse Alerts" : "Node Alerts"} ({alerts.filter(a => a.id !== '').length})
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-2 pb-1 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeTab === 'actions' 
              ? 'text-cp-cyan border-cp-cyan' 
              : 'text-gray-500 border-transparent hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" /> Quick Actions
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow space-y-3 min-h-[160px] overflow-y-auto scrollbar-none">
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-3 bg-black/40 border rounded flex flex-col gap-2 transition-all group ${
                  alert.severity === 'HIGH' 
                    ? 'border-cp-red/30 hover:border-cp-red/50 bg-cp-red/5' 
                    : alert.severity === 'MEDIUM' 
                    ? 'border-cp-yellow/20 hover:border-cp-yellow/40 bg-cp-yellow/5' 
                    : 'border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      alert.severity === 'HIGH' ? 'bg-cp-red animate-ping' : alert.severity === 'MEDIUM' ? 'bg-cp-yellow' : 'bg-cp-cyan'
                    }`} />
                    <span className="text-xs font-bold text-white group-hover:text-cp-yellow transition-colors">{alert.title}</span>
                  </div>
                  <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                    alert.severity === 'HIGH' ? 'bg-cp-red/20 text-cp-red' : alert.severity === 'MEDIUM' ? 'bg-cp-yellow/20 text-cp-yellow' : 'bg-cp-cyan/20 text-cp-cyan'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                
                <p className="text-[10px] text-gray-400 leading-relaxed">{alert.desc}</p>
                
                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[8px]">
                  <span className="text-gray-600">{alert.time}</span>
                  <button
                    onClick={() => triggerOracle(alert.queryText)}
                    className="flex items-center gap-1 text-cp-cyan hover:text-white hover:underline transition-all cursor-pointer font-bold uppercase"
                  >
                    <Sparkles className="w-3 h-3 text-cp-yellow" /> Ask Oracle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3">
            {/* 1. Rewards Claim Panel */}
            <div className="p-3 bg-black/40 border border-white/5 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-cp-yellow" />
                  <span className="text-xs font-bold text-white">VALIDATOR REWARDS YIELD</span>
                </div>
                <span className="text-[10px] text-cp-yellow font-black">
                  {claimedRewards > 0 ? `${claimedRewards} ETH` : 'CLAIMED'}
                </span>
              </div>
              
              <p className="text-[9px] text-gray-500 mb-3 uppercase">
                Accumulated Consensus & Execution fees. Safe ledger withdrawal authorized.
              </p>

              {claimState === 'idle' && claimedRewards > 0 && (
                <button
                  onClick={handleClaim}
                  className="w-full py-1.5 bg-cp-yellow hover:bg-white text-black font-black uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                >
                  RELEASE FUNDS TO LEDGER
                </button>
              )}
              {claimState === 'idle' && claimedRewards <= 0 && (
                <div className="w-full py-1.5 bg-black/40 border border-white/5 text-gray-600 text-center uppercase tracking-wider text-[10px]">
                  REWARDS RETRIEVED (0.00 ETH)
                </div>
              )}
              {claimState === 'claiming' && (
                <div className="w-full py-1.5 bg-cp-yellow/10 border border-cp-yellow/30 text-cp-yellow text-center uppercase tracking-wider text-[10px] flex items-center justify-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" /> SECURING TRANSFERS...
                </div>
              )}
              {claimState === 'success' && (
                <div className="w-full py-1.5 bg-green-500/10 border border-green-500/30 text-green-500 text-center uppercase tracking-wider text-[10px] flex items-center justify-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" /> LEDGER TRANSFER RELEASED!
                </div>
              )}
            </div>

            {/* 2. Sync Trigger Action */}
            <button
              onClick={() => {
                handleManualSync();
                addLog(`SYSTEM: Initiating manual validation link synchronization...`);
              }}
              disabled={syncStatus === 'SYNCING'}
              className="w-full p-3 bg-black/40 hover:bg-cp-cyan/5 border border-white/5 hover:border-cp-cyan/40 text-left rounded transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-white group-hover:text-cp-cyan transition-colors uppercase block">
                  Force Network Sync
                </span>
                <span className="text-[9px] text-gray-500 uppercase mt-0.5 block">
                  Synchronize beacon link metrics block
                </span>
              </div>
              <RefreshCw className={`w-4 h-4 text-gray-500 group-hover:text-cp-cyan transition-colors ${syncStatus === 'SYNCING' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
