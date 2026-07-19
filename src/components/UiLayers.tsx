import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Tv, 
  Grid3X3, 
  Crosshair, 
  Moon, 
  Flame, 
  Maximize2, 
  Monitor, 
  Compass, 
  Radio,
  Zap
} from 'lucide-react';

export interface UiLayersState {
  crtScanlines: boolean;
  chromaticAberration: boolean;
  hudBrackets: boolean;
  backgroundGrid: boolean;
  filterMode: 'none' | 'night-vision' | 'thermal' | 'amber';
  scanlineSpeed: 'slow' | 'normal' | 'fast';
}

interface UiLayersProps {
  layers: UiLayersState;
  onChange: (updated: UiLayersState) => void;
  activeProfile: 'cb77' | 'ac';
}

export default function UiLayers({ layers, onChange, activeProfile }: UiLayersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleLayer = (key: keyof UiLayersState) => {
    if (key === 'filterMode' || key === 'scanlineSpeed') return;
    onChange({
      ...layers,
      [key]: !layers[key]
    });
  };

  const setFilterMode = (mode: UiLayersState['filterMode']) => {
    onChange({
      ...layers,
      filterMode: mode
    });
  };

  const setScanlineSpeed = (speed: UiLayersState['scanlineSpeed']) => {
    onChange({
      ...layers,
      scanlineSpeed: speed
    });
  };

  const isAc = activeProfile === 'ac';

  return (
    <div className="relative z-40">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-6 z-50 p-3 rounded-full border shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer ${
          isOpen 
            ? isAc ? 'bg-cp-yellow text-black border-cp-yellow' : 'bg-cp-cyan text-black border-cp-cyan'
            : isAc ? 'bg-black/90 text-cp-yellow border-cp-yellow/50 hover:border-cp-yellow' : 'bg-black/90 text-cp-cyan border-cp-cyan/50 hover:border-cp-cyan'
        }`}
        title="Interactive UI Layers Controller"
      >
        <Layers className="w-5 h-5 animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-cp-cyan"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cp-cyan"></span>
        </span>
      </button>

      {/* Slide-out Layer Controls Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100, y: 50 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className={`fixed bottom-36 right-6 z-50 w-80 p-5 rounded-lg border bg-black/95 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.9)] font-mono ${
              isAc ? 'border-cp-yellow/40 text-cp-yellow' : 'border-cp-cyan/40 text-cp-cyan'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between border-b pb-3 mb-4 ${isAc ? 'border-cp-yellow/20' : 'border-cp-cyan/20'}`}>
              <div className="flex items-center gap-2">
                <Layers className={`w-4 h-4 ${isAc ? 'text-cp-yellow' : 'text-cp-cyan'}`} />
                <span className="text-xs font-bold uppercase tracking-wider">HUD Rendering Layers</span>
              </div>
              <span className={`text-[8px] border px-1.5 py-0.5 rounded font-bold uppercase ${isAc ? 'border-cp-yellow/30 text-cp-yellow/60' : 'border-cp-cyan/30 text-cp-cyan/60'}`}>
                v1.61 Core
              </span>
            </div>

            {/* Toggle Switch Toggles */}
            <div className="space-y-3.5">
              {/* Scanlines Layer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 shrink-0 text-gray-400" />
                  <div>
                    <span className="text-xs font-bold block uppercase">CRT Scanlines</span>
                    <span className="text-[9px] text-gray-500 font-sans block">Simulated CRT filter scanlines</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleLayer('crtScanlines')}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    layers.crtScanlines 
                      ? isAc ? 'bg-cp-yellow' : 'bg-cp-cyan' 
                      : 'bg-gray-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-200 ${layers.crtScanlines ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Scanline Speed Adjustment */}
              {layers.crtScanlines && (
                <div className={`pl-6 flex items-center justify-between text-[10px] pb-1 border-l ml-2 ${isAc ? 'border-cp-yellow/20' : 'border-cp-cyan/20'}`}>
                  <span className="text-gray-500 uppercase">Scan Speed:</span>
                  <div className="flex gap-1.5">
                    {(['slow', 'normal', 'fast'] as const).map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setScanlineSpeed(spd)}
                        className={`px-1.5 py-0.5 border rounded text-[8px] uppercase font-bold cursor-pointer transition-all ${
                          layers.scanlineSpeed === spd
                            ? isAc ? 'bg-cp-yellow text-black border-cp-yellow' : 'bg-cp-cyan text-black border-cp-cyan'
                            : 'bg-transparent text-gray-400 border-gray-800 hover:text-white'
                        }`}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tactical Brackets Layer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 shrink-0 text-gray-400" />
                  <div>
                    <span className="text-xs font-bold block uppercase">HUD Corner Brackets</span>
                    <span className="text-[9px] text-gray-500 font-sans block">Holographic viewfinder framing</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleLayer('hudBrackets')}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    layers.hudBrackets 
                      ? isAc ? 'bg-cp-yellow' : 'bg-cp-cyan' 
                      : 'bg-gray-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-200 ${layers.hudBrackets ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Chromatic Aberration Layer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 shrink-0 text-gray-400" />
                  <div>
                    <span className="text-xs font-bold block uppercase">Chromatic Glitch</span>
                    <span className="text-[9px] text-gray-500 font-sans block">Subtle RGB spectrum aberration</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleLayer('chromaticAberration')}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    layers.chromaticAberration 
                      ? isAc ? 'bg-cp-yellow' : 'bg-cp-cyan' 
                      : 'bg-gray-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-200 ${layers.chromaticAberration ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Vector Grid Layer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 shrink-0 text-gray-400" />
                  <div>
                    <span className="text-xs font-bold block uppercase">Vector Grid Backdrop</span>
                    <span className="text-[9px] text-gray-500 font-sans block">Active sensor grid background</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleLayer('backgroundGrid')}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    layers.backgroundGrid 
                      ? isAc ? 'bg-cp-yellow' : 'bg-cp-cyan' 
                      : 'bg-gray-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-200 ${layers.backgroundGrid ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Filter mode category */}
            <div className={`mt-5 pt-4 border-t ${isAc ? 'border-cp-yellow/20' : 'border-cp-cyan/20'}`}>
              <span className="text-[10px] font-bold uppercase text-gray-400 block mb-2.5 tracking-wider flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cp-red shrink-0" /> Camera Filter Modules
              </span>
              
              <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                {/* None (Standard) */}
                <button
                  onClick={() => setFilterMode('none')}
                  className={`p-2 border rounded font-bold uppercase transition-all duration-200 cursor-pointer ${
                    layers.filterMode === 'none'
                      ? isAc ? 'bg-cp-yellow text-black border-cp-yellow' : 'bg-cp-cyan text-black border-cp-cyan'
                      : 'bg-transparent text-gray-400 border-gray-800 hover:text-white'
                  }`}
                >
                  Standard
                </button>

                {/* Night Vision */}
                <button
                  onClick={() => setFilterMode('night-vision')}
                  className={`p-2 border rounded font-bold uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
                    layers.filterMode === 'night-vision'
                      ? 'bg-green-500 text-black border-green-500'
                      : 'bg-transparent text-green-500/80 border-green-950 hover:bg-green-950/15'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> NV Phosphor
                </button>

                {/* Thermal */}
                <button
                  onClick={() => setFilterMode('thermal')}
                  className={`p-2 border rounded font-bold uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
                    layers.filterMode === 'thermal'
                      ? 'bg-orange-500 text-black border-orange-500'
                      : 'bg-transparent text-orange-500/80 border-orange-950 hover:bg-orange-950/15'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" /> Heatmap
                </button>

                {/* Amber */}
                <button
                  onClick={() => setFilterMode('amber')}
                  className={`p-2 border rounded font-bold uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
                    layers.filterMode === 'amber'
                      ? 'bg-amber-600 text-black border-amber-600'
                      : 'bg-transparent text-amber-500/80 border-amber-950 hover:bg-amber-950/15'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Amber CRT
                </button>
              </div>
            </div>

            {/* Hint footer */}
            <div className="mt-4 pt-2 text-[8px] text-gray-500 text-center font-sans border-t border-white/5 uppercase select-none">
              Double-tap toggles to test desync resilience
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------------
// Interactive Render Layers Overlay wrapper
// -------------------------------------------------------------
interface UiLayersOverlayProps {
  layers: UiLayersState;
  activeProfile: 'cb77' | 'ac';
  children: React.ReactNode;
}

export function UiLayersOverlay({ layers, activeProfile, children }: UiLayersOverlayProps) {
  const isAc = activeProfile === 'ac';

  // Dynamic filter string classes matching the chosen modules
  const getFilterStyle = () => {
    switch (layers.filterMode) {
      case 'night-vision':
        return 'brightness(1.1) contrast(1.4) saturate(1.1) sepia(1) hue-rotate(85deg)';
      case 'thermal':
        return 'brightness(0.9) contrast(1.8) invert(0.8) sepia(1) hue-rotate(280deg) saturate(2.5)';
      case 'amber':
        return 'sepia(1) hue-rotate(5deg) saturate(2.2) contrast(1.1)';
      default:
        return 'none';
    }
  };

  // Scanline animation class
  const getScanlineAnimationSpeed = () => {
    switch (layers.scanlineSpeed) {
      case 'slow': return 'animation-duration: 12s';
      case 'fast': return 'animation-duration: 3s';
      default: return 'animation-duration: 6s';
    }
  };

  return (
    <div 
      className={`relative w-full min-h-screen transition-all duration-300 flex flex-col`}
      style={{ filter: getFilterStyle() }}
    >
      {/* 1. Vector Grid Backdrop Layer */}
      {layers.backgroundGrid && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.06]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isAc ? "var(--cp-yellow)" : "var(--cp-cyan)"} strokeWidth="1" />
                <circle cx="40" cy="40" r="1.5" fill={isAc ? "var(--cp-yellow)" : "var(--cp-cyan)"} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      )}

      {/* 2. Chromatic Aberration Spectrum Ripple Layer */}
      {layers.chromaticAberration && (
        <div className="fixed inset-0 pointer-events-none z-40 mix-blend-screen opacity-15">
          <div className="absolute inset-0 bg-red-500/5 translate-x-[1px] translate-y-[0.5px]" />
          <div className="absolute inset-0 bg-cyan-500/5 -translate-x-[1px] -translate-y-[0.5px]" />
        </div>
      )}

      {/* 3. CRT Scanlines Scrolling Overlay */}
      {layers.crtScanlines && (
        <>
          <div 
            className="fixed inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px] opacity-25" 
          />
          <div 
            className="fixed left-0 right-0 h-40 pointer-events-none z-40 bg-gradient-to-b from-transparent via-cp-cyan/10 to-transparent opacity-20"
            style={{
              animation: 'scanline 8s linear infinite',
              ...{ getScanlineAnimationSpeed } as any
            }}
          />
        </>
      )}

      {/* 4. Holographic Corner brackets & Target Indicators Layer */}
      {layers.hudBrackets && (
        <div className="fixed inset-4 pointer-events-none z-30 flex flex-col justify-between">
          {/* Top brackets */}
          <div className="flex justify-between">
            {/* Top Left */}
            <div className={`w-8 h-8 border-t-2 border-l-2 flex flex-col justify-start p-1 ${isAc ? 'border-cp-yellow/60' : 'border-cp-cyan/60'}`}>
              <span className="text-[7px] font-bold opacity-40">POS: L-01</span>
            </div>
            {/* Top Right */}
            <div className={`w-8 h-8 border-t-2 border-r-2 flex flex-col items-end justify-start p-1 ${isAc ? 'border-cp-yellow/60' : 'border-cp-cyan/60'}`}>
              <span className="text-[7px] font-bold opacity-40">AZI: 313°</span>
            </div>
          </div>

          {/* Centered Holographic HUD view finder */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none opacity-20">
            <div className={`w-24 h-24 border border-dashed rounded-full animate-spin-slow ${isAc ? 'border-cp-yellow' : 'border-cp-cyan'}`} />
            <div className={`absolute w-3 h-3 border ${isAc ? 'border-cp-yellow' : 'border-cp-cyan'}`} />
          </div>

          {/* Bottom brackets */}
          <div className="flex justify-between">
            {/* Bottom Left */}
            <div className={`w-8 h-8 border-b-2 border-l-2 flex flex-col justify-end p-1 ${isAc ? 'border-cp-yellow/60' : 'border-cp-cyan/60'}`}>
              <span className="text-[7px] font-bold opacity-40">SYS: {activeProfile.toUpperCase()}</span>
            </div>
            {/* Bottom Right */}
            <div className={`w-8 h-8 border-b-2 border-r-2 flex flex-col items-end justify-end p-1 ${isAc ? 'border-cp-yellow/60' : 'border-cp-cyan/60'}`}>
              <span className="text-[7px] font-bold opacity-40">ALT: {isAc ? '1800m' : '2077m'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Custom Thermal/Night-Vision Digital Status stamps */}
      {layers.filterMode !== 'none' && (
        <div className="fixed top-20 left-10 pointer-events-none z-30 flex items-center gap-2 bg-black/80 px-2.5 py-1 rounded border border-white/10">
          <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
          <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">
            {layers.filterMode === 'night-vision' ? 'PHOSPHOR NIGHT-VISION ACTIVE' : layers.filterMode === 'thermal' ? 'THERMAL INFRARED HEATMAP' : 'AMBER RETRO DISPLAY'}
          </span>
        </div>
      )}

      {/* Main Content Node */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
