import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { 
  Sparkles, Send, Mic, MicOff, X, Terminal, Brain, 
  HelpCircle, ChevronRight, Activity, Loader2, Volume2 
} from 'lucide-react';

interface SenseiOracleProps {
  activeProfile?: 'cb77' | 'ac';
  gameState: {
    district: string;
    sub_district: string | null;
    time: string;
    weather: string;
    action: string;
    health_percent: number;
  };
  addLog: (msg: string) => void;
  isOpen?: boolean;
  setIsOpen?: (val: boolean) => void;
  forcedQuery?: string;
  clearForcedQuery?: () => void;
}

export default function SenseiOracle({ 
  activeProfile = 'cb77', 
  gameState, 
  addLog,
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen,
  forcedQuery,
  clearForcedQuery
}: SenseiOracleProps) {
  const isAc = activeProfile === 'ac';
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : localIsOpen;
  const setIsOpen = externalSetIsOpen !== undefined ? externalSetIsOpen : setLocalIsOpen;

  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Voice Simulation state
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceWaveTicks, setVoiceWaveTicks] = useState<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Monitor forced query triggers
  useEffect(() => {
    if (forcedQuery) {
      setIsOpen(true);
      handleQuery(forcedQuery);
      if (clearForcedQuery) {
        clearForcedQuery();
      }
    }
  }, [forcedQuery]);

  useEffect(() => {
    // Set initial greeting depending on profile
    setMessages([
      { 
        role: 'model', 
        text: isAc 
          ? "Greetings, Animus operator. I am the Abstergo Memory Oracle. Query me regarding sequence synchronization, genetic integrity, or cohort performance. We stand ready." 
          : "SENSEI Overwatch Neural Oracle online. I can analyze active Ethereum validators, slashing risks, MEV reward spikes, and client diversity. State your query, Netrunner." 
      }
    ]);
  }, [activeProfile]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Voice wave animation generator
  useEffect(() => {
    if (!isVoiceRecording) return;
    const interval = setInterval(() => {
      setVoiceWaveTicks(Array.from({ length: 15 }).map(() => Math.floor(Math.random() * 24) + 4));
    }, 100);
    return () => clearInterval(interval);
  }, [isVoiceRecording]);

  const queryChips = isAc ? [
    { label: "Check Genetic Integrity", text: "Report on the current synapse stabilization levels and overall genetic cohesion." },
    { label: "Analyze Memory Leak", text: "Are there any anomalies or desynchronization triggers detected in the local history?" },
    { label: "Synchronize Cohorts", text: "What is our current performance coefficients across all synchronized genetic nodes?" }
  ] : [
    { label: "Explain the MEV spike", text: "Explain why our MEV boost reward spiked recently and how to optimize execution layer fees." },
    { label: "Is there a slashing risk?", text: "Analyze client diversity and peer count to determine if we are at any slashing or leakage risk." },
    { label: "Compare validator rewards", text: "Compare the historical attestation rewards against block proposal yields over our selected range." }
  ];

  const handleQuery = async (userPrompt: string) => {
    if (!userPrompt.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: userPrompt }]);
    setInput('');
    setLoading(true);

    try {
      // Check for API key selection
      if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        await window.aistudio.openSelectKey();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const context = `
      Current Node Telemetry:
      - Active Validators: 14,842 (SenseiNode network)
      - Total Stake: 475,264 ETH (4.82% APR)
      - Network Effectiveness: 99.14%
      - Node Health Score: ${gameState.health_percent}%
      - Current Location: ${gameState.district} / ${gameState.sub_district || 'SYNCING'}
      - Meteorology: ${gameState.weather}
      - Current Action: ${gameState.action}
      `;

      const systemInstruction = isAc
        ? `You are the Abstergo Memory Oracle companion. Adopt a highly immersive historical and analytical tone, referencing genetic memory sequences, historical guilds of assassins, templar threat indices, and synapse synchronization. Answer the user's question about the active validator charts and metrics, referencing: ${context}. Keep your response concise (2-3 sentences max) and highly thematic.`
        : `You are the SENSEI Neural Oracle, a tactical validator overwatch AI connected to the Ethereum Beacon Chain and NetWatch. Maintain an elite, high-tech, slightly cynical cyberpunk tone. Answer the user's question about the active validator charts, rewards spikes, peer count alerts, and client diversity, referencing: ${context}. Keep your response concise (2-3 sentences max) and highly thematic.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      const text = response.text || "Overwatch link timeout. Node unable to resolve query.";
      setMessages(prev => [...prev, { role: 'model', text }]);
      addLog(`ORACLE: Telemetry request parsed successfully.`);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: `SYNC_ERROR: Unable to bridge neural query. ${err.message || 'Check Settings > Secrets.'}` }]);
    } finally {
      setLoading(false);
    }
  };

  // Simulate premium voice input sequence
  const startVoiceSim = () => {
    setIsVoiceRecording(true);
    addLog(`VOICE: Initializing neural vocoder stream...`);
    
    // Auto transcribe a voice preset after 3 seconds of waving
    setTimeout(() => {
      setIsVoiceRecording(false);
      const voicePresets = isAc ? [
        "Assess current synchronization level with Florence",
        "Generate a telemetry sync analysis report",
        "Sync node with Abstergo server"
      ] : [
        "Explain the recent MEV spike on the node",
        "Check slashing risks for Prysm client",
        "Synchronize telemetry across all validator nodes"
      ];
      const selected = voicePresets[Math.floor(Math.random() * voicePresets.length)];
      addLog(`VOICE: Transcribed [${selected}]`);
      handleQuery(selected);
    }, 2800);
  };

  return (
    <>
      {/* FLOATING SPARKLE BUTTON */}
      <div className="fixed bottom-24 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 relative shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:scale-110 pointer-events-auto cursor-pointer ${
            isOpen 
              ? 'bg-cp-red border-cp-red text-white' 
              : isAc 
              ? 'bg-cp-dark border-cp-yellow text-cp-yellow hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]'
              : 'bg-cp-dark border-cp-cyan text-cp-cyan hover:shadow-[0_0_20px_rgba(0,240,255,0.6)]'
          }`}
          title="Open Sensei Neural Oracle AI Co-Pilot"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <Brain className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cp-yellow rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cp-yellow rounded-full" />
            </>
          )}
        </button>
      </div>

      {/* CHAT CONTAINER OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-40 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] cp-border bg-cp-darker/95 z-40 flex flex-col font-mono shadow-[0_0_30px_rgba(0,0,0,0.8)]`}
          >
            {/* Header */}
            <div className={`p-3 border-b flex items-center justify-between ${isAc ? 'border-cp-yellow/30 bg-cp-yellow/5' : 'border-cp-cyan/30 bg-cp-cyan/5'}`}>
              <div className="flex items-center gap-2">
                <Brain className={`w-4 h-4 animate-pulse ${isAc ? 'text-cp-yellow' : 'text-cp-cyan'}`} />
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block leading-none ${isAc ? 'text-cp-yellow' : 'text-cp-cyan'}`}>
                    {isAc ? "Abstergo Memory Oracle" : "Sensei Neural Co-Pilot"}
                  </span>
                  <span className="text-[8px] text-gray-500 uppercase mt-1 block">SYS MODEL // GEMINI-3.5-FLASH</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Pane */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/10 pr-2">
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-2.5 rounded text-[11px] leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-cp-cyan/10 border border-cp-cyan/30 text-white' 
                      : 'bg-black/40 border border-white/5 text-gray-300'
                  }`}>
                    <span className="block text-[8px] text-gray-500 uppercase tracking-widest font-black mb-1">
                      {m.role === 'user' ? 'OPERATOR' : isAc ? 'ORACLE' : 'SENSEI_AI'}
                    </span>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-black/40 border border-white/5 p-2.5 rounded text-[11px] flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cp-yellow" />
                    <span>COGNITIVE BRIDGE TRANSLATING...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Chips Selector */}
            {messages.length < 4 && !loading && (
              <div className="px-4 py-2 border-t border-white/5 space-y-1 bg-black/20">
                <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest block mb-1">
                  Suggested Queries
                </span>
                <div className="flex flex-wrap gap-1">
                  {queryChips.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleQuery(chip.text)}
                      className="text-[9px] px-2 py-1 bg-white/5 hover:bg-cp-cyan hover:text-black border border-white/5 rounded transition-all text-left truncate max-w-full cursor-pointer font-bold uppercase"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Rec overlay */}
            <AnimatePresence>
              {isVoiceRecording && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-0 bottom-14 bg-black/95 border-t border-cp-red/30 p-4 flex flex-col items-center justify-center gap-3 z-50"
                >
                  <Volume2 className="w-6 h-6 text-cp-red animate-bounce" />
                  <span className="text-[10px] text-cp-red font-black tracking-widest uppercase animate-pulse">
                    RECEIVING NEURAL VOICE SPEECH...
                  </span>
                  
                  {/* Visualizer wave */}
                  <div className="flex items-end gap-1.5 h-8">
                    {voiceWaveTicks.map((val, idx) => (
                      <div 
                        key={idx} 
                        className="w-1 bg-cp-red rounded-t transition-all duration-100" 
                        style={{ height: `${val}px` }} 
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className="p-3 border-t border-white/5 bg-black/40 flex items-center gap-2">
              <button
                onClick={startVoiceSim}
                disabled={loading || isVoiceRecording}
                className="p-2 bg-white/5 hover:bg-cp-red hover:text-white rounded border border-white/5 transition-all text-gray-400 cursor-pointer disabled:opacity-30"
                title="Trigger simulated voice overwatch query"
              >
                <Mic className="w-3.5 h-3.5 text-cp-yellow" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery(input)}
                placeholder={isVoiceRecording ? "Synthesizing voice..." : isAc ? "Bridge query into Animus..." : "Query overwatch database..."}
                disabled={loading || isVoiceRecording}
                className="flex-grow bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cp-cyan placeholder-gray-600 font-mono disabled:opacity-50"
              />

              <button
                onClick={() => handleQuery(input)}
                disabled={loading || !input.trim() || isVoiceRecording}
                className="p-2 bg-cp-cyan hover:bg-white text-black rounded transition-all cursor-pointer disabled:opacity-30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
