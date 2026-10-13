import React, { useState } from 'react';
import { Cpu, Zap, ArrowRight, CheckCircle2, Split, Clock, Network, HelpCircle } from 'lucide-react';
import { CITIES, SEGMENTS } from '../data/transitData';
import { buildAdjacencyLists, runStandardBFS, runBidirectionalBFS } from '../services/routerEngine';

export const AlgorithmLab: React.FC = () => {
  const [sourceCity, setSourceCity] = useState('Chennai');
  const [targetCity, setTargetCity] = useState('Delhi');

  const { forwardAdj, reverseAdj } = buildAdjacencyLists(SEGMENTS);
  const stdBfs = runStandardBFS(forwardAdj, sourceCity, targetCity);
  const biBfs = runBidirectionalBFS(forwardAdj, reverseAdj, sourceCity, targetCity);

  const speedup = Math.max(1, Number((stdBfs.nodes_explored / Math.max(1, biBfs.total_nodes_explored || 1)).toFixed(2)));
  const reductionPercent = Math.max(0, Math.round(((stdBfs.nodes_explored - (biBfs.total_nodes_explored || 0)) / Math.max(1, stdBfs.nodes_explored)) * 100));

  const availableCities = Object.keys(CITIES);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                Algorithm Visualizer & Benchmark
              </span>
              <span className="text-xs text-slate-500 font-medium">Graph Search Engine</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Bidirectional BFS vs Standard Unidirectional BFS
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Compare search complexity, nodes explored, execution speed, and identify the exact intersection hub where forward and backward frontiers meet.
            </p>
          </div>

          {/* Hub Selectors */}
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Origin Hub</label>
              <select
                value={sourceCity}
                onChange={e => setSourceCity(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800"
              >
                {availableCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 mt-3" />
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Target Hub</label>
              <select
                value={targetCity}
                onChange={e => setTargetCity(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800"
              >
                {availableCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Standard BFS Explored
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stdBfs.nodes_explored} <span className="text-sm font-normal text-slate-500">nodes</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Unidirectional sweep expanding every neighbor level from source.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm bg-blue-50/20">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            Bidirectional BFS Explored
          </div>
          <div className="text-3xl font-extrabold text-blue-700">
            {biBfs.total_nodes_explored} <span className="text-sm font-normal text-slate-500">nodes</span>
          </div>
          <p className="text-[11px] text-blue-600 mt-2 font-medium">
            Forward: {biBfs.forward_nodes_explored} | Backward: {biBfs.backward_nodes_explored}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/20">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            Search Space Reduction
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">
            {reductionPercent}% <span className="text-sm font-normal text-slate-500">fewer nodes</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-2 font-medium">
            {speedup}x exploration efficiency boost
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm bg-rose-50/20">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
            Search Meeting Node
          </div>
          <div className="text-2xl font-extrabold text-rose-700 truncate">
            🎯 {biBfs.meeting_point || 'Direct'}
          </div>
          <p className="text-[11px] text-rose-600 mt-2 font-medium">
            Where forward and reverse frontiers collided
          </p>
        </div>
      </div>

      {/* Visual Comparison: Step-by-Step Exploration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standard BFS Side */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900">Standard BFS (Unidirectional)</h3>
              <p className="text-xs text-slate-500">Single frontier expanding outward with branching factor b^d</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
              O(b^d) Complexity
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700">Exploration Sequence ({stdBfs.explored_sequence.length} nodes):</span>
            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
              {stdBfs.explored_sequence.map((node, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${
                    node === sourceCity
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : node === targetCity
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {i + 1}. {node}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
            <b>Discovered Path ({stdBfs.path.length} hops):</b> {stdBfs.path.join(' ➔ ')}
          </div>
        </div>

        {/* Bidirectional BFS Side */}
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-4 bg-blue-50/10">
          <div className="flex items-center justify-between border-b border-blue-100 pb-3">
            <div>
              <h3 className="font-bold text-blue-950">Bidirectional BFS (Dual Waves)</h3>
              <p className="text-xs text-slate-500">Simultaneous frontiers expanding inward with 2 * b^(d/2)</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold">
              O(2 · b^(d/2)) Complexity
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-700">Forward Frontier ({biBfs.forward_explored?.length || 0}):</span>
              <div className="p-2.5 bg-white rounded-xl border border-blue-200 text-xs flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {biBfs.forward_explored?.map((node, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                    {node}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-indigo-700">Backward Frontier ({biBfs.backward_explored?.length || 0}):</span>
              <div className="p-2.5 bg-white rounded-xl border border-indigo-200 text-xs flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {biBfs.backward_explored?.map((node, idx) => (
                  <span key={idx} className="bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200">
                    {node}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs text-blue-900">
            <b>Meeting Node Hub:</b> <span className="font-bold text-rose-600">🎯 {biBfs.meeting_point}</span>. Path: {biBfs.path.join(' ➔ ')}
          </div>
        </div>
      </div>

      {/* Academic Explanations & Caveats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          Academic Clarification: When to Use Which Algorithm
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-800">1. Bidirectional BFS Role (Topology Discovery)</h4>
            <p>
              Bidirectional BFS finds the path with the <b>minimum number of transfers/hops</b> in an unweighted transit network. By growing two search spheres simultaneously, it stops the moment the frontiers collide at a common midpoint, drastically reducing combinatorial explosion.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1 text-amber-900">
            <h4 className="font-bold text-amber-950">2. Time-Dependent Dijkstra Role (Arrival Time Optimization)</h4>
            <p>
              <b>Important Distinction:</b> Bidirectional BFS alone does <i>not</i> guarantee the fastest journey when flight and train durations differ or departure schedules require waiting for layovers. That is why SmartRoute AI pairs Bidirectional BFS with a <b>Time-Dependent Dijkstra engine</b> that accounts for flight vs rail speeds, scheduled departure times, layover buffers, and reported delays.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
