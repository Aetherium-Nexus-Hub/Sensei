import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { BarChart3, TrendingUp, HelpCircle, Share2, Grid, Layers, Network, Server } from 'lucide-react';

interface ChartHubProps {
  activeProfile?: 'cb77' | 'ac';
  healthHistory: { time: string; health: number }[];
}

export default function ChartHub({ activeProfile = 'cb77', healthHistory }: ChartHubProps) {
  const isAc = activeProfile === 'ac';
  const [activeTab, setActiveTab] = useState<'apr' | 'rewards' | 'breakdown' | 'diversity' | 'nodemap'>('apr');
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | 'all'>('7d');
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);

  // Dynamic colors derived from CB77 or AC
  const colors = isAc ? {
    primary: '#4DD0E1', // Teal
    secondary: '#D4AF37', // Gold
    accent: '#C62828', // Red
    grid: '#332a26',
    pieColors: ['#D4AF37', '#4DD0E1', '#C62828', '#8D6E63']
  } : {
    primary: '#00F0FF', // Cyan
    secondary: '#FCEE0A', // Yellow
    accent: '#FF003C', // Red
    grid: '#222',
    pieColors: ['#00F0FF', '#FCEE0A', '#FF003C', '#8A2BE2']
  };

  // Generate APR data dynamically
  const getAprData = () => {
    const points = timeRange === '1d' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 15 : 12;
    return Array.from({ length: points }).map((_, i) => {
      const label = timeRange === '1d' ? `${i}:00` : timeRange === '7d' ? `Day ${i + 1}` : timeRange === '30d' ? `Day ${i * 2 + 1}` : `Month ${i + 1}`;
      // Simulate slow drift in APR
      const baseApr = isAc ? 4.65 : 4.82;
      const apr = baseApr + Math.sin(i * 0.4) * 0.15 + (Math.random() * 0.08);
      return { name: label, apr: parseFloat(apr.toFixed(2)) };
    });
  };

  // Generate stacked rewards data dynamically
  const getRewardsData = () => {
    const points = timeRange === '1d' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 15 : 12;
    let accumAttestation = 0;
    let accumProposals = 0;
    let accumMev = 0;
    let accumTips = 0;

    return Array.from({ length: points }).map((_, i) => {
      const label = timeRange === '1d' ? `${i}:00` : timeRange === '7d' ? `Day ${i + 1}` : timeRange === '30d' ? `Day ${i * 2 + 1}` : `Month ${i + 1}`;
      
      const step = timeRange === '1d' ? 0.002 : timeRange === '7d' ? 0.04 : timeRange === '30d' ? 0.09 : 0.18;
      
      accumAttestation += step * (0.8 + Math.random() * 0.4);
      accumProposals += step * (0.3 + Math.random() * 0.5);
      accumMev += step * (0.2 + (Math.random() > 0.85 ? 1.2 : 0.1));
      accumTips += step * (0.1 + Math.random() * 0.2);

      return {
        name: label,
        'Attestation (CL)': parseFloat(accumAttestation.toFixed(3)),
        'Proposals (CL)': parseFloat(accumProposals.toFixed(3)),
        'MEV Boost (EL)': parseFloat(accumMev.toFixed(3)),
        'Execution Tips (EL)': parseFloat(accumTips.toFixed(3)),
      };
    });
  };

  const getPieData = () => [
    { name: isAc ? 'Consensus Loop' : 'Attestations', value: 55 },
    { name: isAc ? 'Ancestral Prop' : 'Block Proposals', value: 20 },
    { name: isAc ? 'Memetic Boost' : 'MEV Boost', value: 18 },
    { name: isAc ? 'Tribute Tips' : 'Execution Tips', value: 7 }
  ];

  const getDiversityData = () => [
    { name: 'Geth', share: 45 },
    { name: 'Nethermind', share: 30 },
    { name: 'Besu', share: 15 },
    { name: 'Erigon', share: 10 }
  ];

  // Consensus Node Map positions
  const validatorNodes = [
    { id: 1, x: 25, y: 35, status: 'active', name: 'SENSEI-01', stake: '32.12 ETH', client: 'Lighthouse/Besu', effectiveness: '99.8%' },
    { id: 2, x: 45, y: 20, status: 'active', name: 'SENSEI-02', stake: '32.08 ETH', client: 'Prysm/Geth', effectiveness: '99.1%' },
    { id: 3, x: 65, y: 30, status: 'active', name: 'SENSEI-03', stake: '32.45 ETH', client: 'Lighthouse/Nethermind', effectiveness: '99.9%' },
    { id: 4, x: 80, y: 50, status: 'active', name: 'SENSEI-04', stake: '32.15 ETH', client: 'Teku/Besu', effectiveness: '99.4%' },
    { id: 5, x: 70, y: 75, status: 'active', name: 'SENSEI-05', stake: '32.11 ETH', client: 'Lodestar/Erigon', effectiveness: '98.7%' },
    { id: 6, x: 50, y: 85, status: 'active', name: 'SENSEI-06', stake: '32.02 ETH', client: 'Prysm/Besu', effectiveness: '99.0%' },
    { id: 7, x: 30, y: 70, status: 'active', name: 'SENSEI-07', stake: '32.33 ETH', client: 'Lighthouse/Geth', effectiveness: '99.9%' },
    { id: 8, x: 15, y: 50, status: 'active', name: 'SENSEI-08', stake: '32.18 ETH', client: 'Teku/Nethermind', effectiveness: '99.5%' },
    { id: 9, x: 40, y: 50, status: 'active', name: 'SENSEI-09', stake: '32.22 ETH', client: 'Prysm/Nethermind', effectiveness: '99.2%' },
    { id: 10, x: 60, y: 55, status: 'active', name: 'SENSEI-10', stake: '32.06 ETH', client: 'Lighthouse/Geth', effectiveness: '99.8%' },
    { id: 11, x: 50, y: 40, status: 'slashing', name: 'MOCK-ATTACK-01', stake: '32.00 ETH', client: 'Custom/Geth', effectiveness: '42.1%' },
    { id: 12, x: 52, y: 62, status: 'inactive', name: 'SENSEI-12', stake: '0.00 ETH', client: 'Lodestar/Besu', effectiveness: '0.0%' }
  ];

  return (
    <div className="cp-border p-5 bg-cp-dark/60 flex flex-col font-mono relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 text-[8px] text-gray-500 uppercase tracking-[0.2em]">
        {isAc ? "SYNCHRONIZATION HUB" : "TELEMETRY ENGINE V2"}
      </div>

      {/* Title & Time Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-cp-cyan" />
          <h2 className="text-sm font-display font-bold uppercase tracking-[0.2em]">
            {isAc ? "Genetic Anchor Chart Matrix" : "Validator Chart Hub"}
          </h2>
        </div>

        {/* Global Time Range Selector */}
        {activeTab !== 'breakdown' && activeTab !== 'diversity' && activeTab !== 'nodemap' && (
          <div className="flex items-center gap-1 bg-black/60 p-0.5 border border-white/5 rounded">
            {(['1d', '7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  timeRange === range ? 'bg-cp-cyan text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-3 mb-4">
        <button
          onClick={() => setActiveTab('apr')}
          className={`px-3 py-1.5 text-[9px] font-bold uppercase border flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'apr' ? 'bg-cp-cyan text-black border-cp-cyan' : 'border-white/5 text-gray-400 hover:border-white/20'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> APR Drift
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-3 py-1.5 text-[9px] font-bold uppercase border flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'rewards' ? 'bg-cp-cyan text-black border-cp-cyan' : 'border-white/5 text-gray-400 hover:border-white/20'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Stacked Rewards
        </button>
        <button
          onClick={() => setActiveTab('breakdown')}
          className={`px-3 py-1.5 text-[9px] font-bold uppercase border flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'breakdown' ? 'bg-cp-cyan text-black border-cp-cyan' : 'border-white/5 text-gray-400 hover:border-white/20'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Rewards Split
        </button>
        <button
          onClick={() => setActiveTab('diversity')}
          className={`px-3 py-1.5 text-[9px] font-bold uppercase border flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'diversity' ? 'bg-cp-cyan text-black border-cp-cyan' : 'border-white/5 text-gray-400 hover:border-white/20'
          }`}
        >
          <Server className="w-3.5 h-3.5" /> Client Share
        </button>
        <button
          onClick={() => setActiveTab('nodemap')}
          className={`px-3 py-1.5 text-[9px] font-bold uppercase border flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'nodemap' ? 'bg-cp-cyan text-black border-cp-cyan' : 'border-white/5 text-gray-400 hover:border-white/20'
          }`}
        >
          <Network className="w-3.5 h-3.5 animate-pulse" /> Consensus Node Map
        </button>
      </div>

      {/* Chart Views */}
      <div className="flex-grow min-h-[220px]">
        {activeTab === 'apr' && (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={getAprData()}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="name" fontSize={9} stroke="#888" />
              <YAxis domain={[4.2, 5.5]} stroke={colors.primary} fontSize={9} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: `1px solid ${colors.primary}`, fontSize: '9px' }}
                itemStyle={{ color: colors.primary }}
              />
              <Line type="monotone" dataKey="apr" stroke={colors.primary} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} isAnimationActive={true} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'rewards' && (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={getRewardsData()}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="name" fontSize={9} stroke="#888" />
              <YAxis stroke={colors.primary} fontSize={9} tickFormatter={(v) => `${v.toFixed(2)}Ξ`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: `1px solid ${colors.primary}`, fontSize: '9px' }}
              />
              <Legend wrapperStyle={{ fontSize: '8px' }} />
              <Area type="monotone" dataKey="Attestation (CL)" stackId="1" stroke={colors.pieColors[0]} fill={colors.pieColors[0]} fillOpacity={0.4} />
              <Area type="monotone" dataKey="Proposals (CL)" stackId="1" stroke={colors.pieColors[1]} fill={colors.pieColors[1]} fillOpacity={0.4} />
              <Area type="monotone" dataKey="MEV Boost (EL)" stackId="1" stroke={colors.pieColors[2]} fill={colors.pieColors[2]} fillOpacity={0.4} />
              <Area type="monotone" dataKey="Execution Tips (EL)" stackId="1" stroke={colors.pieColors[3]} fill={colors.pieColors[3]} fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'breakdown' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPieData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors.pieColors[index % colors.pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: `1px solid ${colors.primary}`, fontSize: '9px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {getPieData().map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs p-1.5 bg-black/30 border border-white/5 rounded">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.pieColors[index] }} />
                    <span className="text-gray-300 font-bold">{item.name}</span>
                  </div>
                  <span className="text-white font-mono">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'diversity' && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={getDiversityData()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis type="number" fontSize={9} stroke="#888" tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="name" type="category" stroke={colors.primary} fontSize={9} />
              <Tooltip contentStyle={{ backgroundColor: '#000', border: `1px solid ${colors.primary}`, fontSize: '9px' }} />
              <Bar dataKey="share" radius={[0, 4, 4, 0]}>
                {getDiversityData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? colors.accent : colors.primary} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'nodemap' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {/* Interactive Validator Map canvas visual representation */}
            <div className="col-span-2 relative h-[220px] bg-black/40 border border-white/5 rounded overflow-hidden select-none">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ 
                backgroundImage: 'radial-gradient(circle, var(--color-cp-cyan) 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }} />
              
              {/* Central overwatch link line connectors */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {validatorNodes.map((n, idx) => {
                  if (idx === 0) return null;
                  const prev = validatorNodes[idx - 1];
                  return (
                    <line 
                      key={idx}
                      x1={`${prev.x}%`} 
                      y1={`${prev.y}%`} 
                      x2={`${n.x}%`} 
                      y2={`${n.y}%`} 
                      stroke={n.status === 'slashing' ? colors.accent : colors.primary} 
                      strokeWidth={0.5} 
                      strokeOpacity={0.15} 
                    />
                  );
                })}
              </svg>

              {/* Node triggers */}
              {validatorNodes.map((node) => (
                <button
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center cursor-crosshair rounded-full border transition-all ${
                    node.status === 'slashing' 
                      ? 'bg-cp-red/20 border-cp-red shadow-[0_0_8px_rgba(255,0,0,0.6)] animate-ping' 
                      : node.status === 'inactive' 
                      ? 'bg-gray-800 border-gray-600'
                      : 'bg-cp-cyan/20 border-cp-cyan hover:scale-125 hover:bg-cp-cyan/40 shadow-[0_0_6px_rgba(0,240,255,0.4)]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    node.status === 'slashing' ? 'bg-cp-red' : node.status === 'inactive' ? 'bg-gray-500' : 'bg-cp-cyan'
                  }`} />
                </button>
              ))}
            </div>

            {/* Live Hover Info HUD Card */}
            <div className="col-span-1 border border-white/5 bg-black/60 p-3 flex flex-col justify-between h-[220px] rounded text-[10px]">
              <div>
                <span className="block text-[8px] text-gray-500 uppercase tracking-widest font-bold mb-1 border-b border-white/5 pb-1">
                  Node Inspector
                </span>
                {hoveredNode || validatorNodes[0] ? (
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-400">ID:</span>
                      <span className="text-white font-bold">{(hoveredNode || validatorNodes[0]).name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">STAKE:</span>
                      <span className="text-cp-yellow font-bold">{(hoveredNode || validatorNodes[0]).stake}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CLIENT:</span>
                      <span className="text-cp-cyan">{(hoveredNode || validatorNodes[0]).client}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">EFFECTIV:</span>
                      <span className={(hoveredNode || validatorNodes[0]).status === 'slashing' ? 'text-cp-red font-bold' : 'text-green-400'}>
                        {(hoveredNode || validatorNodes[0]).effectiveness}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">STATUS:</span>
                      <span className={`font-black uppercase ${(hoveredNode || validatorNodes[0]).status === 'slashing' ? 'text-cp-red animate-pulse' : (hoveredNode || validatorNodes[0]).status === 'inactive' ? 'text-gray-500' : 'text-cp-cyan'}`}>
                        {(hoveredNode || validatorNodes[0]).status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-600 block text-center py-8">HOVER VALIDATOR IN NETWORK CONSOLE</span>
                )}
              </div>
              <div className="text-[8px] text-gray-500 border-t border-white/5 pt-1 mt-1 leading-normal uppercase">
                {isAc ? "Hover over genetic synapse memory relays to isolate sync parameters." : "Hover over secure validators to query specific consensus telemetry."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
