import React, { useState } from 'react';
import { Waves, ArrowDown, AlertOctagon, CheckCircle2, Flame, RefreshCcw } from 'lucide-react';
import { SEGMENTS } from '../data/transitData';
import { analyzeDelayRipple } from '../services/routerEngine';
import { TransitSegment } from '../types/transit';

export const RippleWaterfall: React.FC = () => {
  const [initialDelay, setInitialDelay] = useState<number>(30);
  const [activeLegIndex, setActiveLegIndex] = useState<number>(0);

  // Sample multi-leg route: Chennai -> Nagpur (Train) -> Delhi (Train/Flight)
  const sampleLegs: TransitSegment[] = [
    SEGMENTS.find(s => s.id === 'TR-101')!,
    SEGMENTS.find(s => s.id === 'TR-102')!
  ].filter(Boolean);

  const rippleResult = analyzeDelayRipple(sampleLegs, initialDelay, activeLegIndex);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold uppercase tracking-wider">
                Cascade Modeling Engine
              </span>
              <span className="text-xs text-slate-500 font-medium">Delay Ripple Analysis</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Delay Propagation & Transfer Buffer Waterfall
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Inspect how a delay on an upstream leg pushes downstream departure slots, absorbs layover slack, or triggers catastrophic missed-connection cascades.
            </p>
          </div>

          {/* Quick Delay Slider */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Initial Delay:</span>
            <div className="flex items-center gap-2">
              {[0, 15, 30, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => setInitialDelay(mins)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    initialDelay === mins
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400'
                  }`}
                >
                  +{mins}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ripple Status Callout */}
      <div className={`p-5 rounded-2xl border ${
        rippleResult.itinerary_collapsed
          ? 'bg-rose-50 border-rose-200 text-rose-950'
          : 'bg-emerald-50 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex items-center gap-3">
          {rippleResult.itinerary_collapsed ? (
            <AlertOctagon className="w-6 h-6 text-rose-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          )}
          <div>
            <h4 className="font-bold text-sm">
              {rippleResult.itinerary_collapsed ? 'Connection Failure Detected' : 'Delay Safely Absorbed'}
            </h4>
            <p className="text-xs mt-0.5 opacity-90">{rippleResult.summary}</p>
          </div>
        </div>
      </div>

      {/* Waterfall Visualizer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 text-base">Journey Leg Waterfall</h3>

        <div className="space-y-4">
          {rippleResult.ripple_steps.map((step, idx) => {
            const hasCascade = step.added_delay_min > 0;
            const isBreach = step.status.includes('MISSED CONNECTION');

            return (
              <div key={idx} className="relative">
                {idx > 0 && (
                  <div className="flex justify-center my-2">
                    <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-600 border border-slate-200">
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>Transfer Layover Buffer at {step.origin}</span>
                    </div>
                  </div>
                )}

                <div className={`p-4 rounded-xl border transition-all ${
                  isBreach
                    ? 'bg-rose-50/60 border-rose-300 shadow-sm'
                    : hasCascade
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          Leg {step.leg_index + 1}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">
                          {step.origin} ➔ {step.destination}
                        </h4>
                        <span className="text-xs text-slate-500">({step.carrier})</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Scheduled Departure: <b>{step.scheduled_dep}</b> | Effective Departure: <b>{step.effective_dep}</b>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                          isBreach
                            ? 'bg-rose-100 text-rose-800'
                            : hasCascade
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {step.added_delay_min > 0 ? `+${step.added_delay_min}m Delay` : 'On Time'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{step.status}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
                    <span>Impact: <b>{step.impact}</b></span>
                    {isBreach && (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> Ripple Cascade Failure
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
