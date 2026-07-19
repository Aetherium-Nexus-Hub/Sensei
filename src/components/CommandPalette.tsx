import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Terminal, ShieldAlert, Cpu, Database, 
  Trash2, Brain, RefreshCw, Zap, X, CornerDownLeft 
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: 'cb77' | 'ac';
  handleProfileSwitch: (profile: 'cb77' | 'ac') => void;
  handleManualSync: () => void;
  triggerSimulation: (health: number, action: string) => void;
  clearLogs: () => void;
  claimRewards: () => void;
  claimed: number;
}

export default function CommandPalette({
  isOpen,
  onClose,
  activeProfile,
  handleProfileSwitch,
  handleManualSync,
  triggerSimulation,
  clearLogs,
  claimRewards,
  claimed
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const items = [
    {
      id: 'profile-cb',
      title: 'Shift Neural Layer to CB77 Night',
      desc: 'Activate classic dark Cyberpunk theme with high contrast cyan and yellow neon overlays.',
      icon: Cpu,
      action: () => { handleProfileSwitch('cb77'); onClose(); }
    },
    {
      id: 'profile-ac',
      title: 'Shift Genetic Layer to AC Animus',
      desc: 'Synchronize Assassin Cohort database with deep gold tones and structural Cinzel display layouts.',
      icon: Brain,
      action: () => { handleProfileSwitch('ac'); onClose(); }
    },
    {
      id: 'sync-node',
      title: 'Initialize Handshake (Sync Telemetry)',
      desc: 'Re-establish Link and synchronize local MRC-LINK stats block against Regional Overwatch.',
      icon: RefreshCw,
      action: () => { handleManualSync(); onClose(); }
    },
    {
      id: 'claim-rewards',
      title: `Claim Validator Yields (${claimed.toFixed(2)} ETH Available)`,
      desc: 'Initiate smart contract secure withdrawal of accumulated attestation and MEV boost fees.',
      icon: Zap,
      action: () => { claimRewards(); onClose(); }
    },
    {
      id: 'inject-ok',
      title: 'Inject Telemetry Feed: 100% OK',
      desc: 'Inject mock telemetry indicating optimal health and active driving sequence.',
      icon: ShieldAlert,
      action: () => { triggerSimulation(100, 'driving'); onClose(); }
    },
    {
      id: 'inject-caution',
      title: 'Inject Telemetry Feed: 45% CAUTION',
      desc: 'Inject mock telemetry simulating medium alert with stealth sequences.',
      icon: ShieldAlert,
      action: () => { triggerSimulation(45, 'stealth'); onClose(); }
    },
    {
      id: 'inject-critical',
      title: 'Inject Telemetry Feed: 15% CRITICAL',
      desc: 'Inject emergency mock telemetry triggering physical alarms and strobe indicators.',
      icon: ShieldAlert,
      action: () => { triggerSimulation(15, 'combat'); onClose(); }
    },
    {
      id: 'clear-logs',
      title: 'Purge Supervisor Log Cores',
      desc: 'Permanently wipe local terminal telemetry buffers. Note: Does not delete Google Drive cloud backups.',
      icon: Trash2,
      action: () => { clearLogs(); onClose(); }
    }
  ];

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="w-full max-w-2xl bg-cp-darker border border-cp-cyan shadow-[0_0_40px_rgba(0,240,255,0.2)] rounded relative flex flex-col font-mono"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-black/40">
              <Search className="w-5 h-5 text-cp-cyan shrink-0 animate-pulse" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                placeholder="Type a neural directive or query system..."
                className="flex-grow bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm font-mono"
              />
              <span className="text-[10px] text-gray-500 border border-white/10 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">ESC TO EXIT</span>
              <button onClick={onClose} className="p-1 hover:bg-white/5 rounded transition-all text-gray-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[350px] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left p-3 rounded flex items-center gap-4 transition-all border cursor-pointer ${
                        isSelected 
                          ? 'bg-cp-cyan/10 border-cp-cyan/50 text-white shadow-[0_0_10px_rgba(0,240,255,0.1)]' 
                          : 'bg-transparent border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className={`p-2 rounded border shrink-0 ${
                        isSelected ? 'bg-cp-cyan text-black border-cp-cyan' : 'bg-black/40 border-white/5 text-gray-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="text-xs font-bold truncate">{item.title}</div>
                        <div className="text-[10px] text-gray-500 truncate mt-0.5">{item.desc}</div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-[9px] text-cp-cyan font-bold shrink-0">
                          <span>ENTER</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-gray-600 uppercase tracking-widest animate-pulse">
                  No matching cybernetic directive found
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-black/60 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500 uppercase">
              <span>ACTIVE LAYER: <span className="text-cp-cyan font-bold">{activeProfile === 'ac' ? 'AC ANIMUS' : 'CB77 OVERWATCH'}</span></span>
              <span>Use ↑↓ arrows to navigate, Enter to submit</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
