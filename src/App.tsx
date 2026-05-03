import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
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

  useEffect(() => {
    const eventSource = new EventSource('/api/stream');

    eventSource.onopen = () => {
      setIsConnected(true);
      addLog('SYSTEM: SENSEI-2026-ALPHA CORE INITIALIZED.');
      addLog('BRIDGE: ESTABLISHING ZA-GATEWAY HANDSHAKE...');
      addLog('LINK: AETHERIUM NODE SYNC READY.');
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
      addLog('SYSTEM: Triggering manual vision scan...');
      await fetch('/api/mock_update', { method: 'POST' });
    } catch (e) {
      addLog('ERROR: Failed to trigger mock update.');
    }
  };

  return (
    <div className="min-h-screen relative p-4 md:p-8 flex flex-col">
      <div className="scanline" />
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 border-b border-cp-cyan/30 pb-4 relative">
        <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-cp-cyan/20" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-cp-cyan rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-cp-cyan uppercase tracking-[0.3em]">Aetherium Node Synchronized</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-cp-yellow glitch-text uppercase" data-text="SENSEI // OVERWATCH">
            SENSEI // OVERWATCH
          </h1>
          <p className="text-cp-cyan font-mono text-xs tracking-[0.4em] mt-1 opacity-70">
            REGIONAL SUPERVISOR // NODE: SENSEI-2026-ALPHA
          </p>
        </div>
        <div className="w-full md:w-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase">
            <span>ZA-Gateway:</span>
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
              <h1 className="text-3xl tracking-widest uppercase glitch-text" data-text="INITIALIZING SENSEI MRC-OVERWATCH">INITIALIZING SENSEI MRC-OVERWATCH</h1>
              <p className="mt-2 text-cp-yellow opacity-70">Awaiting Regional Supervisor Handshake...</p>
            </div>
          </div>
        ) : (
          <Dashboard 
            gameState={gameState} 
            logs={logs} 
            triggerMockUpdate={triggerMockUpdate} 
          />
        )
      )}

      {activeTab === 'chat' && (
        user ? <Chatbot /> : <AuthPrompt title="Neural Link" />
      )}

      {activeTab === 'media' && (
        user ? <MediaGen /> : <AuthPrompt title="Media Forge" />
      )}

      {activeTab === 'audio' && (
        user ? <AudioTools /> : <AuthPrompt title="Comms Hub" />
      )}
      
      {/* Footer Instructions */}
      <footer className="mt-8 text-center text-xs text-gray-500 font-mono">
        <p>To connect the Python Vision Module, point SENSEI_NODE_URL to: <span className="text-cp-cyan">{window.location.origin}/update_state</span></p>
      </footer>
    </div>
  );
}
