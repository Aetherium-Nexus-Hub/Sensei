import { motion, AnimatePresence } from 'motion/react';
import { Activity, MapPin, Clock, CloudRain, Crosshair, Terminal, Zap, ShieldAlert, Cpu, Network, Users, TrendingUp, Link as LinkIcon, RefreshCw, Eye, BarChart3, Download } from 'lucide-react';
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
  addLog: (msg: string) => void;
  triggerMockUpdate: () => void;
  alertThreshold: number;
  setAlertThreshold: (val: number) => void;
  alertEnabled: boolean;
  setAlertEnabled: (val: boolean) => void;
  alertVisual: 'none' | 'vignette' | 'strobe';
  setAlertVisual: (val: 'none' | 'vignette' | 'strobe') => void;
  alertSound: 'off' | 'pulse' | 'siren' | 'chirp';
  setAlertSound: (val: 'off' | 'pulse' | 'siren' | 'chirp') => void;
  activeProfile?: 'cb77' | 'ac';
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

export default function Dashboard({ 
  gameState, 
  logs, 
  addLog,
  triggerMockUpdate,
  alertThreshold,
  setAlertThreshold,
  alertEnabled,
  setAlertEnabled,
  alertVisual,
  setAlertVisual,
  alertSound,
  setAlertSound,
  activeProfile = 'cb77'
}: DashboardProps) {
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS'>('SUCCESS');
  const [syncProgress, setSyncProgress] = useState(100);
  const [healthHistory, setHealthHistory] = useState<{ time: string; health: number }[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    activeQuest: activeProfile === 'ac' ? 'AWAITING COHORT SYNCHRONIZATION' : 'AWAITING REGIONAL FEED',
    storkStatus: 'AWAITING',
    constableStatus: 'ACTIVE',
    updatedAt: null
  });
  const [combatEvents, setCombatEvents] = useState<{ id: string; time: string; type: 'DAMAGE' | 'HEAL' | 'ELIM' | 'ULT'; desc: string }[]>([]);

  const isAc = activeProfile === 'ac';

  const handleDownloadLogs = (format: 'json' | 'csv') => {
    if (logs.length === 0) return;

    const parsedLogs = logs.map((log, index) => {
      // Parse timestamp e.g. [11:04:12] and message
      const match = log.match(/^\[(.*?)\] (.*)$/);
      if (match) {
        return {
          id: index,
          timestamp: match[1],
          message: match[2]
        };
      }
      return {
        id: index,
        timestamp: new Date().toLocaleTimeString(),
        message: log
      };
    });

    let fileContent = '';
    let mimeType = '';
    let fileExtension = '';

    if (format === 'json') {
      fileContent = JSON.stringify(parsedLogs, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else {
      // CSV Export
      const headers = ['ID', 'Timestamp', 'Message'];
      const rows = parsedLogs.map(item => {
        const escapedMsg = item.message.replace(/"/g, '""');
        return `${item.id},"${item.timestamp}","${escapedMsg}"`;
      });
      fileContent = [headers.join(','), ...rows].join('\n');
      mimeType = 'text/csv';
      fileExtension = 'csv';
    }

    const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toLocaleTimeString().replace(/:/g, '-');
    link.setAttribute('download', `telemetry_logs_${dateStr}_${timeStr}.${fileExtension}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLog(`SYSTEM: Telemetry logs exported as ${format.toUpperCase()}`);
  };

  const terms = {
    infrastructure: isAc ? "Animus Core Matrix" : "Regional Infrastructure",
    nodeStatus: isAc ? "ANIMUS CORE CHASSIS" : "NODE STATUS",
    nodeVal: isAc ? "ABSTERGO-RECON-V4" : "SENSEI-2026-ALPHA",
    gateway: isAc ? "MEMOR-GATE" : "ZA-GATEWAY",
    nodeStatusLabel: isAc ? "SYNAPSE ANCHOR" : "AETHERIUM NODE",
    storkText: isAc ? "GENETIC ANCHOR" : "STORK PROTOCOL",
    storkStatus: isAc ? (telemetry.storkStatus === 'ACTIVE' ? 'SYNCHRONIZED' : 'AWAITING CODES') : (telemetry.storkStatus === 'ACTIVE' ? 'STORK: ACTIVE' : 'AWAITING STORK'),
    alarmSystem: isAc ? "Sync Integrity Alert" : "Alarm System",
    alarmSysNode: isAc ? "NODE // ANIMUS-INTEGRITY" : "NODE // ZA-ALARM",
    alarmTrigger: isAc ? "SYNCHRONIZATION SAFEGUARD" : "ALARM TRIGGER LINK",
    thresholdTrigger: isAc ? "SYNC BOUNDARY TRIG" : "THRESHOLD TRIGGER",
    thresholdLabel: isAc ? "SYNAPSE" : "HEALTH",
    audioSynthLabel: isAc ? "CHORAL HARMONICS FREQ" : "AUDIO SYNTH FREQUENCY",
    rosterTitle: isAc ? "Brotherhood Cohort" : "Team Roster",
    rosterProtocol: isAc ? "ANIMUS // HISTORIC-SYN" : "SENSEI // ZA-MRC",
    mrcLink: isAc ? "ANIMUS // MEMORY-SYNC" : "SENSEI // MRC-LINK",
    mrcSubTitle: isAc ? "Memetic Reconstruction Stream" : "Partner-Tracker Interface v2.5",
    targetTitle: isAc ? "Local Genome: DESMOND-SYNC" : "Local Target: CLAUDE-TRACKER",
    syncBtn: isAc ? "RE-SYNCHRONIZE MEMORY STREAM" : "INITIATE CLAUDE-SYNC",
    syncMeter: isAc ? "Sequence Sync Progress" : "Telemetric Ingestion Meter",
    synergyCoeff: isAc ? "Genome Affinity Matrix" : "Player Synergy Coefficient",
    synergyDetail: isAc ? "EZIO + ALTAÏR MEMORY : " : "HULK + IRON MAN : ",
    liveTelemetry: isAc ? "Historical Telemetry" : "Live Telemetry",
    feedLabel: isAc ? "Animus Genome Feed" : "ZA-MRC Sector Feed",
    stabilityTitle: isAc ? "DNA Synapse Integrity" : "Core Roster Stability",
    trendTitle: isAc ? "Memory Retraction Coefficient" : "Health Trend Analysis",
    opDist: isAc ? "Memory Era / Sector" : "Operational Dist.",
    activeSector: isAc ? "Memory Coordinates" : "Active Sector",
    meteorology: isAc ? "ERA CLIMATE" : "METEOROLOGY",
    missionControl: isAc ? "Sequence Memory Hub" : "Mission Control",
    activeDirective: isAc ? "Sequence Objective & Anchor" : "Active Directive",
    currentAction: isAc ? "Sync State: " : "Current Action: ",
    supervisorLog: isAc ? "Abstergo Feed Logs" : "Supervisor Log",
    nodeAlpha: isAc ? "NODE: SYNC-07" : "NODE: ALPHA-01",
    combatLogTitle: isAc ? "Genetic Synchronicity Stream" : "Combat Engagement Log",
    highAlertText: isAc ? "DNA DRIFT WARNING" : "HIGH ALERT",
    logProtocol: isAc ? "MEM-GRID PROTOCOL 8.9" : "ZA-MRC PROTOCOL 4.2",
    emptyEngagement: isAc ? "No memory drift localized in historical sector " : "No active combat localized in sector "
  };

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
    if (gameState.action) {
      const types: ('DAMAGE' | 'HEAL' | 'ELIM' | 'ULT')[] = ['DAMAGE', 'ULT', 'DAMAGE', 'HEAL'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      const descriptions = isAc ? {
        'DAMAGE': `Ezio executed synchronized hidden blade counter-strike in ${gameState.district}`,
        'HEAL': 'Altaïr localized Damascus medicinal herbs inside DNA thread',
        'ELIM': 'Templar captain neutralized silently in the shadows',
        'ULT': 'Brotherhood signal called: Arrow Storm synchronized!'
      } : {
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
  }, [gameState.health_percent, gameState.time, gameState.action, isAc]);

  const roster: RosterPlayer[] = isAc ? [
    { id: 'p1', name: 'Ezio Auditore', handle: 'MENTOR AUDITORE', role: 'Grandmaster', status: 'ACTIVE', performance: 99 },
    { id: 'p2', name: 'Altaïr Ibn-La\'Ahad', handle: 'ALTAÏR THE SEER', role: 'Grandmaster founder', status: 'ACTIVE', performance: 97 },
    { id: 'p3', name: 'Natasha Romanoff', handle: 'WIDOW_MEM', role: 'Memory Infiltrator', status: 'ACTIVE', performance: 92 },
    { id: 'p4', name: 'Bruce Banner', handle: 'HULK_MEM', role: 'Memory Vanguard', status: 'ACTIVE', performance: 85 },
    { id: 'p5', name: 'Kassandra of Sparta', handle: 'EAGLE KASSANDRA', role: 'Keeper of staff', status: 'ACTIVE', performance: 96 },
    { id: 'p6', name: 'Bayek of Siwa', handle: 'MEDJAY BAYEK', role: 'First Hidden One', status: 'OFFLINE', performance: 90 },
  ] : [
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
              activeQuest: gameState.active_quest || (isAc ? 'SEQUENCE MEMORY RECONSTRUCTION' : 'PATROL SENSEI SECTOR'),
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

  const triggerSimulation = async (health: number, action: string) => {
    try {
      addLog(`SYSTEM: INITIATING SYSTEM SIMULATOR [HEALTH_PCT: ${health}%, ACTION: ${action.toUpperCase()}]`);
      
      const payload = isAc ? {
        health_percent: health,
        action: action,
        district: health < 30 ? "Masyaf" : "Florence",
        sub_district: health < 30 ? "Assassins Citadel" : "Ponte Vecchio",
        active_quest: health < 30 ? "The Renegade Trial" : "Sequence 4: Memory 2 // Double Intrigue"
      } : { 
        health_percent: health, 
        action: action,
        district: health < 30 ? "Pacifica" : "Westbrook",
        sub_district: health < 30 ? "Coastview" : "Japantown", 
        active_quest: health < 30 ? "CRITICAL PROTOCOL 4.2" : "Play It Safe"
      };

      await fetch('/update_state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Simulation error", e);
      addLog(`ERROR: FAILED TO INJECT SIMULI-TELEMETRY FEED.`);
    }
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
            <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em]">{terms.infrastructure}</h2>
          </div>
          
          <div className="space-y-3 text-[10px] uppercase">
            <div className="flex justify-between items-center group">
              <span className="text-gray-500">{terms.gateway}</span>
              <span className="text-cp-cyan flex items-center gap-2 font-bold">
                <div className="w-2 h-2 bg-cp-cyan rounded-full animate-pulse" />
                ACTIVE
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{terms.nodeStatusLabel}</span>
              <span className="text-white flex items-center gap-2">
                <ShieldAlert className="w-3 h-3 text-cp-cyan" />
                DETERMINISTIC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{terms.nodeStatus}</span>
              <span className="text-cp-yellow">{terms.nodeVal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{terms.storkText}</span>
              <span className={telemetry.storkStatus === 'ACTIVE' ? 'text-cp-cyan font-bold' : 'text-cp-red animate-pulse'}>
                {terms.storkStatus}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tactical Alarm Config */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          className={`cp-border p-5 bg-cp-dark/60 border-l-4 ${gameState.health_percent < alertThreshold && alertEnabled ? 'border-l-cp-red shadow-[0_0_15px_rgba(255,0,60,0.15)]' : 'border-l-cp-yellow'}`}
        >
          <div className="flex items-center gap-3 mb-4 text-cp-yellow border-b border-cp-yellow/20 pb-2 justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-5 h-5 ${gameState.health_percent < alertThreshold && alertEnabled ? 'text-cp-red animate-pulse' : 'text-cp-yellow'}`} />
              <h2 className="text-sm font-display font-medium uppercase tracking-[0.2em]">{terms.alarmSystem}</h2>
            </div>
            <span className="text-[9px] text-gray-500 font-mono">{terms.alarmSysNode}</span>
          </div>

          <div className="space-y-4">
            {/* Alarm Enabled Toggle */}
            <div className="flex justify-between items-center bg-black/40 p-2 border border-white/5">
              <span className="text-[9px] text-gray-400 font-bold uppercase">{terms.alarmTrigger}</span>
              <button
                onClick={() => setAlertEnabled(!alertEnabled)}
                className={`px-3 py-1 text-[9px] font-bold uppercase transition-colors pointer-events-auto cursor-pointer ${alertEnabled ? 'bg-cp-red text-white' : 'bg-gray-800 text-gray-500'}`}
              >
                {alertEnabled ? 'ARMED' : 'BYPASSED'}
              </button>
            </div>

            {/* Threshold Slider */}
            <div>
              <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wider mb-1">
                <span>{terms.thresholdTrigger}</span>
                <span className={`font-bold ${gameState.health_percent < alertThreshold ? 'text-cp-red animate-pulse' : 'text-cp-yellow'}`}>{alertThreshold}% {terms.thresholdLabel}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-cp-yellow bg-black h-1 rounded cursor-pointer pointer-events-auto"
              />
            </div>

            {/* Visual Style Selection */}
            <div>
              <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">VISUAL EFFECT</span>
              <div className="grid grid-cols-3 gap-1">
                {(['vignette', 'strobe', 'none'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setAlertVisual(style)}
                    className={`py-1 text-[8px] font-bold uppercase border transition-colors pointer-events-auto cursor-pointer ${alertVisual === style ? 'bg-cp-cyan text-black border-cp-cyan' : 'border-white/5 text-gray-400 hover:border-white/20'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Synth Selection */}
            <div>
              <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">{terms.audioSynthLabel}</span>
              <div className="grid grid-cols-4 gap-1">
                {(['siren', 'pulse', 'chirp', 'off'] as const).map((sound) => (
                  <button
                    key={sound}
                    onClick={() => setAlertSound(sound)}
                    className={`py-1 text-[8px] font-bold uppercase border transition-colors pointer-events-auto cursor-pointer ${alertSound === sound ? 'bg-cp-cyan text-black border-cp-cyan' : 'border-white/5 text-gray-400 hover:border-white/20'}`}
                  >
                    {sound}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Simulation Controls */}
            <div className="border-t border-white/5 pt-3">
              <span className="block text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">TELEMETRY INJECTOR (TESTS)</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => triggerSimulation(100, 'driving')}
                  className="py-1 px-1 text-[8px] font-bold uppercase bg-black text-gray-400 border border-white/5 hover:border-cp-cyan/40 hover:text-white pointer-events-auto cursor-pointer transition-colors"
                >
                  100% OK
                </button>
                <button
                  type="button"
                  onClick={() => triggerSimulation(45, 'stealth')}
                  className="py-1 px-1 text-[8px] font-bold uppercase bg-black text-gray-400 border border-white/5 hover:border-cp-cyan/40 hover:text-white pointer-events-auto cursor-pointer transition-colors"
                >
                  45% CAUTION
                </button>
                <button
                  type="button"
                  onClick={() => triggerSimulation(15, 'combat')}
                  className="py-1 px-1 text-[8px] font-bold uppercase bg-cp-red/15 text-cp-red border border-cp-red/30 hover:bg-cp-red hover:text-white pointer-events-auto cursor-pointer transition-colors"
                >
                  15% CRITICAL
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Team Roster */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="cp-border p-5 bg-cp-dark/40 flex-grow"
        >
          <div className="flex items-center justify-between mb-4 text-cp-cyan border-b border-cp-cyan/20 pb-2">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em]">{terms.rosterTitle}</h2>
            </div>
            <span className="text-[10px] text-gray-500">{terms.rosterProtocol}</span>
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
          <div className="absolute top-0 right-0 p-2 text-[8px] text-cp-yellow/30 uppercase tracking-[0.2em]">{terms.mrcSubTitle}</div>
          
          <div className="flex items-center gap-3 text-cp-yellow mb-6">
            <LinkIcon className="w-6 h-6" />
            <h2 className="text-xl font-display font-bold uppercase tracking-[0.3em]">{terms.mrcLink}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="p-4 bg-black/60 border border-cp-yellow/20 relative group">
                <div className="absolute -top-2 left-4 bg-black px-2 text-[8px] text-gray-500 uppercase">{terms.targetTitle}</div>
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
                {terms.syncBtn}
              </button>
            </div>

            <div className="flex flex-col justify-between py-1">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                    <span>{terms.syncMeter}</span>
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
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest">{terms.synergyCoeff}</div>
                    <div className="text-sm font-black text-white uppercase tracking-wider">{terms.synergyDetail}<span className="text-cp-yellow">0.945</span></div>
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
                  <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em]">{terms.liveTelemetry}</h2>
                </div>
                <div className="text-[8px] text-cp-cyan/40 uppercase">{terms.feedLabel}</div>
              </div>
              
              <div className="space-y-6 flex-grow">
                <div>
                  <div className="flex justify-between text-[10px] uppercase mb-2">
                    <span className="text-gray-500">{terms.stabilityTitle}</span>
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
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest">{terms.trendTitle}</span>
                  </div>
                  <TelemetryChart data={healthHistory} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black/40 border border-white/5">
                    <div className="text-[9px] text-gray-500 uppercase mb-1">{terms.opDist}</div>
                    <div className="text-xs font-bold text-white uppercase">{gameState.district}</div>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5">
                    <div className="text-[9px] text-gray-500 uppercase mb-1">{terms.activeSector}</div>
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
                      <div className="text-[8px] text-gray-500 uppercase">{terms.meteorology}</div>
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
                <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em]">{terms.missionControl}</h2>
              </div>
              
              <div className="p-4 bg-cp-yellow/10 border border-cp-yellow/30 mb-6 relative">
                <div className="absolute -top-2 left-4 bg-cp-dark px-2 text-[8px] text-cp-yellow uppercase font-bold">{terms.activeDirective}</div>
                <div className="text-lg font-black text-white uppercase tracking-tighter leading-none glitch-text mb-2" data-text={telemetry.activeQuest}>
                  {telemetry.activeQuest}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 uppercase">{terms.currentAction}<span className="text-white">{gameState.action}</span></span>
                  <span className="text-[9px] text-cp-yellow border border-cp-yellow/30 px-1 font-bold">REAL-TIME SYNC</span>
                </div>
              </div>

              <div className="flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cp-cyan" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{terms.supervisorLog}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-gray-600 uppercase hidden sm:inline">Export:</span>
                    <button 
                      onClick={() => handleDownloadLogs('json')}
                      disabled={logs.length === 0}
                      className="px-1.5 py-0.5 bg-cp-cyan/10 hover:bg-cp-cyan/30 active:bg-cp-cyan text-cp-cyan active:text-black border border-cp-cyan/30 rounded text-[8px] tracking-wider transition-all uppercase font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                      title="Download Log as JSON"
                    >
                      <Download className="w-2.5 h-2.5" /> JSON
                    </button>
                    <button 
                      onClick={() => handleDownloadLogs('csv')}
                      disabled={logs.length === 0}
                      className="px-1.5 py-0.5 bg-cp-yellow/10 hover:bg-cp-yellow/30 active:bg-cp-yellow text-cp-yellow active:text-black border border-cp-yellow/30 rounded text-[8px] tracking-wider transition-all uppercase font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                      title="Download Log as CSV"
                    >
                      <Download className="w-2.5 h-2.5" /> CSV
                    </button>
                    <span className="text-gray-800">|</span>
                    <span className="text-[8px] text-cp-cyan/50">{terms.nodeAlpha}</span>
                  </div>
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
              <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em]">{terms.combatLogTitle}</h2>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-cp-red/70 group">
                <ShieldAlert className="w-3 h-3 group-hover:scale-110 transition-transform" />
                {terms.highAlertText}
              </span>
              <span className="text-gray-600">{terms.logProtocol}</span>
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
                  {terms.emptyEngagement} {gameState.district}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
