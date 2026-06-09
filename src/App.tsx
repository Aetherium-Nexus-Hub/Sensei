import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, MapPin, Clock, CloudRain, Crosshair, ShieldAlert, Terminal, Zap, MessageSquare, Image as ImageIcon, Mic } from 'lucide-react';
import { AuthButton, useAuth } from './components/Auth';
import { signInWithGoogle } from './firebase';
import Chatbot from './components/Chatbot';
import MediaGen from './components/MediaGen';
import AudioTools from './components/AudioTools';
import Dashboard from './components/Dashboard';

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

const AuthPrompt = ({ title }: { title: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] cp-border bg-cp-darker/80 p-8 text-center mt-6">
      <ShieldAlert className="w-16 h-16 text-cp-red mb-4 animate-pulse" />
      <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-cp-cyan mb-2">
        Access Denied: {title}
      </h2>
      <p className="text-gray-400 font-mono mb-6 max-w-md">
        Neural link authentication is required to access this module. Please verify your identity to continue.
      </p>
      <button onClick={signInWithGoogle} className="cp-button px-6 py-3 flex items-center gap-2">
        <Zap className="w-5 h-5" /> Initialize Link
      </button>
    </div>
  );
};

export default function App() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'media' | 'audio'>('dashboard');
  const [activeProfile, setActiveProfile] = useState<'cb77' | 'ac'>(() => {
    const saved = localStorage.getItem('active_profile');
    return (saved as 'cb77' | 'ac') || 'cb77';
  });

  useEffect(() => {
    localStorage.setItem('active_profile', activeProfile);
  }, [activeProfile]);

  const handleProfileSwitch = async (profile: 'cb77' | 'ac') => {
    setActiveProfile(profile);
    addLog(`SYSTEM: Terminal layer shifted to ${profile === 'ac' ? 'ASSASSIN COHORT [ANIMUS]' : 'MERC OVERWATCH [CB77]'}`);
    
    // Auto trigger a mock update representing the chosen profile to load matching telemetry immediately
    try {
      await fetch('/api/mock_update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });
    } catch (e) {
      console.error("Failed to propagate profile switch to backend:", e);
    }
  };

  const [alertThreshold, setAlertThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('alert_threshold');
    return saved ? parseInt(saved, 10) : 30;
  });
  const [alertEnabled, setAlertEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('alert_enabled');
    return saved ? saved === 'true' : true;
  });
  const [alertVisual, setAlertVisual] = useState<'vignette' | 'strobe' | 'none'>(() => {
    const saved = localStorage.getItem('alert_visual');
    return (saved as any) || 'vignette';
  });
  const [alertSound, setAlertSound] = useState<'off' | 'pulse' | 'siren' | 'chirp'>(() => {
    const saved = localStorage.getItem('alert_sound');
    return (saved as any) || 'siren';
  });

  useEffect(() => {
    localStorage.setItem('alert_threshold', alertThreshold.toString());
  }, [alertThreshold]);

  useEffect(() => {
    localStorage.setItem('alert_enabled', alertEnabled.toString());
  }, [alertEnabled]);

  useEffect(() => {
    localStorage.setItem('alert_visual', alertVisual);
  }, [alertVisual]);

  useEffect(() => {
    localStorage.setItem('alert_sound', alertSound);
  }, [alertSound]);

  const isAlertTriggered = isConnected && gameState && gameState.health_percent < alertThreshold && alertEnabled;

  // Persisted refs for the audio synthesizer context
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<any>(null);

  const stopAlarm = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isAlertTriggered && alertSound !== 'off') {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const actx = audioCtxRef.current;
      if (actx.state === 'suspended') {
        const resumeAudio = () => {
          actx.resume().then(() => {
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('touchstart', resumeAudio);
          });
        };
        window.addEventListener('click', resumeAudio);
        window.addEventListener('touchstart', resumeAudio);
      }

      stopAlarm();

      const playBeep = () => {
        if (actx.state === 'suspended') return;
        try {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          
          osc.connect(gain);
          gain.connect(actx.destination);
          
          if (alertSound === 'siren') {
            osc.type = 'sawtooth';
            // Classic alternating frequency alarm
            const isHigh = Math.floor(actx.currentTime * 2) % 2 === 0;
            osc.frequency.setValueAtTime(isHigh ? 900 : 600, actx.currentTime);
            osc.frequency.linearRampToValueAtTime(isHigh ? 1100 : 700, actx.currentTime + 0.35);
            gain.gain.setValueAtTime(0.04, actx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, actx.currentTime + 0.35);
            osc.start();
            osc.stop(actx.currentTime + 0.35);
          } else if (alertSound === 'chirp') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, actx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, actx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.06, actx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, actx.currentTime + 0.15);
            osc.start();
            osc.stop(actx.currentTime + 0.15);
          } else { // 'pulse'
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, actx.currentTime);
            gain.gain.setValueAtTime(0.06, actx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, actx.currentTime + 0.4);
            osc.start();
            osc.stop(actx.currentTime + 0.4);
          }
        } catch (e) {
          console.warn("Audio Context alert warning beep failed:", e);
        }
      };

      playBeep();
      const intervalMs = alertSound === 'chirp' ? 400 : alertSound === 'siren' ? 700 : 900;
      audioIntervalRef.current = setInterval(playBeep, intervalMs);
    } else {
      stopAlarm();
    }

    return () => stopAlarm();
  }, [isAlertTriggered, alertSound]);

  useEffect(() => {
    const eventSource = new EventSource('/api/stream');

    eventSource.onopen = () => {
      setIsConnected(true);
      addLog('SYSTEM: DUAL-METRIC SECURE NODE STREAM ESTABLISHED.');
      addLog('BRIDGE: INGESTING SENSEI TERMINAL LINK DATA...');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setGameState(data);
        addLog(`TELEMETRY: DATA INGESTED [SECTOR: ${data.sub_district || 'UNKNOWN'}]`);
      } catch (e) {
        console.error('Error parsing SSE data', e);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      addLog('ERROR: Connection lost. Attempting to reconnect...');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
      return newLogs.slice(-8); // Keep last 8 logs
    });
  };

  const triggerMockUpdate = async () => {
    try {
      addLog(`SYSTEM: Requesting telemetry synchronization [Profile: ${activeProfile.toUpperCase()}]...`);
      await fetch('/api/mock_update', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: activeProfile })
      });
    } catch (e) {
      addLog('ERROR: Failed to trigger mock update.');
    }
  };

  return (
    <div className={`min-h-screen relative p-4 md:p-8 flex flex-col transition-colors duration-500 ${activeProfile === 'ac' ? 'theme-ac' : 'theme-cb77'}`}>
      <div className="scanline" />

      {/* Visual Alarm Overlay */}
      <AnimatePresence>
        {isAlertTriggered && (
          <>
            {/* Blinking red border/vignette */}
            {alertVisual === 'vignette' && (
              <motion.div
                key="alert-vignette"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="fixed inset-0 border-[6px] md:border-[12px] border-cp-red pointer-events-none z-50 shadow-[inset_0_0_80px_rgba(255,0,60,0.5)]"
              />
            )}

            {/* Intense strobe pattern */}
            {alertVisual === 'strobe' && (
              <motion.div
                key="alert-strobe"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.4, 0.1] }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
                className="fixed inset-0 bg-cp-red/10 pointer-events-none z-50 mix-blend-color-burn"
              />
            )}

            {/* Theme-adapted emergency info widget overlay */}
            <motion.div
              key="alert-banner"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-black/95 border-2 border-cp-red shadow-[0_0_15px_rgba(255,0,60,0.5)] px-4 py-2 font-mono text-center pointer-events-auto"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-cp-red animate-bounce shrink-0" />
                <div className="text-left select-none">
                  <div className="text-xs font-black text-cp-red uppercase tracking-wider animate-pulse font-display">
                    {activeProfile === 'ac' ? 'WARNING: ANIMUS DESYNCHRONIZATION DEVIATION' : 'CRITICAL WARNING: SYSTEM FAILURE IMMINENT'}
                  </div>
                  <div className="text-[10px] text-white">
                    {activeProfile === 'ac' ? 'SYNAPSE ALIGNMENT LEVEL:' : 'CORE ROSTER STABILITY BELOW THRESHOLD:'} <span className="text-cp-red font-bold">{gameState?.health_percent}%</span> (LIMIT: {alertThreshold}%)
                  </div>
                </div>
                {/* Silence/Mute button for quick UX peace */}
                <button 
                  onClick={() => setAlertEnabled(false)}
                  className="bg-cp-red hover:bg-white text-white hover:text-black text-[9px] uppercase px-2 py-1 font-bold ml-3 transition-colors cursor-pointer"
                >
                  Silence
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 border-b border-cp-cyan/30 pb-4 relative">
        <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-cp-cyan/20" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-cp-cyan rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-cp-cyan uppercase tracking-[0.3em]">
              {activeProfile === 'ac' ? 'Animus Memory Stream Stabilized' : 'Aetherium Node Synchronized'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-cp-yellow glitch-text uppercase" data-text={activeProfile === 'ac' ? "ANIMUS // SYNAPSE" : "SENSEI // OVERWATCH"}>
            {activeProfile === 'ac' ? "ANIMUS // SYNAPSE" : "SENSEI // OVERWATCH"}
          </h1>
          <p className="text-cp-cyan font-mono text-xs tracking-[0.4em] mt-1 opacity-70">
            {activeProfile === 'ac' ? 'ABSTERGO MEMORY RECONSTRUCTION CORE' : 'REGIONAL SUPERVISOR // NODE: SENSEI-2026-ALPHA'}
          </p>
        </div>
        <div className="w-full md:w-auto flex flex-col items-end gap-2">
          {/* Profile Switcher Layer */}
          <div className="flex items-center gap-1 bg-black/60 p-1 border border-cp-cyan/20 rounded mb-2">
            <span className="text-[8px] font-mono text-gray-500 uppercase px-1.5">Layer:</span>
            <button
              onClick={() => handleProfileSwitch('cb77')}
              className={`px-2.5 py-0.5 text-[9px] font-bold uppercase transition-all duration-300 ${activeProfile === 'cb77' ? 'bg-cp-cyan text-black' : 'text-cp-cyan hover:bg-cp-cyan/15'}`}
            >
              CB77 NIGHT
            </button>
            <button
              onClick={() => handleProfileSwitch('ac')}
              className={`px-2.5 py-0.5 text-[9px] font-bold uppercase transition-all duration-300 ${activeProfile === 'ac' ? 'bg-cp-yellow text-black' : 'text-cp-yellow hover:bg-cp-yellow/15'}`}
            >
              AC ANIMUS
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase">
            <span>{activeProfile === 'ac' ? 'Animus Link:' : 'ZA-Gateway:'}</span>
            <span className="text-cp-cyan">Connected</span>
          </div>
          <AuthButton />
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-4 mb-6 border-b border-cp-cyan/30 pb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-display font-bold uppercase tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'text-cp-yellow border-b-2 border-cp-yellow' : 'text-cp-cyan hover:text-white'}`}
        >
          <Activity className="w-5 h-5" /> Telemetry
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 font-display font-bold uppercase tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'chat' ? 'text-cp-yellow border-b-2 border-cp-yellow' : 'text-cp-cyan hover:text-white'}`}
        >
          <MessageSquare className="w-5 h-5" /> Neural Link
        </button>
        <button 
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 font-display font-bold uppercase tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'media' ? 'text-cp-yellow border-b-2 border-cp-yellow' : 'text-cp-cyan hover:text-white'}`}
        >
          <ImageIcon className="w-5 h-5" /> Media Forge
        </button>
        <button 
          onClick={() => setActiveTab('audio')}
          className={`px-4 py-2 font-display font-bold uppercase tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'audio' ? 'text-cp-yellow border-b-2 border-cp-yellow' : 'text-cp-cyan hover:text-white'}`}
        >
          <Mic className="w-5 h-5" /> Comms Hub
        </button>
      </nav>

      {/* Main Content Area */}
      {activeTab === 'dashboard' && (
        !gameState ? (
          <div className="flex-grow flex items-center justify-center text-cp-cyan font-display">
            <div className="text-center">
              <Zap className="w-16 h-16 mx-auto mb-4 animate-pulse" />
              <h1 className="text-3xl tracking-widest uppercase glitch-text" data-text={activeProfile === 'ac' ? "INITIALIZING ANIMUS SYNAPSE CORE" : "INITIALIZING SENSEI MRC-OVERWATCH"}>
                {activeProfile === 'ac' ? "INITIALIZING ANIMUS SYNAPSE CORE" : "INITIALIZING SENSEI MRC-OVERWATCH"}
              </h1>
              <p className="mt-2 text-cp-yellow opacity-70">
                {activeProfile === 'ac' ? "Calibrating Genetic Memetic Array..." : "Awaiting Regional Supervisor Handshake..."}
              </p>
            </div>
          </div>
        ) : (
          <Dashboard 
            gameState={gameState} 
            logs={logs} 
            addLog={addLog}
            triggerMockUpdate={triggerMockUpdate} 
            alertThreshold={alertThreshold}
            setAlertThreshold={setAlertThreshold}
            alertEnabled={alertEnabled}
            setAlertEnabled={setAlertEnabled}
            alertVisual={alertVisual}
            setAlertVisual={setAlertVisual}
            alertSound={alertSound}
            setAlertSound={setAlertSound}
            activeProfile={activeProfile}
          />
        )
      )}

      {activeTab === 'chat' && (
        user ? <Chatbot activeProfile={activeProfile} /> : <AuthPrompt title={activeProfile === 'ac' ? "Animus Knowledge Link" : "Neural Link"} />
      )}

      {activeTab === 'media' && (
        user ? <MediaGen activeProfile={activeProfile} /> : <AuthPrompt title={activeProfile === 'ac' ? "Memetic Forge" : "Media Forge"} />
      )}

      {activeTab === 'audio' && (
        user ? <AudioTools activeProfile={activeProfile} /> : <AuthPrompt title={activeProfile === 'ac' ? "Animus Communication Hub" : "Comms Hub"} />
      )}
      
      {/* Footer Instructions */}
      <footer className="mt-8 text-center text-xs text-gray-500 font-mono">
        <p>To connect the Python Vision Module, point SENSEI_NODE_URL to: <span className="text-cp-cyan">{window.location.origin}/update_state</span></p>
      </footer>
    </div>
  );
}
