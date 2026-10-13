import React, { useState } from 'react';
import { 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  TrendingDown, 
  Shuffle, 
  Flame,
  Info
} from 'lucide-react';
import { DEMO_SCENARIO_CHENNAI_DELHI } from '../data/transitData';
import { planItinerary } from '../services/routerEngine';
import { RouteMap } from './RouteMap';

export const WhatIfSimulator: React.FC = () => {
  const [selectedDelay, setSelectedDelay] = useState<number>(30);
  const [activePreset, setActivePreset] = useState<'chennai_delhi' | 'custom'>('chennai_delhi');

  // Plan with the simulated delay
  const replanResult = planItinerary(
    'Chennai',
    'Delhi',
    '06:00',
    'both',
    'fastest',
    undefined,
    { 'TR-101': selectedDelay }
  );

  const originalWithoutDelay = planItinerary('Chennai', 'Delhi', '06:00', 'both', 'fastest');
  const originalRoute = originalWithoutDelay.recommended_route;
  const replannedRoute = replanResult.recommended_route;

  const isCollapsed = selectedDelay >= 25; // Connection collapses when layover < 35 min buffer

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold tracking-wide uppercase">
                What-If Delay Simulator
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Demonstration Case Study (IRCTC Grand Trunk Collapse)
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Chennai ➔ Delhi Journey Stress Test
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl">
              {DEMO_SCENARIO_CHENNAI_DELHI.description}
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-xl">
            <Info className="w-4 h-4 text-amber-600" />
            <span>Labelled Demonstration Schedules</span>
          </div>
        </div>

        {/* Delay Selector Buttons */}
        <div className="mt-6 pt-5 border-t border-blue-200/60 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-700">Inject Initial Delay on Leg 1:</span>
          {[0, 15, 30, 45, 60, 90].map(mins => (
            <button
              key={mins}
              onClick={() => setSelectedDelay(mins)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedDelay === mins
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400'
              }`}
            >
              {mins === 0 ? 'On Time (0m)' : `+${mins} min Delay`}
              {mins >= 30 && <Flame className="w-3.5 h-3.5 text-rose-300" />}
            </button>
          ))}
        </div>
      </div>

      {/* Disruption Alert Card */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isCollapsed
          ? 'bg-rose-50/80 border-rose-200 text-rose-900'
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-start gap-3">
          {isCollapsed ? (
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="font-bold text-base">
              {isCollapsed
                ? `Connection Collapsed at Nagpur Junction (+${selectedDelay}m Delay)`
                : `Connection Intact (Layover Buffer Absorbs Delay)`}
            </h4>
            <p className="text-xs leading-relaxed opacity-90">
              {isCollapsed
                ? `Scheduled layover was 45 minutes. With an added ${selectedDelay}m delay on Grand Trunk Express, only ${Math.max(0, 45 - selectedDelay)} minutes remain. Railway safety transfer threshold is 35 minutes, resulting in an impossible connection to Telangana Express (12723). Automatic replanning triggered!`
                : `A ${selectedDelay}m delay leaves ${45 - selectedDelay}m layover buffer, which satisfies the 35m minimum requirement. No rerouting needed.`}
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Route Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Delayed Route Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Original Itinerary (Disrupted)
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Grand Trunk Exp ➔ Telangana Exp
              </h3>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              isCollapsed ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {isCollapsed ? 'Broken Connection' : 'Nominal Schedule'}
            </span>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Origin Departure:</span>
              <span className="font-semibold text-slate-800">18:50 Chennai (MAS)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Nagpur Transfer Slot:</span>
              <span className={`font-semibold ${isCollapsed ? 'text-rose-600' : 'text-slate-800'}`}>
                11:30 (+{selectedDelay}m = {11 + Math.floor((30 + selectedDelay) / 60)}:{(30 + selectedDelay) % 60})
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Available Layover:</span>
              <span className={`font-bold ${isCollapsed ? 'text-rose-600' : 'text-emerald-600'}`}>
                {Math.max(0, 45 - selectedDelay)} min (min needed: 35m)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Arrival at Delhi (NDLS):</span>
              <span className="font-semibold text-slate-800">
                {isCollapsed ? 'Cancelled / Next Day Train (+24h)' : '07:40 (+1d)'}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 italic">
            * In standard booking systems, passengers are stranded at Nagpur Junction when their first train arrives after the connecting train departs.
          </div>
        </div>

        {/* Recommended Replanned Route Card */}
        <div className="bg-white rounded-2xl border-2 border-blue-500/50 p-6 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            SmartRoute AI Recommended
          </div>

          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Autonomous Replanned Route
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              {replannedRoute?.route_id}: {replannedRoute?.segments.map(s => s.carrier.split('(')[0].trim()).join(' + ')}
            </h3>
          </div>

          <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Total Duration:</span>
              <span className="font-bold text-blue-700">
                {replannedRoute?.total_duration_formatted}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Estimated Total Fare:</span>
              <span className="font-bold text-slate-800">
                ₹{replannedRoute?.total_fare.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Safety Layover Margin:</span>
              <span className="font-bold text-emerald-600">
                Guaranteed {'>'} 60 min connection buffer
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">AI Risk Assessment:</span>
              <span className="font-semibold text-emerald-700">
                {replannedRoute?.ai_risk.risk_category} ({replannedRoute?.ai_risk.risk_score_percent}% risk)
              </span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
            <b>Explainable AI Justification:</b> {replannedRoute?.explanation}
          </div>
        </div>
      </div>

      {/* Interactive Route Map */}
      {replannedRoute && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Visualized Replanned Journey</span>
            <span className="text-xs font-normal text-slate-500">(Meeting point & connecting legs)</span>
          </h4>
          <RouteMap
            segments={replannedRoute.segments}
            origin="Chennai"
            destination="Delhi"
            meetingPoint={replanResult.algorithm_comparison.bidirectional_bfs.meeting_point}
          />
        </div>
      )}
    </div>
  );
};
