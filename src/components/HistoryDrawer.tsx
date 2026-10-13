import React from 'react';
import { History, Clock, ArrowRight, Trash2, RotateCcw } from 'lucide-react';
import { HistoryRecord } from '../types/transit';

interface HistoryDrawerProps {
  history: HistoryRecord[];
  onSelectRecord: (record: HistoryRecord) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onSelectRecord,
  onClearHistory
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-lg text-slate-900">Journey Search History</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {history.length} saved
          </span>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-400 space-y-2">
          <Clock className="w-10 h-10 mx-auto stroke-1" />
          <p className="text-sm font-medium">No recent journeys recorded yet.</p>
          <p className="text-xs text-slate-400">Perform a search to save your itinerary automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{item.origin}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-sm text-slate-900">{item.destination}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                    {item.transport_type}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-3">
                  <span>📅 {item.travel_date || 'Today'}</span>
                  <span>⏰ {item.departure_time}</span>
                  <span>⚡ Pref: {item.preference}</span>
                  {item.simulated_delay_min > 0 && (
                    <span className="text-rose-600 font-semibold">
                      +{item.simulated_delay_min}m simulated delay
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800">
                    {Math.floor(item.recommended_duration_min / 60)}h {item.recommended_duration_min % 60}m
                  </div>
                  {item.time_saved_min > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold">
                      Saved {item.time_saved_min}m
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onSelectRecord(item)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 text-blue-600 text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Replay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
