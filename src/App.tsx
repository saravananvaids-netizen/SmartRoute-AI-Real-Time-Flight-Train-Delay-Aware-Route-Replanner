/**
 * SmartRoute AI – Real-Time Flight & Train Delay-Aware Route Replanner
 * Main Application Dashboard & Interactive Travel Assistant
 */

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Search, 
  Zap, 
  MapPin, 
  Calendar, 
  Clock, 
  IndianRupee, 
  Plane, 
  Train, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Layers, 
  Sparkles, 
  Info, 
  RotateCcw,
  Flame,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronRight,
  Key,
  X,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

import { CITIES, SEGMENTS, DEMO_SCENARIO_CHENNAI_DELHI } from './data/transitData';
import { planItinerary } from './services/routerEngine';
import { 
  PlanResult, 
  ItineraryRoute, 
  TransportMode, 
  TravelPreference, 
  HistoryRecord 
} from './types/transit';

import { Navbar } from './components/Navbar';
import { RouteMap } from './components/RouteMap';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AlgorithmLab } from './components/AlgorithmLab';
import { RippleWaterfall } from './components/RippleWaterfall';
import { PythonProjectViewer } from './components/PythonProjectViewer';
import { HistoryDrawer } from './components/HistoryDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'replanner' | 'map' | 'whatif' | 'algorithms' | 'ripple' | 'history' | 'code'>('replanner');

  // Search parameters
  const [origin, setOrigin] = useState<string>('Chennai');
  const [destination, setDestination] = useState<string>('Delhi');
  const [travelDate, setTravelDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [depTime, setDepTime] = useState<string>('06:00');
  const [transportType, setTransportType] = useState<TransportMode>('both');
  const [preference, setPreference] = useState<TravelPreference>('fastest');
  const [maxBudget, setMaxBudget] = useState<string>('');
  
  // Delay simulation
  const [simulateDelay, setSimulateDelay] = useState<boolean>(false);
  const [simulatedDelayMins, setSimulatedDelayMins] = useState<number>(30);
  
  // Search result state
  const [searchResult, setSearchResult] = useState<PlanResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Search history
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('smartroute_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const availableCities = Object.keys(CITIES);

  // Initial load search
  useEffect(() => {
    executeSearch(false, 0);
  }, []);

  const executeSearch = (withDelay: boolean = simulateDelay, delayAmount: number = simulatedDelayMins) => {
    if (origin === destination) {
      setValidationError('Starting city and destination must be different.');
      return;
    }
    setValidationError(null);
    setIsSearching(true);

    const activeDelays: Record<string, number> = {};
    if (withDelay && delayAmount > 0) {
      activeDelays['TR-101'] = delayAmount;
      activeDelays['FL-202'] = delayAmount;
    }

    const budgetNum = maxBudget ? parseFloat(maxBudget) : undefined;
    const result = planItinerary(
      origin,
      destination,
      depTime,
      transportType,
      preference,
      budgetNum,
      activeDelays
    );

    setSearchResult(result);
    if (result.recommended_route) {
      setSelectedRouteId(result.recommended_route.route_id);

      // Save to history
      const newRecord: HistoryRecord = {
        id: Date.now(),
        search_timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        origin,
        destination,
        travel_date: travelDate,
        departure_time: depTime,
        transport_type: transportType,
        preference,
        status: result.recommended_route.validation.overall_status,
        simulated_delay_min: withDelay ? delayAmount : 0,
        original_duration_min: result.original_route?.total_duration_min || 0,
        recommended_duration_min: result.recommended_route.total_duration_min,
        recommended_route_summary: `${result.recommended_route.segments.length} legs via ${result.recommended_route.segments.map(s => s.origin).join(' ➔ ')}`,
        time_saved_min: result.time_saved_min
      };

      setHistory(prev => {
        const updated = [newRecord, ...prev.slice(0, 19)];
        try {
          localStorage.setItem('smartroute_history', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    setTimeout(() => setIsSearching(false), 200);
  };

  const handleApplyPreset = (presetOrigin: string, presetDest: string, presetDelay: number) => {
    setOrigin(presetOrigin);
    setDestination(presetDest);
    setSimulateDelay(presetDelay > 0);
    setSimulatedDelayMins(presetDelay);
    executeSearch(presetDelay > 0, presetDelay);
  };

  const [showApiModal, setShowApiModal] = useState<boolean>(false);

  const activeRoute = searchResult?.all_routes.find(r => r.route_id === selectedRouteId) || searchResult?.recommended_route || null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        onOpenApiModal={() => setShowApiModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'replanner' && (
          <>
            {/* Main Dashboard Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-white to-sky-50/60 rounded-3xl border border-blue-100 p-6 sm:p-8 shadow-sm">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Smart Travel Replanner & Disruption Assistant</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                  SmartRoute AI – Your Journey, Replanned.
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  Travel disruptions happen. SmartRoute AI helps you discover alternative journeys and make better travel decisions.
                </p>
              </div>

              {/* Quick College Demo Preset Pill */}
              <div className="mt-6 pt-5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span className="font-bold text-slate-800">Featured Student Case:</span>
                  <span>Grand Trunk Express 30m Delay Collapse</span>
                </div>

                <button
                  onClick={() => handleApplyPreset('Chennai', 'Delhi', 30)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all"
                >
                  <span>Load Chennai ➔ Delhi (30m Delay)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Travel Query Search Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              {validationError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Origin */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Starting City or Station
                  </label>
                  <select
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  >
                    {availableCities.map(c => (
                      <option key={c} value={c}>{c} ({CITIES[c].code})</option>
                    ))}
                  </select>
                </div>

                {/* Destination */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    Destination City or Station
                  </label>
                  <select
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  >
                    {availableCities.map(c => (
                      <option key={c} value={c}>{c} ({CITIES[c].code})</option>
                    ))}
                  </select>
                </div>

                {/* Travel Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    Travel Date
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={e => setTravelDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Preferred Departure Time */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    Preferred Departure Time
                  </label>
                  <input
                    type="time"
                    value={depTime}
                    onChange={e => setDepTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Secondary Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Transport Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Transport Type</label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                    {(['both', 'train', 'flight'] as TransportMode[]).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTransportType(mode)}
                        className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                          transportType === mode
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {mode === 'both' ? 'Both' : mode === 'train' ? 'Train' : 'Flight'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optimization Preference */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Travel Preference</label>
                  <select
                    value={preference}
                    onChange={e => setPreference(e.target.value as TravelPreference)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="fastest">Fastest (Minimum Travel Time)</option>
                    <option value="cheapest">Cheapest (Lowest Ticket Cost)</option>
                    <option value="fewest_transfers">Fewest Transfers (Minimum Layover Stops)</option>
                  </select>
                </div>

                {/* Max Budget */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Maximum Budget</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={maxBudget}
                      onChange={e => setMaxBudget(e.target.value)}
                      className="w-full pl-7 pr-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* What-If Delay Simulation Toggle Row */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="sim_check"
                    checked={simulateDelay}
                    onChange={e => setSimulateDelay(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="sim_check" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Enable What-If Delay Simulator on Connecting Segment
                  </label>

                  {simulateDelay && (
                    <div className="flex items-center gap-1.5 ml-2">
                      {[15, 30, 45, 60].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setSimulatedDelayMins(mins)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            simulatedDelayMins === mins
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          +{mins}m
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSimulateDelay(true);
                      setSimulatedDelayMins(30);
                      executeSearch(true, 30);
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Flame className="w-4 h-4 text-rose-600" />
                    Simulate a Delay
                  </button>

                  <button
                    onClick={() => executeSearch(simulateDelay, simulatedDelayMins)}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Search className="w-4 h-4" />
                    Find My Route
                  </button>
                </div>
              </div>
            </div>

            {/* RESULTS DASHBOARD */}
            {searchResult && activeRoute && (
              <div className="space-y-6">
                {/* Result Summary Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Journey Duration
                    </span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">
                      {activeRoute.total_duration_formatted}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Departs {activeRoute.departure_time} ➔ Arrives {activeRoute.arrival_time}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Estimated Total Fare
                    </span>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">
                      ₹{activeRoute.total_fare.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Across {activeRoute.segments.length} combined ticket segments
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Connection Reliability
                    </span>
                    <div className={`text-xl font-extrabold mt-1 ${
                      activeRoute.validation.has_missed_connection
                        ? 'text-rose-600'
                        : activeRoute.validation.has_tight_connection
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}>
                      {activeRoute.validation.overall_status}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {activeRoute.transfers === 0 ? 'Direct service' : `${activeRoute.transfers} transfer stop(s)`}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Time Saved vs Delay
                    </span>
                    <div className="text-xl font-extrabold text-emerald-700 mt-1">
                      {searchResult.time_saved_min > 0 ? `+${searchResult.time_saved_min} min saved` : 'Optimal Schedule'}
                    </div>
                    <span className="text-[10px] text-emerald-600">
                      Compared to disrupted itinerary
                    </span>
                  </div>
                </div>

                {/* Missed Connection Warning Card (If applicable) */}
                {activeRoute.validation.has_missed_connection && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm">Missed Connection Alert</h4>
                      <p className="text-xs leading-relaxed opacity-90">
                        {activeRoute.validation.connection_evaluations.find(e => e.is_missed)?.explanation ||
                          'The scheduled layover duration has fallen below the safety buffer. Automatic route replanning has selected viable alternatives.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Explainable AI Card */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-950 mb-0.5">Explainable AI Recommendation</h4>
                    <p className="leading-relaxed">{activeRoute.explanation}</p>
                  </div>
                </div>

                {/* Main Selected Itinerary Breakdown */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {activeRoute.route_id}
                        </span>
                        <h3 className="font-bold text-base text-slate-900">
                          {activeRoute.origin} ➔ {activeRoute.destination}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {activeRoute.segments.length} segment(s) | Criteria: {searchResult.preference}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Live API Status:</span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        Demo Mode (Offline Verified)
                      </span>
                    </div>
                  </div>

                  {/* Leg Steps */}
                  <div className="space-y-4">
                    {activeRoute.segments.map((seg, idx) => {
                      const isFlight = seg.mode === 'flight';
                      const hasDelay = (seg.actual_delay_min || 0) > 0;

                      return (
                        <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                                isFlight ? 'bg-blue-600' : 'bg-emerald-600'
                              }`}>
                                {isFlight ? <Plane className="w-4 h-4" /> : <Train className="w-4 h-4" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-900">{seg.carrier}</h4>
                                <span className="text-[11px] text-slate-500">
                                  {seg.origin} ➔ {seg.destination} • {seg.distance_km} km
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {hasDelay ? (
                                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                  +{seg.actual_delay_min}m Delay
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  On Time
                                </span>
                              )}
                              <span className="text-xs font-bold text-slate-800">
                                ₹{seg.base_fare.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Departure</span>
                              <span className="font-bold text-slate-800">{seg.formatted_dep || seg.dep_time}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Arrival</span>
                              <span className="font-bold text-slate-800">{seg.formatted_arr || seg.arr_time}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Transit Duration</span>
                              <span className="font-bold text-slate-800">
                                {Math.floor(seg.duration_min / 60)}h {seg.duration_min % 60}m
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">AI Risk Score</span>
                              <span className="font-bold text-emerald-700">
                                {activeRoute.ai_risk.risk_category} ({activeRoute.ai_risk.risk_score_percent}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Route Map */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-blue-600" />
                      Interactive Geographic Journey Map
                    </h3>
                    <span className="text-xs text-slate-500">
                      Meeting node detected via Bidirectional BFS: <b>{searchResult.algorithm_comparison.bidirectional_bfs.meeting_point}</b>
                    </span>
                  </div>
                  <RouteMap
                    segments={activeRoute.segments}
                    origin={activeRoute.origin}
                    destination={activeRoute.destination}
                    meetingPoint={searchResult.algorithm_comparison.bidirectional_bfs.meeting_point}
                  />
                </div>

                {/* Smart Route Alternatives Comparison */}
                {searchResult.all_routes.length > 1 && (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-600" />
                      Smart Alternative Route Comparison
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {searchResult.all_routes.slice(0, 3).map(route => {
                        const isSelected = route.route_id === selectedRouteId;
                        return (
                          <div
                            key={route.route_id}
                            onClick={() => setSelectedRouteId(route.route_id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                                : 'border-slate-200 hover:border-blue-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-500">
                                Route #{route.rank} ({route.segments[0].mode.toUpperCase()})
                              </span>
                              {route.is_recommended && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                  Top Pick
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="text-lg font-bold text-slate-900">
                                {route.total_duration_formatted}
                              </div>
                              <div className="text-xs text-slate-600">
                                ₹{route.total_fare.toLocaleString()} • {route.transfers} transfer(s)
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-2">
                                {route.explanation}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Dedicated Route Map Studio Tab */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                      Geographic Corridor Studio
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Multimodal Network & Delay Hubs</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Interactive Transport & Replanning Route Map
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    Visualize live flight corridors, Indian Railways trunk routes, intermediate transfer junctions, and the exact collision point where Bidirectional BFS forward and backward frontiers converge.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setOrigin('Chennai');
                      setDestination('Delhi');
                      setSimulateDelay(true);
                      setSimulatedDelayMins(30);
                      executeSearch(true, 30);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-300" />
                    <span>Focus on Chennai ➔ Delhi (30m Delay Case)</span>
                  </button>
                </div>
              </div>
            </div>

            <RouteMap
              segments={activeRoute?.segments || []}
              origin={origin}
              destination={destination}
              meetingPoint={searchResult?.algorithm_comparison.bidirectional_bfs.meeting_point}
              height="580px"
              initialShowAll={true}
            />
          </div>
        )}

        {/* What-If Simulator Tab */}
        {activeTab === 'whatif' && <WhatIfSimulator />}

        {/* Algorithm Lab Tab */}
        {activeTab === 'algorithms' && <AlgorithmLab />}

        {/* Delay Ripple Analysis Tab */}
        {activeTab === 'ripple' && <RippleWaterfall />}

        {/* Journey History Tab */}
        {activeTab === 'history' && (
          <HistoryDrawer
            history={history}
            onSelectRecord={rec => {
              setOrigin(rec.origin);
              setDestination(rec.destination);
              setTravelDate(rec.travel_date);
              setDepTime(rec.departure_time);
              setPreference(rec.preference as TravelPreference);
              setActiveTab('replanner');
              executeSearch(rec.simulated_delay_min > 0, rec.simulated_delay_min);
            }}
            onClearHistory={() => {
              setHistory([]);
              localStorage.removeItem('smartroute_history');
            }}
          />
        )}

        {/* Python Code & Setup Tab */}
        {activeTab === 'code' && <PythonProjectViewer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <b>SmartRoute AI</b> – Autonomous Flight & Train Delay-Aware Replanner
          </div>
          <div>
            Powered by Bidirectional BFS, Time-Dependent Dijkstra & Scikit-learn AI Delay Risk
          </div>
        </div>
      </footer>

      {/* API Configuration & Status Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">API Key Configuration & Status</h3>
                  <p className="text-xs text-slate-500">Live Transport Data & Verified Demonstration Mode</p>
                </div>
              </div>

              <button
                onClick={() => setShowApiModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status Box */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm">Demonstration Mode is Active (No API Key Required)</h4>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                SmartRoute AI is built to run <b>100% offline out-of-the-box</b> using verified demonstration schedules, real Indian Railways connection hubs, and real flight routes. You do not need to register or pay for any API keys to test, run, or present this project.
              </p>
            </div>

            {/* How to add live keys */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Optional: Connecting Live Production APIs
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you wish to fetch live real-time flight and train data, configure credentials in your server environment file (<code>.env</code>). Per security guidelines, API keys are never exposed in frontend code.
              </p>

              <div className="space-y-3 pt-1">
                {/* Amadeus */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">1. Amadeus Flight API</span>
                    <a
                      href="https://developers.amadeus.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      developers.amadeus.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Provides self-service flight schedules and search endpoints. Free sandbox tier with 2,000 monthly calls.
                  </p>
                  <code className="block p-2 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-lg">
                    AMADEUS_CLIENT_ID="your_client_id"<br/>
                    AMADEUS_CLIENT_SECRET="your_client_secret"
                  </code>
                </div>

                {/* RailRadar */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">2. RailRadar / IRCTC Train Status API</span>
                    <a
                      href="https://railradar.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      railradar.in <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Provides live train running status and station schedules across Indian Railways.
                  </p>
                  <code className="block p-2 bg-slate-900 text-slate-200 text-[11px] font-mono rounded-lg">
                    RAIL_RADAR_API_KEY="your_api_key"
                  </code>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowApiModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                Close & Continue in Demo Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
