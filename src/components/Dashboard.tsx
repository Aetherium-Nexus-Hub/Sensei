import { motion, AnimatePresence } from 'motion/react';
import { Activity, MapPin, Clock, CloudRain, Crosshair, Terminal, Zap, ShieldAlert, Cpu, Network, Users, TrendingUp, Link as LinkIcon, RefreshCw, Eye, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import TelemetryChart from './TelemetryChart';

interface GameState {
  district: string;
  sub_district: string | null;
  time: string;
  weather: string;
  action: string;
  health_percent: number;
  active_quest: string | null;
  last_updated: number;
}

interface DashboardProps {
  gameState: GameState;
  logs: string[];
  triggerMockUpdate: () => void;
}

interface RosterPlayer {
  id: string;
  name: string;
  handle: string;
  role: string;
  status: 'ACTIVE' | 'OFFLINE' | 'SYNCING';
  performance: number;
}

interface TelemetryData {
  activeQuest: string;
  storkStatus: 'ACTIVE' | 'AWAITING';
  constableStatus: 'ACTIVE' | 'OFFLINE';
  updatedAt: any;
}

export default function Dashboard({ gameState, logs, triggerMockUpdate }: DashboardProps) {
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS'>('SUCCESS');
  const [syncProgress, setSyncProgress] = useState(100);
  const [healthHistory, setHealthHistory] = useState<{ time: string; health: number }[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    activeQuest: 'AWAITING REGIONAL FEED',
    storkStatus: 'AWAITING',
    constableStatus: 'ACTIVE',
    updatedAt: null
  });
  const [combatEvents, setCombatEvents] = useState<{ id: string; time: string; type: 'DAMAGE' | 'HEAL' | 'ELIM' | 'ULT'; desc: string }[]>([]);

  // Real-time Firestore Telemetry Link
  useEffect(() => {
    if (!auth.currentUser) return;

    const docRef = doc(db, 'telemetry', auth.currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTelemetry(docSnap.data() as TelemetryData);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `telemetry/${auth.currentUser?.uid}`);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  // Track health history and generate combat events
  useEffect(() => {
    const now = new Date().toLocaleTimeString();
    setHealthHistory(prev => {
      const newHistory = [...prev, { time: now, health: gameState.health_percent }];
      return newHistory.slice(-20); 
    });

    // Generate flavor combat events based on state changes
    if (gameState.action === 'combat') {
      const types: ('DAMAGE' | 'HEAL' | 'ELIM' | 'ULT')[] = ['DAMAGE', 'ULT', 'DAMAGE', 'HEAL'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const descriptions = {
        'DAMAGE': `HULK inflicted critical impact in ${gameState.district}`,
        'HEAL': 'SENSEI node localized nanite repair sequence',
        'ELIM': 'Target neutralized in Sector Theta',
        'ULT': 'IRON MAN initiated UNIBEAM protocol'
      };

      setCombatEvents(prev => [
        { 
          id: Math.random().toString(36).substr(2, 9), 
          time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: randomType,
          desc: descriptions[randomType]
        },
        ...prev
      ].slice(0, 8));
    }
  }, [gameState.health_percent, gameState.time, gameState.action]);

  const roster: RosterPlayer[] = [
    { id: 'p1', name: 'Tony Stark', handle: 'IRON MAN', role: 'Vanguard', status: 'ACTIVE', performance: 98 },
    { id: 'p2', name: 'Bruce Banner', handle: 'HULK', role: 'Juggernaut', status: 'ACTIVE', performance: 95 },
    { id: 'p3', name: 'Natasha Romanoff', handle: 'WIDOW', role: 'Infiltrator', status: 'ACTIVE', performance: 92 },
    { id: 'p4', name: 'Steve Rogers', handle: 'CAPTAIN', role: 'Tactician', status: 'OFFLINE', performance: 88 },
    { id: 'p5', name: 'Thor Odinson', handle: 'THUNDER', role: 'Heavy Support', status: 'ACTIVE', performance: 94 },
    { id: 'p6', name: 'Clint Barton', handle: 'HAWKEYE', role: 'Marksman', status: 'ACTIVE', performance: 91 },
  ];

  const handleManualSync = async () => {
    if (!auth.currentUser) return;
    
    setSyncStatus('SYNCING');
    setSyncProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // 1200ms Simulated Latency per Tech Spec
        setTimeout(async () => {
          setSyncStatus('SUCCESS');
          
          // Update Firestore to sync quest in real-time
          try {
            await setDoc(doc(db, 'telemetry', auth.currentUser!.uid), {
              uid: auth.currentUser!.uid,
              activeQuest: gameState.active_quest || 'PATROL SENSEI SECTOR',
              storkStatus: 'ACTIVE',
              constableStatus: 'ACTIVE',
              district: gameState.district,
              healthPercent: gameState.health_percent,
              updatedAt: new Date().toISOString()
            });
            triggerMockUpdate();
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `telemetry/${auth.currentUser?.uid}`);
          }
        }, 1200); 
      }
      setSyncProgress(progress);
    }, 150);
  };

  return (
    <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow overflow-y-auto pb-12 font-mono">
      {/* --- Column 1: Regional Infrastructure & Roster --- */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Regional Supervisor Status */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="cp-border p-5 bg-cp-dark/60 border-l-4 border-l-cp-cyan"
        >
          <div className="flex items-center gap-3 mb-4 text-cp-cyan border-b border-cp-cyan/20 pb-2">
            <Cpu className="w-5 h-5" />
            <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em]">Regional Infrastructure</h2>
          </div>
          
          <div className="space-y-3 text-[10px] uppercase">
            <div className="flex justify-between items-center group">
              <span className="text-gray-500">ZA-GATEWAY</span>
              <span className="text-cp-cyan flex items-center gap-2 font-bold">
                <div className="w-2 h-2 bg-cp-cyan rounded-full animate-pulse" />
                ACTIVE
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">AETHERIUM NODE</span>
              <span className="text-white flex items-center gap-2">
                <ShieldAlert className="w-3 h-3 text-cp-cyan" />
                DETERMINISTIC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">NODE STATUS</span>
              <span className="text-cp-yellow">SENSEI-2026-ALPHA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">STORK PROTOCOL</span>
              <span className={telemetry.storkStatus === 'ACTIVE' ? 'text-cp-cyan font-bold' : 'text-cp-red animate-pulse'}>
                {telemetry.storkStatus === 'ACTIVE' ? 'STORK: ACTIVE' : 'AWAITING STORK'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* MRC Team Roster */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="cp-border p-5 bg-cp-dark/40 flex-grow"
        >
          <div className="flex items-center justify-between mb-4 text-cp-cyan border-b border-cp-cyan/20 pb-2">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em]">Team Roster</h2>
            </div>
            <span className="text-[10px] text-gray-500">SENSEI // ZA-MRC</span>
          </div>

          <div className="space-y-2">
            {roster.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 bg-black/30 border border-white/5 hover:border-cp-cyan/30 transition-all group cursor-crosshair">
                <div className={`w-1 h-6 transition-all group-hover:h-8 ${p.status === 'ACTIVE' ? 'bg-cp-cyan' : 'bg-gray-700'}`} />
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white group-hover:text-cp-yellow">{p.handle}</span>
                    <span className="text-[9px] text-gray-500 uppercase">{p.role}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] mt-0.5">
                    <span className={p.status === 'ACTIVE' ? 'text-cp-cyan' : 'text-gray-600'}>{p.status}</span>
                    <span className="text-cp-yellow/70">{p.performance}% SYNC</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* --- Column 2: Ingestion & Live Telemetry --- */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* SENSEI // MRC-LINK Integration */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cp-border p-5 bg-black/40 border-cp-yellow/30 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2 text-[8px] text-cp-yellow/30 uppercase tracking-[0.2em]">Partner-Tracker Interface v2.5</div>
          
          <div className="flex items-center gap-3 text-cp-yellow mb-6">
            <LinkIcon className="w-6 h-6" />
            <h2 className="text-xl font-display font-bold uppercase tracking-[0.3em]">SENSEI // MRC-LINK</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="p-4 bg-black/60 border border-cp-yellow/20 relative group">
                <div className="absolute -top-2 left-4 bg-black px-2 text-[8px] text-gray-500 uppercase">Local Target: CLAUDE-TRACKER</div>
                <div className="flex items-center justify-between text-cp-yellow">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${syncStatus === 'SYNCING' ? 'animate-ping bg-cp-yellow' : 'bg-cp-yellow'}`} />
                    <span className="text-xs tracking-widest font-bold">EDGE SYNC STATUS</span>
                  </div>
                  <span className="text-[10px]">{syncStatus === 'SYNCING' ? 'ESTABLISHING HANDSHAKE...' : 'LINK STABLE'}</span>
                </div>
              </div>
              
              <button 
                onClick={handleManualSync}
                disabled={syncStatus === 'SYNCING'}
                className="w-full h-14 bg-cp-yellow text-black font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-white transition-colors disabled:opacity-50 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                {syncStatus === 'SYNCING' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                INITIATE CLAUDE-SYNC
              </button>
            </div>

            <div className="flex flex-col justify-between py-1">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                    <span>Telemetric Ingestion Meter</span>
                    <span className="text-cp-yellow font-bold">{Math.round(syncProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-black border border-cp-yellow/10 relative">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-cp-yellow shadow-[0_0_10px_rgba(255,255,0,0.3)]"
                      initial={{ width: '100%' }}
                      animate={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-cp-yellow/5 border border-cp-yellow/10 flex items-center gap-4">
                  <TrendingUp className="w-6 h-6 text-cp-yellow" />
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest">Player Synergy Coefficient</div>
                    <div className="text-sm font-black text-white uppercase tracking-wider">HULK + IRON MAN : <span className="text-cp-yellow">0.945</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live Visual Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Biometrics & Sector */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="cp-border p-5 bg-cp-dark/60 h-full flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 text-cp-cyan">
                  <Activity className="w-5 h-5" />
                  <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em]">Live Telemetry</h2>
                </div>
                <div className="text-[8px] text-cp-cyan/40 uppercase">ZA-MRC Sector Feed</div>
              </div>
              
              <div className="space-y-6 flex-grow">
                <div>
                  <div className="flex justify-between text-[10px] uppercase mb-2">
                    <span className="text-gray-500">Core Roster Stability</span>
                    <span className={gameState.health_percent < 30 ? "text-cp-red font-bold" : "text-cp-cyan font-bold"}>{gameState.health_percent}%</span>
                  </div>
                  <div className="h-4 bg-black border border-cp-cyan/20 relative p-0.5">
                    <motion.div 
                      className={`h-full ${gameState.health_percent < 30 ? 'bg-cp-red' : 'bg-cp-cyan'}`}
                      animate={{ width: `${gameState.health_percent}%` }}
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-3 h-3 text-cp-cyan" />
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest">Health Trend Analysis</span>
                  </div>
                  <TelemetryChart data={healthHistory} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black/40 border border-white/5">
                    <div className="text-[9px] text-gray-500 uppercase mb-1">Operational Dist.</div>
                    <div className="text-xs font-bold text-white uppercase">{gameState.district}</div>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5">
                    <div className="text-[9px] text-gray-500 uppercase mb-1">Active Sector</div>
                    <div className="text-xs font-bold text-cp-yellow uppercase">{gameState.sub_district || "SYNCING..."}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-cp-cyan" />
                    <div>
                      <div className="text-[8px] text-gray-500 uppercase">SYS-TIME</div>
                      <div className="text-xs font-bold">{new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CloudRain className="w-4 h-4 text-cp-cyan" />
                    <div>
                      <div className="text-[8px] text-gray-500 uppercase">METEOROLOGY</div>
                      <div className="text-xs font-bold uppercase">{gameState.weather}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mission Logic & Terminal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="cp-border p-5 bg-cp-dark/60 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-5 text-cp-cyan">
                <Crosshair className="w-5 h-5" />
                <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em]">Mission Control</h2>
              </div>
              
              <div className="p-4 bg-cp-yellow/10 border border-cp-yellow/30 mb-6 relative">
                <div className="absolute -top-2 left-4 bg-cp-dark px-2 text-[8px] text-cp-yellow uppercase font-bold">Active Directive</div>
                <div className="text-lg font-black text-white uppercase tracking-tighter leading-none glitch-text mb-2" data-text={telemetry.activeQuest}>
                  {telemetry.activeQuest}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 uppercase">Current Action: <span className="text-white">{gameState.action}</span></span>
                  <span className="text-[9px] text-cp-yellow border border-cp-yellow/30 px-1 font-bold">REAL-TIME SYNC</span>
                </div>
              </div>

              <div className="flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cp-cyan" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Supervisor Log</span>
                  </div>
                  <span className="text-[8px] text-cp-cyan/50">NODE: ALPHA-01</span>
                </div>
                <div className="bg-black/90 p-4 text-[10px] border border-white/5 flex-grow overflow-y-auto max-h-[150px] scrollbar-thin scrollbar-thumb-cp-cyan/30">
                  {logs.map((log, i) => (
                    <div key={i} className="mb-1 text-gray-400 font-mono flex gap-2">
                      <span className="text-cp-cyan shrink-0">[{i}]</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  <motion.div 
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2 h-3 bg-cp-cyan mt-1 inline-block"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Combat Engagement Log */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="cp-border p-5 bg-cp-dark/60"
        >
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <div className="flex items-center gap-3 text-cp-red">
              <Zap className="w-5 h-5 fill-cp-red/20" />
              <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em]">Combat Engagement Log</h2>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-cp-red/70 group">
                <ShieldAlert className="w-3 h-3 group-hover:scale-110 transition-transform" />
                HIGH ALERT
              </span>
              <span className="text-gray-600">ZA-MRC PROTOCOL 4.2</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
            <AnimatePresence initial={false}>
              {combatEvents.length > 0 ? (
                combatEvents.map((event) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 py-1.5 border-b border-white/5 group"
                  >
                    <span className="text-[9px] font-mono text-gray-500 w-16 shrink-0">{event.time}</span>
                    <div className={`w-1 h-3 shrink-0 ${
                      event.type === 'DAMAGE' ? 'bg-cp-red shadow-[0_0_5px_rgba(255,0,0,0.5)]' : 
                      event.type === 'ULT' ? 'bg-cp-yellow shadow-[0_0_5px_rgba(255,255,0,0.5)]' : 
                      event.type === 'HEAL' ? 'bg-cp-cyan shadow-[0_0_5px_rgba(0,255,255,0.5)]' : 
                      'bg-white'
                    }`} />
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`text-[9px] font-black uppercase shrink-0 ${
                        event.type === 'DAMAGE' ? 'text-cp-red' : 
                        event.type === 'ULT' ? 'text-cp-yellow' : 
                        event.type === 'HEAL' ? 'text-cp-cyan' : 
                        'text-white'
                      }`}>
                        [{event.type}]
                      </span>
                      <span className="text-[10px] text-gray-300 truncate tracking-tight group-hover:text-white transition-colors">{event.desc}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 py-4 text-center text-[10px] text-gray-600 uppercase tracking-widest animate-pulse">
                  No active combat localized in sector {gameState.district}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
