import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, MapPin, Clock, CloudRain, Crosshair, ShieldAlert, Terminal, Zap, MessageSquare, Image as ImageIcon, Mic } from 'lucide-react';
import { AuthButton, useAuth } from './components/Auth';
import Chatbot from './components/Chatbot';
import MediaGen from './components/MediaGen';
import AudioTools from './components/AudioTools';

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

export default function App() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'media' | 'audio'>('dashboard');

  useEffect(() => {
    const eventSource = new EventSource('/api/stream');

    eventSource.onopen = () => {
      setIsConnected(true);
      addLog('SYSTEM: Connection established with Sensei Node.');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setGameState(data);
        addLog(`DATA: Received state update [${data.action.toUpperCase()}]`);
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
      addLog('SYSTEM: Triggering manual vision scan...');
      await fetch('/api/mock_update', { method: 'POST' });
    } catch (e) {
      addLog('ERROR: Failed to trigger mock update.');
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cp-darker text-cp-cyan font-display">
        <div className="text-center">
          <Zap className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl tracking-widest uppercase glitch-text" data-text="INITIALIZING SENSEI NODE">INITIALIZING SENSEI NODE</h1>
          <p className="mt-2 text-cp-yellow opacity-70">Awaiting telemetry from Vision Module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative p-4 md:p-8 flex flex-col">
      <div className="scanline" />
      
      {/* Header */}
      <header className="flex justify-between items-end mb-8 border-b border-cp-cyan/30 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-cp-yellow glitch-text uppercase" data-text="SENSEI NODE // VISION">
            SENSEI NODE // VISION
          </h1>
          <p className="text-cp-cyan font-mono text-sm tracking-widest mt-1">
            AUTONOMOUS NIGHT CITY GUIDE TELEMETRY
          </p>
        </div>
        <div className="text-right hidden md:block">
          <AuthButton />
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-4 mb-6 border-b border-cp-cyan/30 pb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-display font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'text-cp-yellow border-b-2 border-cp-yellow' : 'text-cp-cyan hover:text-white'}`}
        >
          <Activity className="w-5 h-5" /> Telemetry
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 font-display font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${activeTab === 'chat' ? 'text-cp-yellow border-b-2 border-cp-yellow' : 'text-cp-cyan hover:text-white'}`}
        >
          <MessageSquare className="w-5 h-5" /> Neural Link
        </button>
        <button 
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 font-display font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${activeTab === 'media' ? 'text-cp-yellow border-b-2 border-cp-yellow' : 'text-cp-cyan hover:text-white'}`}
        >
          <ImageIcon className="w-5 h-5" /> Media Forge
        </button>
        <button 
          onClick={() => setActiveTab('audio')}
          className={`px-4 py-2 font-display font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${activeTab === 'audio' ? 'text-cp-yellow border-b-2 border-cp-yellow' : 'text-cp-cyan hover:text-white'}`}
        >
          <Mic className="w-5 h-5" /> Comms Hub
        </button>
      </nav>

      {/* Main Content Area */}
      {activeTab === 'dashboard' && (
        <main className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-grow">
          {/* Left Column - Vitals & Location */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="cp-border p-6"
            >
              <div className="flex items-center gap-3 mb-4 text-cp-cyan">
                <Activity className="w-6 h-6" />
                <h2 className="text-xl font-display font-bold uppercase tracking-wider">Biometrics</h2>
              </div>
              
              <div className="mb-2 flex justify-between font-bold">
                <span className="text-gray-400">HP</span>
                <span className={gameState.health_percent < 30 ? "text-cp-red animate-pulse" : "text-cp-yellow"}>
                  {gameState.health_percent}%
                </span>
              </div>
              <div className="h-4 bg-cp-dark border border-cp-cyan/30 relative overflow-hidden">
                <motion.div 
                  className={`absolute top-0 left-0 h-full ${gameState.health_percent < 30 ? 'bg-cp-red' : 'bg-cp-cyan'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${gameState.health_percent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              {gameState.health_percent < 30 && (
                <div className="mt-3 text-cp-red text-xs font-bold flex items-center gap-1 uppercase animate-pulse">
                  <ShieldAlert className="w-4 h-4" /> Critical Health Warning
                </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="cp-border p-6"
            >
              <div className="flex items-center gap-3 mb-4 text-cp-cyan">
                <MapPin className="w-6 h-6" />
                <h2 className="text-xl font-display font-bold uppercase tracking-wider">Location</h2>
              </div>
              <div className="text-3xl font-bold text-white uppercase mb-1">
                {gameState.district}
              </div>
              <div className="text-cp-yellow text-lg uppercase tracking-widest">
                {gameState.sub_district || "UNKNOWN SECTOR"}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="cp-border p-6 flex gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-cp-cyan">
                  <Clock className="w-5 h-5" />
                  <h2 className="text-sm font-display font-bold uppercase">Time</h2>
                </div>
                <div className="text-2xl font-bold text-white">{gameState.time}</div>
              </div>
              <div className="w-px bg-cp-cyan/30" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-cp-cyan">
                  <CloudRain className="w-5 h-5" />
                  <h2 className="text-sm font-display font-bold uppercase">Weather</h2>
                </div>
                <div className="text-xl font-bold text-white uppercase">{gameState.weather}</div>
              </div>
            </motion.div>
          </div>

          {/* Center/Right Column - Action & Logs */}
          <div className="md:col-span-8 flex flex-col gap-6">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="cp-border p-6 bg-cp-cyan/5"
            >
              <div className="flex items-center gap-3 mb-4 text-cp-cyan">
                <Crosshair className="w-6 h-6" />
                <h2 className="text-xl font-display font-bold uppercase tracking-wider">Current Status</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1 uppercase font-bold">Action State</p>
                  <div className={`text-4xl font-black uppercase ${gameState.action === 'combat' ? 'text-cp-red glitch-text' : 'text-white'}`} data-text={gameState.action}>
                    {gameState.action}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1 uppercase font-bold">Active Directive</p>
                  <div className="text-2xl font-bold text-cp-yellow uppercase leading-tight">
                    {gameState.active_quest || "NO ACTIVE QUEST"}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Terminal / Logs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="cp-border p-6 flex-grow flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-cp-cyan">
                  <Terminal className="w-6 h-6" />
                  <h2 className="text-xl font-display font-bold uppercase tracking-wider">System Log</h2>
                </div>
                <button 
                  onClick={triggerMockUpdate}
                  className="cp-button px-4 py-2 text-xs"
                >
                  Force Vision Scan
                </button>
              </div>
              
              <div className="bg-black/50 p-4 font-mono text-sm flex-grow overflow-y-auto border border-white/10">
                {logs.map((log, i) => (
                  <div key={i} className="mb-1 text-gray-300">
                    <span className="text-cp-cyan mr-2">{'>'}</span>
                    {log}
                  </div>
                ))}
                <div className="animate-pulse text-cp-cyan mt-2">_</div>
              </div>
            </motion.div>

          </div>
        </main>
      )}

      {activeTab === 'chat' && (
        user ? <Chatbot /> : <div className="text-center text-cp-red font-display mt-10">AUTH REQUIRED FOR NEURAL LINK</div>
      )}

      {activeTab === 'media' && (
        user ? <MediaGen /> : <div className="text-center text-cp-red font-display mt-10">AUTH REQUIRED FOR MEDIA FORGE</div>
      )}

      {activeTab === 'audio' && (
        user ? <AudioTools /> : <div className="text-center text-cp-red font-display mt-10">AUTH REQUIRED FOR COMMS HUB</div>
      )}
      
      {/* Footer Instructions */}
      <footer className="mt-8 text-center text-xs text-gray-500 font-mono">
        <p>To connect the Python Vision Module, point SENSEI_NODE_URL to: <span className="text-cp-cyan">{window.location.origin}/update_state</span></p>
      </footer>
    </div>
  );
}
