import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal as TerminalIcon, 
  Cpu, 
  ShieldAlert, 
  Zap, 
  Flame, 
  Wrench, 
  Compass, 
  Sparkles, 
  Volume2, 
  VolumeX,
  RotateCcw,
  RefreshCw,
  TrendingUp,
  Link as LinkIcon,
  Sword,
  Bot
} from 'lucide-react';

interface StoryChoice {
  text: string;
  description: string;
  action: string; // key of the action to execute
}

interface Chapter {
  promptId: string;
  speech: string;
  buddySpeech: string;
  choices: StoryChoice[];
}

interface FeedMessage {
  id: string;
  title: string;
  text: string;
  time: string;
  type: 'system' | 'critical' | 'forza' | 'gold';
}

interface Weapon {
  id: string;
  name: string;
  tier: 'EPIC' | 'LEGENDARY';
  stats: string;
  icon: string;
}

export default function HorizonTerminal() {
  // Sound toggle to ensure good user experience
  const [muted, setMuted] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'story' | 'stats'>('story');

  // Interactive state
  const [lethality, setLethality] = useState(27088);
  const [mitigation, setMitigation] = useState(27.60);
  const [craftingLevel, setCraftingLevel] = useState(14);
  const [alignment, setAlignment] = useState<'STREETKID_REBEL' | 'STREET_REBELLION' | 'SYSTEM_INTEGRATION' | 'LEGACY_PIONEER' | 'STREET_STABILITY'>('STREETKID_REBEL');
  const [syncPercentage, setSyncPercentage] = useState(68);
  const [currentChapter, setCurrentChapter] = useState<string>('GIM_CROSSROADS');
  const [upgradedCocktailStick, setUpgradedCocktailStick] = useState(false);

  // Modal alert system
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');

  // Feed log history
  const [feedMessages, setFeedMessages] = useState<FeedMessage[]>([
    {
      id: 'init-msg',
      title: 'SYSTEM INITIALIZATION SEQUENCE COMPLETE',
      text: "Welcome back, XCentricG. Our diagnostic matrices are online, detecting system anomalies crossing multiple save game protocols. The simulation boundary has reached a critical threshold inside the cinema ruins of the Grand Imperial Mall.",
      time: new Date().toLocaleTimeString(),
      type: 'system'
    }
  ]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context on user interaction
  const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playBeep = (freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = type;
      osc.frequency.value = freq;
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio synthesis blocked or not supported', e);
    }
  };

  const playDecisionChime = () => {
    playBeep(440, 0.15, 'triangle');
    setTimeout(() => playBeep(880, 0.25, 'triangle'), 100);
  };

  const playGlitchAlert = () => {
    playBeep(120, 0.4, 'sawtooth');
    setTimeout(() => playBeep(90, 0.2, 'sawtooth'), 150);
  };

  const playBootSound = () => {
    playBeep(523.25, 0.1, 'sine'); // C5
    setTimeout(() => playBeep(659.25, 0.1, 'sine'), 80); // E5
    setTimeout(() => playBeep(783.99, 0.15, 'sine'), 160); // G5
    setTimeout(() => playBeep(1046.50, 0.3, 'sine'), 240); // C6
  };

  // Play boot sound on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      playBootSound();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Story Chapters Database matching Pilot XCentricG's exact sequence log
  const storyChapters: Record<string, Chapter> = {
    'GIM_CROSSROADS': {
      promptId: 'GIM_CROSSROADS',
      speech: "Both options treat V as an expendable asset node. State your blade trajectory once the boss arena line triggers.",
      buddySpeech: "Aggression against us is punished by the hardware itself. That Cocktail stick is ready for action, Pilot.",
      choices: [
        {
          text: "⚔️ [ SLICE THE PROXY OVERLAY ]",
          description: "Slice through Placide's proxy link with Satori & Cocktail Stick.",
          action: 'SLICE_PROXY'
        },
        {
          text: "🌐 [ NETWATCH HANDSHAKE ]",
          description: "Handshake NetWatch to clean up the Voodoo Boys' simulation friction.",
          action: 'NETWATCH_JOIN'
        },
        {
          text: "🚗 [ MANUAL SILVIA REBOOT ]",
          description: "Reject both! Escape GIM ruins in a custom Nissan Silvia spec-R.",
          action: 'SILVIA_ESCAPE'
        }
      ]
    },
    'SLICE_PROXY_BRANCH': {
      promptId: 'ANIMUS_TIMELINE_SYNC',
      speech: "Placide's intrusive link is severed, bleeding cyberware sparks across V's optical matrix! Buddy initiates an automatic memory transfer, synchronizing with historical timelines.",
      buddySpeech: "Brilliant execution, Pilot! Our lethality metric is climbing. But wait—we're hitting a massive timeline overlap. AC3 and Unity are feeding into the cache!",
      choices: [
        {
          text: "⚜️ [ TRAVEL TO SAINT-DENIS ]",
          description: "Explore Saint-Denis ruins (Franciade, 1800) in Unity epilogue.",
          action: 'DEAD_KINGS_DLC'
        },
        {
          text: "🦅 [ RE-INDEX COLONIAL NEW YORK ]",
          description: "Access Shay's Colonial logs (1754–1783) in Assassin's Creed III.",
          action: 'AC3_TIMELINE'
        },
        {
          text: "🥊 [ BARE-KNUCKLE FIGHT CLUB ]",
          description: "Run Syndicate Fight Club protocol to harvest raw resources.",
          action: 'FIGHT_CLUB'
        }
      ]
    },
    'NETWATCH_JOIN_BRANCH': {
      promptId: 'SYSTEM_STABILITY_LOCK',
      speech: "Smart Link activates, lock-on telemetry synchronizing perfectly. NetWatch has cleaned the feed, aligning you with the structural authorities.",
      buddySpeech: "System stability is pristine now! But this alignment is pulling heavy corporate values. The Hierophant matrix card is vibrating in our system files.",
      choices: [
        {
          text: "🃏 [ REVEAL THE HIEROPHANT ]",
          description: "Engage Takemura's corporate loyalty paths and study Takemura's unyielding compliance.",
          action: 'HIEROPHANT_CONSEQUENCE'
        },
        {
          text: "📂 [ EXPLOIT CORPO LIFEPATH ]",
          description: "Bypass elite security and execute Jenkins' counter-intelligence hacks.",
          action: 'CORPO_HACK'
        },
        {
          text: "💻 [ MERGE HARDWARE VIRTUALIZATION ]",
          description: "Optimize hyper-v partition protocols to mitigate system drag.",
          action: 'HARDWARE_OPTIMIZE'
        }
      ]
    },
    'SILVIA_ESCAPE_BRANCH': {
      promptId: 'FORZA_HIGHWAY_RUN',
      speech: "Silvia Spec-R engine roars. We hit 313 km/h on the highway, wet roads flashing past V's dashboard inside the virtual telemetry sandbox!",
      buddySpeech: "Incredible top-speed benchmark! Flawless skill chain triggering: Awesome Speed, Sideswipe, and Landscaping!",
      choices: [
        {
          text: "🔄 [ AUTOMATED DISCONNECT ]",
          description: "Initiate quick stream disconnect to bypass the hard-coded 48-hour limit.",
          action: 'STREAM_RESTART'
        },
        {
          text: "📊 [ PIPELINE GRAPH DATA ]",
          description: "Push telemetry specs straight to 'The Clinic' review dashboard.",
          action: 'DASHBOARD_PUSH'
        }
      ]
    },
    'FINAL_ALIGNMENT': {
      promptId: 'PROGRESS_SPIRAL_MAP',
      speech: "All narrative fragments merge. Your decisions have compiled the Progress Ecosystem Spiral Map, creating the ultimate synthesis of your legacy.",
      buddySpeech: "We did it, Pilot. Legacy Planning, Cognitive Resilience, and Strategic Vision are aligned. Synchronization is complete!",
      choices: [
        {
          text: "⭐ [ INITIATE FINAL SYSTEM HARMONY ]",
          description: "Secure your operational legacy in the global digital pipe.",
          action: 'HARMONY_END'
        }
      ]
    }
  };

  const currentChapterData = storyChapters[currentChapter] || storyChapters['FINAL_ALIGNMENT'];

  const appendFeedMessage = (title: string, text: string, type: 'system' | 'critical' | 'forza' | 'gold' = 'system') => {
    const newMessage: FeedMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      title,
      text,
      time: new Date().toLocaleTimeString(),
      type
    };
    setFeedMessages(prev => [...prev, newMessage]);
  };

  const handleChoiceClick = (action: string) => {
    playDecisionChime();

    switch (action) {
      case 'SLICE_PROXY':
        setLethality(prev => prev + 1);
        setMitigation(prev => prev + 0.85);
        setCraftingLevel(prev => Math.min(20, prev + 1));
        setAlignment('STREET_REBELLION');
        setSyncPercentage(75);
        setCurrentChapter('SLICE_PROXY_BRANCH');
        appendFeedMessage(
          'STREETKID REBEL EXECUTION',
          "V draws the Cocktail Stick! The 390 DPS, +10% Bleed, and +10% Burn triggers split the netrunner links in a flash of physical code severing. Placide's intrusive optical grid breaks.",
          'critical'
        );
        break;

      case 'NETWATCH_JOIN':
        setLethality(prev => prev + 1);
        setMitigation(prev => prev + 2.40);
        setAlignment('SYSTEM_INTEGRATION');
        setSyncPercentage(72);
        setCurrentChapter('NETWATCH_JOIN_BRANCH');
        appendFeedMessage(
          'NETWATCH SYSTEM SECURED',
          "NetWatch handshake completed. The smart link has resolved simulation friction, aligning V's optics with standard virtual compliance dashboards.",
          'system'
        );
        break;

      case 'SILVIA_ESCAPE':
        setLethality(prev => prev + 1);
        setMitigation(prev => prev + 0.20);
        setAlignment('LEGACY_PIONEER');
        setSyncPercentage(79);
        setCurrentChapter('SILVIA_ESCAPE_BRANCH');
        appendFeedMessage(
          '313 KM/H ROAD TEST',
          "Silvia Spec-R drifts through transitions beautifully. Flawless skill chains yield massive point telemetry across our Xbox virtualization layers!",
          'forza'
        );
        break;

      // Leaf Branch: Rebels
      case 'DEAD_KINGS_DLC':
        setLethality(prev => prev + 3);
        setMitigation(prev => prev + 1.20);
        setSyncPercentage(88);
        setCurrentChapter('FINAL_ALIGNMENT');
        appendFeedMessage(
          'FRANCIADE SYNC ANOMALY',
          "Synchronizing Dead Kings DLC epilogue chronologies. Arno's self-imposed exile in Franciade (1800) successfully mapped past Sequence 4 errors.",
          'critical'
        );
        break;

      case 'AC3_TIMELINE':
        setLethality(prev => prev + 2);
        setSyncPercentage(85);
        setCurrentChapter('FINAL_ALIGNMENT');
        appendFeedMessage(
          'COLONIAL BROTHERHOOD DECOY',
          "Rogue & AC3 timelines synchronized. You walk Connor's paths decades early to trace Templar operations.",
          'system'
        );
        break;

      case 'FIGHT_CLUB':
        setLethality(prev => prev + 12);
        setCraftingLevel(prev => Math.min(20, prev + 3));
        setSyncPercentage(91);
        setCurrentChapter('FINAL_ALIGNMENT');
        appendFeedMessage(
          'SYNDICATE FIGHT CLUB EXPLOIT',
          "Bare-knuckle champion crown verified! Goddess Cane-Sword recovered, generating raw mechanical components.",
          'gold'
        );
        break;

      // Leaf Branch: System
      case 'HIEROPHANT_CONSEQUENCE':
        setMitigation(prev => prev + 4.50);
        setSyncPercentage(84);
        setCurrentChapter('FINAL_ALIGNMENT');
        appendFeedMessage(
          'THE HIEROPHANT REVELATION',
          "Corporate structures tracked. Goro Takemura's absolute compliance analyzed alongside systemic Blackwall constraints.",
          'system'
        );
        break;

      case 'CORPO_HACK':
        setLethality(prev => prev + 4);
        setSyncPercentage(89);
        setCurrentChapter('FINAL_ALIGNMENT');
        appendFeedMessage(
          'ARASAKA COUNTER-INTEL',
          "Arthur Jenkins' corporate contracts and intelligence trees exploited to talk past elite checkpoint security.",
          'critical'
        );
        break;

      case 'HARDWARE_OPTIMIZE':
        setMitigation(prev => prev + 8.20);
        setSyncPercentage(93);
        setCurrentChapter('FINAL_ALIGNMENT');
        appendFeedMessage(
          'XBOX HYPER-V PARTITION',
          "Hyper-V virtualization layer configured for optimal data throughput. Desync constraints suppressed.",
          'system'
        );
        break;

      // Leaf Branch: Forza
      case 'STREAM_RESTART':
        setSyncPercentage(95);
        setCurrentChapter('FINAL_ALIGNMENT');
        appendFeedMessage(
          '48-HOUR BROADCUT OVERRIDE',
          "Automatic stream restart initiated. Continuous live telemetry loop active without file loss.",
          'forza'
        );
        break;

      case 'DASHBOARD_PUSH':
        setCraftingLevel(prev => Math.min(20, prev + 2));
        setSyncPercentage(92);
        setCurrentChapter('FINAL_ALIGNMENT');
        appendFeedMessage(
          'THE CLINIC DATA PIPELINE',
          "High performance telemetry vectors pushed to Notion dashboard database tables instantly.",
          'gold'
        );
        break;

      case 'HARMONY_END':
        setSyncPercentage(100);
        appendFeedMessage(
          'COGNITIVE HARMONY REACHED',
          "The Horizon Protocol has finished. You have managed player agency, technical limits, and architectural constraints to align pilot XCentricG's ultimate gaming ecosystem.",
          'gold'
        );
        playBootSound();
        break;

      default:
        break;
    }
  };

  const tryUpgradeWeapon = () => {
    if (craftingLevel < 20) {
      setCraftingLevel(prev => prev + 1);
      setMitigation(prev => prev + 0.20);
      playBeep(880, 0.1, 'sine');
      appendFeedMessage(
        'UPGRADE SUCCESSFUL',
        `Cocktail Stick upgraded! Technical Ability increased. Current tier level: ${craftingLevel + 1}/20.`,
        'system'
      );
    } else {
      playGlitchAlert();
      triggerModal(
        "Upgrade Error",
        "Your Cocktail Stick is already at peak Legendary Tier! Crafting limits reached."
      );
    }
  };

  const resetSimulation = () => {
    playGlitchAlert();
    setLethality(27088);
    setMitigation(27.60);
    setCraftingLevel(14);
    setAlignment('STREET_STABILITY');
    setSyncPercentage(68);
    setCurrentChapter('GIM_CROSSROADS');
    setUpgradedCocktailStick(false);
    setFeedMessages([
      {
        id: `msg-${Date.now()}`,
        title: 'REBOOT PROTOCOL EXECUTED',
        text: "All system memory caches, timeline files, and telemetry pipelines have been reset to initial baseline values.",
        time: new Date().toLocaleTimeString(),
        type: 'critical'
      }
    ]);
    appendFeedMessage(
      'SYSTEM INITIALIZATION',
      "Welcome back, XCentricG. Story Matrix recalibrated. Ready to slice.",
      'system'
    );
  };

  const triggerModal = (title: string, desc: string) => {
    setModalTitle(title);
    setModalDesc(desc);
    setModalOpen(true);
  };

  // Helper values matching active profile / layout rotation
  const getSpiralMapRotation = () => {
    switch (alignment) {
      case 'STREET_REBELLION': return 'rotate-270';
      case 'SYSTEM_INTEGRATION': return 'rotate-90';
      case 'LEGACY_PIONEER': return 'rotate-0'; // 360deg
      case 'STREET_STABILITY': return 'rotate-180';
      default: return 'rotate-180';
    }
  };

  const getSpiralCoreColor = () => {
    switch (alignment) {
      case 'STREET_REBELLION': return '#f97316';
      case 'SYSTEM_INTEGRATION': return '#3b82f6';
      case 'LEGACY_PIONEER': return '#eab308';
      default: return '#10b981';
    }
  };

  return (
    <div className="relative font-mono text-emerald-400 bg-[#030712] min-h-[600px] rounded-lg border border-emerald-900/50 overflow-hidden shadow-2xl p-0 flex flex-col">
      {/* Absolute top scanlines styling overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] opacity-25 z-10" />

      {/* Horizon Terminal Header */}
      <header className="border-b border-emerald-950 bg-gray-950 px-4 py-3 md:px-6 flex flex-wrap items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-8 h-8 text-emerald-500 animate-pulse" />
          <div>
            <h1 className="font-display font-black text-base md:text-lg tracking-wider text-emerald-400 flex items-center gap-2">
              HORIZON MATRIX TERMINAL 
              <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/50 px-1.5 py-0.5 rounded uppercase animate-bounce">
                Live
              </span>
            </h1>
            <p className="text-[10px] text-gray-500">
              PILOT_ID: <span className="text-emerald-400 font-bold">XCentricG</span> // SYSTEM: <span className="text-emerald-500 font-bold">Sensei_Validated</span>
            </p>
          </div>
        </div>

        {/* Real-time Telemetry summary blocks */}
        <div className="flex items-center gap-6 text-[10px]">
          <div className="hidden sm:block border-l border-emerald-950 pl-4">
            <span className="text-gray-500 uppercase block tracking-widest text-[8px]">Aggregate KDA</span>
            <span className="font-bold text-emerald-400 text-xs">4.16</span>
          </div>
          <div className="hidden md:block border-l border-emerald-950 pl-4">
            <span className="text-gray-500 uppercase block tracking-widest text-[8px]">Stability Pipe</span>
            <span className="font-bold text-emerald-400 text-xs">400 Mbps</span>
          </div>
          <div className="border-l border-emerald-950 pl-4 flex flex-col items-end">
            <span className="text-gray-500 uppercase block tracking-widest text-[8px]">Synchronization</span>
            <span className="font-bold text-emerald-400 text-xs animate-pulse">
              {syncPercentage}%
            </span>
          </div>
          {/* Mute toggle button */}
          <button 
            onClick={() => setMuted(!muted)}
            className="p-1.5 border border-emerald-950 hover:border-emerald-500 text-emerald-500 hover:text-emerald-400 transition-colors rounded"
            title={muted ? "Unmute sound synthesis" : "Mute sound synthesis"}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile View Controls (Tab Swapping) */}
      <div className="lg:hidden flex border-b border-emerald-950 bg-gray-950 text-xs z-20">
        <button 
          onClick={() => setActiveSubTab('story')}
          className={`flex-1 py-3 text-center border-b-2 font-bold transition-all ${activeSubTab === 'story' ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' : 'border-transparent text-gray-500 hover:text-emerald-500'}`}
        >
          STORY MATRIX
        </button>
        <button 
          onClick={() => setActiveSubTab('stats')}
          className={`flex-1 py-3 text-center border-b-2 font-bold transition-all ${activeSubTab === 'stats' ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' : 'border-transparent text-gray-500 hover:text-emerald-500'}`}
        >
          DASHBOARD & ECOSYSTEM
        </button>
      </div>

      {/* Primary Interface Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 w-full mx-auto overflow-hidden">
        
        {/* LEFT PANEL: Narrative Log / Branching Choices (7 Columns) */}
        <section 
          className={`lg:col-span-7 flex flex-col bg-gray-950/80 border border-emerald-950/80 rounded overflow-hidden min-h-[450px] lg:h-[calc(100vh-280px)] transition-all duration-300 ${activeSubTab === 'story' ? 'block' : 'hidden lg:flex'}`}
        >
          {/* Panel Header */}
          <div className="bg-gray-900 px-4 py-2 border-b border-emerald-950 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="font-semibold uppercase tracking-wider text-emerald-400">Chronological Event Stream</span>
            </div>
            <button 
              onClick={resetSimulation} 
              className="text-[9px] bg-red-950/80 hover:bg-red-900/90 text-red-400 border border-red-800 px-2 py-1 rounded transition-all flex items-center gap-1 font-bold"
            >
              <RotateCcw className="w-3 h-3" /> EMERGENCY DISCONNECT (RESET)
            </button>
          </div>

          {/* Live Terminal Output Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col justify-start scrollbar-thin scrollbar-thumb-emerald-900/50">
            {feedMessages.map((msg) => {
              const borderStyles = {
                critical: 'border-red-950/60 bg-red-950/10 text-red-400',
                forza: 'border-blue-950/60 bg-blue-950/10 text-blue-400',
                gold: 'border-yellow-950/60 bg-yellow-950/10 text-yellow-400',
                system: 'border-emerald-950/60 bg-gray-900/20 text-emerald-400'
              };
              return (
                <div 
                  key={msg.id}
                  className={`p-3.5 border rounded space-y-1 ${borderStyles[msg.type]} transition-all duration-500 animate-fadeIn`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="uppercase tracking-wider">// {msg.title}</span>
                    <span className="text-gray-500">{msg.time}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans font-medium">
                    {msg.text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Terminal Action Matrix (Active Choices UI) */}
          <div className="p-4 border-t border-emerald-950 bg-gray-950 space-y-3">
            <div className="text-[10px] text-emerald-400/80 font-bold tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 animate-spin-slow" /> // CHOOSE STRATEGIC TRAJECTORY:</span>
              <span className="text-[9px] text-gray-500">PROMPT_ID: {currentChapterData.promptId}</span>
            </div>

            {/* Simulated narration speech */}
            <div className="p-3 bg-black/40 border border-emerald-950/30 text-xs text-gray-300 mb-3 rounded italic font-sans font-medium">
              "{currentChapterData.speech}"
            </div>

            {/* Interactive Decision Options Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentChapterData.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => handleChoiceClick(choice.action)}
                  className="bg-gray-900/80 border border-emerald-950/80 hover:border-emerald-500 text-left p-3 rounded transition-all text-xs text-gray-300 hover:text-emerald-400 hover:bg-emerald-950/20 active:scale-[0.98]"
                >
                  <div className="font-bold mb-1 flex items-center gap-1">{choice.text}</div>
                  <p className="text-[10px] text-gray-500 leading-tight font-sans font-medium">{choice.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: Live Dashboard, Gear, Ecosystem Map (5 Columns) */}
        <section 
          className={`lg:col-span-5 flex flex-col gap-4 overflow-y-auto lg:h-[calc(100vh-280px)] pr-1 scrollbar-thin scrollbar-thumb-emerald-900/50 ${activeSubTab === 'stats' ? 'block' : 'hidden lg:flex'}`}
        >
          {/* SUB-PANEL 1: Live Status & Weapon Wheel */}
          <div className="bg-gray-950 border border-emerald-950 rounded p-4 space-y-4 shadow-xl">
            <div className="border-b border-emerald-950 pb-2 flex items-center justify-between">
              <h2 className="font-display font-black text-xs md:text-sm text-emerald-400 tracking-wider flex items-center gap-2 uppercase">
                <Sword className="w-4 h-4 text-emerald-500" /> PILOT TELEMETRY & GEAR
              </h2>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase border border-emerald-800">
                Active Loadout
              </span>
            </div>

            {/* Telemetry Numbers Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-900 border border-emerald-950 p-2.5 rounded">
                <div className="text-gray-500 text-[8px] uppercase tracking-wider">Lethality Metric</div>
                <div className="text-base font-bold text-red-400 font-display mt-0.5">
                  {lethality.toLocaleString()}
                </div>
                <div className="text-[9px] text-gray-400 mt-1">Total Bosses Extinguished</div>
              </div>
              <div className="bg-gray-900 border border-emerald-950 p-2.5 rounded">
                <div className="text-gray-500 text-[8px] uppercase tracking-wider">Mitigated Impact</div>
                <div className="text-base font-bold text-blue-400 font-display mt-0.5">
                  {mitigation.toFixed(2)}M
                </div>
                <div className="text-[9px] text-gray-400 mt-1 font-sans">Damage units buffered</div>
              </div>
            </div>

            {/* Technical Ability Crafting Panel */}
            <div className="bg-gray-900/60 border border-emerald-950 p-3 rounded space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 font-sans">
                  <Wrench className="w-3.5 h-3.5 animate-spin-slow" /> Technical Ability (Crafting)
                </span>
                <span className="text-emerald-500 font-bold">Lvl {craftingLevel} / 20</span>
              </div>
              
              {/* Crafting Level Progress Bar */}
              <div className="h-2 w-full bg-gray-950 rounded overflow-hidden border border-emerald-900/60">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" 
                  style={{ width: `${(craftingLevel / 20) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] pt-1">
                <span className="text-gray-500">// Edgerunner Artisan Requirement</span>
                <button
                  onClick={tryUpgradeWeapon}
                  disabled={craftingLevel >= 20}
                  className={`px-2 py-1 rounded font-bold uppercase transition-all ${craftingLevel >= 20 ? 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed' : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-500'}`}
                >
                  {craftingLevel >= 20 ? 'MAXED OUT' : 'UPGRADE COCKTAIL STICK'}
                </button>
              </div>
            </div>

            {/* Synced Iconic Arsenal List */}
            <div className="space-y-2">
              <div className="text-[9px] text-gray-500 tracking-wider font-semibold uppercase">
                // Synced Iconic Arsenal
              </div>

              <div className="grid grid-cols-1 gap-2 text-xs">
                {/* Cocktail Stick Weapon Card */}
                <div className="p-2 border border-emerald-950 bg-gray-900/40 rounded flex items-center justify-between transition-all">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-950/80 border border-emerald-800 flex items-center justify-center font-bold text-emerald-400">
                      🗡️
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-400">
                        {craftingLevel >= 20 ? 'Cocktail Stick [LEGENDARY]' : 'Cocktail Stick (Iconic)'}
                      </div>
                      <div className="text-[9px] text-gray-400 font-sans">
                        {craftingLevel >= 20 ? '495 DPS | +15% Bleed | +15% Burn' : '390 DPS | +10% Bleed | +10% Burn'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[9px] border px-1.5 py-0.5 rounded ${craftingLevel >= 20 ? 'border-amber-500 text-amber-400 font-bold' : 'border-emerald-500 text-emerald-400 font-medium'}`}>
                    {craftingLevel >= 20 ? 'LEGENDARY' : 'EPIC'}
                  </span>
                </div>

                {/* Satori Weapon Card */}
                <div className="p-2 border border-emerald-950 bg-gray-900/40 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-950/80 border border-emerald-800 flex items-center justify-center font-bold text-emerald-400">
                      ⚔️
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-400">Satori (Iconic)</div>
                      <div className="text-[9px] text-gray-400 font-sans">Critical Damage Override Active</div>
                    </div>
                  </div>
                  <span className="text-[9px] border border-amber-500 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                    LEGENDARY
                  </span>
                </div>

                {/* Skippy Weapon Card */}
                <div className="p-2 border border-emerald-950 bg-gray-900/40 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-950/80 border border-emerald-800 flex items-center justify-center font-bold text-emerald-400">
                      🔫
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-400">Skippy (Sentient Smart Pistol)</div>
                      <div className="text-[9px] text-gray-400 font-sans">Mode: "Stone Cold Killer" / Misfires sarcastically</div>
                    </div>
                  </div>
                  <span className="text-[9px] border border-emerald-500 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                    EPIC
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SUB-PANEL 2: Dynamic Progress Ecosystem Spiral Map */}
          <div className="bg-gray-950 border border-emerald-950 rounded p-4 flex flex-col items-center gap-3 shadow-xl relative overflow-hidden">
            <div className="w-full border-b border-emerald-950 pb-2 flex justify-between items-center">
              <h2 className="font-display font-black text-xs md:text-sm text-emerald-400 tracking-wider flex items-center gap-2 uppercase">
                <Compass className="w-4 h-4 text-emerald-500 animate-pulse" /> PROGRESS ECOSYSTEM SPIRAL MAP
              </h2>
              <span className={`text-[9px] border px-2 py-0.5 rounded uppercase font-bold tracking-wider ${alignment === 'STREET_REBELLION' ? 'border-orange-500 text-orange-400' : alignment === 'SYSTEM_INTEGRATION' ? 'border-blue-500 text-blue-400' : alignment === 'LEGACY_PIONEER' ? 'border-yellow-500 text-yellow-400' : 'border-emerald-500 text-emerald-400'}`}>
                {alignment}
              </span>
            </div>

            {/* Interactive SVG Spiral Map Container */}
            <div className="w-full aspect-square max-w-[280px] relative flex items-center justify-center p-2 bg-gray-900/40 rounded border border-emerald-950 overflow-hidden">
              <svg 
                viewBox="0 0 400 400" 
                className={`w-full h-full transition-transform duration-[2000ms] ${getSpiralMapRotation()}`}
              >
                {/* Center glowing Core */}
                <circle cx="200" cy="200" r="28" fill={getSpiralCoreColor()} fillOpacity="0.25" className="animate-pulse" />
                <circle cx="200" cy="200" r="16" fill={getSpiralCoreColor()} />
                <text 
                  x="200" 
                  y="204" 
                  fontFamily="'Orbitron', sans-serif" 
                  fontSize="8" 
                  fontWeight="bold" 
                  fill="#030712" 
                  textAnchor="middle" 
                  className="pointer-events-none font-black"
                >
                  CORE
                </text>

                {/* Inner Ring: Vision / Warm Tones (Orange) */}
                <circle cx="200" cy="200" r="60" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="6,4" strokeOpacity="0.4" />
                <g id="ring-inner">
                  <circle cx="160" cy="155" r="5" fill="#f97316" className="transition-all duration-300 hover:scale-150 cursor-pointer" />
                  <circle cx="240" cy="155" r="5" fill="#f97316" className="transition-all duration-300 hover:scale-150 cursor-pointer" />
                  <circle cx="200" cy="260" r="5" fill="#f97316" className="transition-all duration-300 hover:scale-150 cursor-pointer" />
                </g>

                {/* Middle Ring: Culture/Systems / Cool Blues (Blue) */}
                <circle cx="200" cy="200" r="110" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="10,6" strokeOpacity="0.4" />
                <g id="ring-middle">
                  <circle cx="110" cy="130" r="6" fill="#3b82f6" className="transition-all duration-300 hover:scale-150 cursor-pointer" />
                  <circle cx="290" cy="130" r="6" fill="#3b82f6" className="transition-all duration-300 hover:scale-150 cursor-pointer" />
                  <circle cx="200" cy="310" r="6" fill="#3b82f6" className="transition-all duration-300 hover:scale-150 cursor-pointer" />
                </g>

                {/* Outer Ring: Legacy / Gold-Greens (Green/Yellow) */}
                <circle cx="200" cy="200" r="160" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeDasharray="12,8" strokeOpacity="0.3" />
                <g id="ring-outer">
                  <circle cx="60" cy="200" r="7" fill="#22c55e" className="transition-all duration-300 hover:scale-150 cursor-pointer" />
                  <circle cx="340" cy="200" r="7" fill="#eab308" className="transition-all duration-300 hover:scale-150 cursor-pointer" />
                </g>

                {/* Curving connecting spiral curves (drawn visually to connect rings) */}
                <path d="M200,200 Q200,140 160,155 T200,260 T290,130 T340,200" fill="none" stroke={getSpiralCoreColor()} strokeWidth="1.5" strokeOpacity="0.25" />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[8px] uppercase tracking-widest text-emerald-400/20 font-display font-black">
                SPIRED STRUCTURE ACTIVE
              </div>
            </div>

            {/* Ecosystem Labeling Glossary */}
            <div className="w-full grid grid-cols-3 gap-2 text-[9px] border-t border-emerald-950 pt-2 font-mono">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-600 block"></span>
                <span className="text-orange-400 uppercase">Vision (Warm)</span>
              </div>
              <div className="flex items-center gap-1 justify-center">
                <span className="w-2 h-2 rounded-full bg-blue-600 block"></span>
                <span className="text-blue-400 uppercase">Systems (Cool)</span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <span className="w-2 h-2 rounded-full bg-yellow-500 block"></span>
                <span className="text-yellow-400 uppercase">Legacy (Gold)</span>
              </div>
            </div>
          </div>

          {/* SUB-PANEL 3: Live Buddy AI Companion Log */}
          <div className="bg-gray-950 border border-emerald-950 rounded p-4 shadow-xl">
            <div className="border-b border-emerald-950 pb-2 flex items-center justify-between">
              <h2 className="font-display font-black text-xs md:text-sm text-emerald-400 tracking-wider flex items-center gap-2 uppercase">
                <Bot className="w-4 h-4 text-emerald-500 animate-pulse" /> Buddy System Companion
              </h2>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold animate-pulse uppercase border border-emerald-900">
                BUDDY_ONLINE
              </span>
            </div>

            <div className="mt-3 flex gap-3 text-xs items-start bg-gray-900/40 p-3 rounded border border-emerald-950/60">
              <div className="w-8 h-8 rounded bg-emerald-950 border border-emerald-500 flex items-center justify-center font-black text-emerald-400 flex-shrink-0 animate-bounce">
                B
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">Buddy_v2.5</span>
                  <span className="text-[9px] text-gray-500 font-sans">Live Analyzer</span>
                </div>
                <p className="text-gray-300 leading-relaxed font-sans font-medium italic">
                  "{currentChapterData.buddySpeech}"
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

        {/* Footer Stats and Global Information */}
        <footer className="bg-gray-950 border-t border-emerald-950 px-4 py-2 text-[9px] text-gray-500 flex flex-wrap justify-between items-center z-10 font-mono">
          <div>// SECURE ARCHIVE SYNCED: COGNITIVE OVERLAYS ENFORCED // NO-TELL MOTEL GATEWAY ACTIVE</div>
          <div className="flex items-center gap-4">
            <span>DEVICE: <span className="text-emerald-600 font-bold">Xbox One Spec (Patch 1.61)</span></span>
            <span className="animate-pulse text-emerald-500 font-bold">ONLINE LINK SECURE</span>
          </div>
        </footer>

        {/* Notification / Custom Desync Modal */}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gray-950 border-2 border-red-900 rounded p-6 max-w-md w-full space-y-4 shadow-2xl relative font-mono text-red-400"
              >
                <div className="absolute top-2 right-2 text-[8px] bg-red-950 text-red-500 border border-red-900 px-1.5 py-0.5 rounded font-bold uppercase">
                  Alert Node
                </div>
                <div className="flex items-center gap-3 border-b border-red-950 pb-3">
                  <ShieldAlert className="w-8 h-8 text-red-500 animate-ping" />
                  <div>
                    <h3 className="font-display font-black text-red-500 text-sm md:text-base uppercase tracking-wider">
                      {modalTitle}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-sans">Simulation boundary error encountered</p>
                  </div>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans font-medium">
                  {modalDesc}
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={() => {
                      playBeep(400, 0.05);
                      setModalOpen(false);
                    }} 
                    className="bg-red-950 text-red-400 hover:bg-red-900 border border-red-800 px-4 py-2 rounded text-xs transition-all font-bold uppercase"
                  >
                    Acknowledge Protocol
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}
