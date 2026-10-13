import React from 'react';
import { Compass, Map, Zap, Cpu, Waves, History, Code2, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'replanner' | 'map' | 'whatif' | 'algorithms' | 'ripple' | 'history' | 'code';
  setActiveTab: (tab: 'replanner' | 'map' | 'whatif' | 'algorithms' | 'ripple' | 'history' | 'code') => void;
  historyCount: number;
  onOpenApiModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, historyCount, onOpenApiModal }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('replanner')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">SmartRoute AI</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  v2.4 Live
                </span>
              </div>
              <p className="text-xs text-slate-500">Delay-Aware Journey Replanner</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('replanner')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'replanner'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              Replanner
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-4 h-4" />
              Route Map
            </button>

            <button
              onClick={() => setActiveTab('whatif')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'whatif'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              What-If Simulator
            </button>

            <button
              onClick={() => setActiveTab('algorithms')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'algorithms'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Algorithm Benchmark
            </button>

            <button
              onClick={() => setActiveTab('ripple')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ripple'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Waves className="w-4 h-4" />
              Ripple Analysis
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              History
              {historyCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'code'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Python Project & Tests
            </button>
          </nav>

          {/* Status Badges & API Key Info */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenApiModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Click to view API Keys & Demo Mode details"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Demo Mode (No Keys Needed)</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
