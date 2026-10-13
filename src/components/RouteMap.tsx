import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CITIES, SEGMENTS } from '../data/transitData';
import { TransitSegment } from '../types/transit';
import { Layers, Plane, Train, Sparkles, Navigation, Info, Eye } from 'lucide-react';

interface RouteMapProps {
  segments: TransitSegment[];
  origin: string;
  destination: string;
  meetingPoint?: string | null;
  height?: string;
  initialShowAll?: boolean;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  segments,
  origin,
  destination,
  meetingPoint,
  height = '500px',
  initialShowAll = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [modeFilter, setModeFilter] = useState<'all' | 'train' | 'flight'>('all');
  const [viewScope, setViewScope] = useState<'route' | 'network'>(initialShowAll ? 'network' : 'route');
  const [selectedCityInfo, setSelectedCityInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.5, 78.5],
        zoom: 5,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous layers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    const latLngBounds = L.latLngBounds([]);

    // Decide segments to render
    const segmentsToRender = viewScope === 'network' ? SEGMENTS : segments;
    const filteredSegments = segmentsToRender.filter(seg => {
      if (modeFilter === 'all') return true;
      return seg.mode === modeFilter;
    });

    // Collect all nodes to display
    const nodesToDisplay: { name: string; lat: number; lng: number }[] = [];
    if (viewScope === 'network') {
      Object.values(CITIES).forEach(c => nodesToDisplay.push(c));
    } else {
      segments.forEach(seg => {
        const c1 = CITIES[seg.origin];
        const c2 = CITIES[seg.destination];
        if (c1 && !nodesToDisplay.some(n => n.name === c1.name)) nodesToDisplay.push(c1);
        if (c2 && !nodesToDisplay.some(n => n.name === c2.name)) nodesToDisplay.push(c2);
      });
      // Ensure origin and destination are present
      if (CITIES[origin] && !nodesToDisplay.some(n => n.name === origin)) nodesToDisplay.push(CITIES[origin]);
      if (CITIES[destination] && !nodesToDisplay.some(n => n.name === destination)) nodesToDisplay.push(CITIES[destination]);
    }

    // Draw route segments
    filteredSegments.forEach(seg => {
      const c1 = CITIES[seg.origin];
      const c2 = CITIES[seg.destination];
      if (!c1 || !c2) return;

      const isFlight = seg.mode === 'flight';
      const isPartOfActiveRoute = segments.some(s => s.id === seg.id);

      const color = isFlight ? '#2563eb' : '#059669';
      const weight = isPartOfActiveRoute ? 5 : 2;
      const opacity = isPartOfActiveRoute ? 0.9 : 0.35;

      const polyline = L.polyline(
        [
          [c1.lat, c1.lng],
          [c2.lat, c2.lng]
        ],
        {
          color,
          weight,
          opacity,
          dashArray: isFlight ? '7, 7' : undefined
        }
      ).addTo(map);

      polyline.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px;">
          <b>${seg.carrier}</b> (${seg.mode.toUpperCase()})<br/>
          <span>${seg.origin} ➔ ${seg.destination}</span><br/>
          <span style="color: #64748b;">${seg.dep_time} - ${seg.arr_time} (${Math.floor(seg.duration_min / 60)}h ${seg.duration_min % 60}m) | ₹${seg.base_fare.toLocaleString()}</span>
        </div>`,
        { sticky: true }
      );

      latLngBounds.extend([c1.lat, c1.lng]);
      latLngBounds.extend([c2.lat, c2.lng]);
    });

    // Draw node markers
    nodesToDisplay.forEach(node => {
      const isOrigin = node.name === origin;
      const isDest = node.name === destination;
      const isMeeting = node.name === meetingPoint;
      const isPartOfRoute = segments.some(s => s.origin === node.name || s.destination === node.name);

      let bgColor = '#3b82f6';
      let iconSymbol = '📍';
      let roleLabel = 'Transit Station';

      if (isMeeting) {
        bgColor = '#ef4444';
        iconSymbol = '🎯';
        roleLabel = 'Bidirectional BFS Meeting Point';
      } else if (isOrigin) {
        bgColor = '#10b981';
        iconSymbol = '🛫';
        roleLabel = 'Journey Origin';
      } else if (isDest) {
        bgColor = '#8b5cf6';
        iconSymbol = '🏁';
        roleLabel = 'Journey Destination';
      } else if (isPartOfRoute) {
        bgColor = '#f59e0b';
        iconSymbol = '🔄';
        roleLabel = 'Transfer Junction';
      }

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${bgColor};
            color: white;
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
            border-radius: 9999px;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
            transform: translate(-50%, -50%);
          ">
            <span>${iconSymbol}</span>
            <span>${node.name}</span>
          </div>
        `,
        iconSize: [84, 24],
        iconAnchor: [42, 12]
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(map);

      // Connected departures from this city
      const departingSegs = SEGMENTS.filter(s => s.origin === node.name);
      const departingList = departingSegs.map(s => 
        `<div style="font-size: 10px; margin-top: 2px;">• <b>${s.carrier}</b> ➔ ${s.destination} (${s.dep_time})</div>`
      ).join('');

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; max-width: 240px;">
          <h4 style="margin: 0 0 4px 0; font-weight: 700; color: #0f172a; font-size: 13px;">
            ${node.name} (${CITIES[node.name]?.code || ''})
          </h4>
          <p style="margin: 0; color: #475569; font-size: 11px;">Status: <b>${roleLabel}</b></p>
          ${isMeeting ? '<p style="margin: 4px 0; color: #b91c1c; font-size: 11px; background: #fee2e2; padding: 3px 6px; border-radius: 4px;"><b>🎯 BFS Meeting Collision Point:</b> Simultaneous forward and reverse frontiers collided here.</p>' : ''}
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
            <span style="font-weight: 700; font-size: 10px; color: #64748b; text-transform: uppercase;">Direct Outgoing Services:</span>
            ${departingList}
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedCityInfo(node.name);
      });

      latLngBounds.extend([node.lat, node.lng]);
    });

    if (latLngBounds.isValid()) {
      map.fitBounds(latLngBounds, { padding: [40, 40], maxZoom: 7 });
    }
  }, [segments, origin, destination, meetingPoint, modeFilter, viewScope]);

  const handleCityFocus = (cityName: string) => {
    const c = CITIES[cityName];
    if (c && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([c.lat, c.lng], 7, { duration: 1.2 });
      setSelectedCityInfo(cityName);
    }
  };

  return (
    <div className="space-y-3">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-xs">
        {/* Scope Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewScope('route')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              viewScope === 'route'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Active Route Only ({origin} ➔ {destination})
          </button>
          <button
            onClick={() => setViewScope('network')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              viewScope === 'network'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Explore Full Transit Network
          </button>
        </div>

        {/* Mode Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Filter:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setModeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                modeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Corridors
            </button>
            <button
              onClick={() => setModeFilter('train')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                modeFilter === 'train' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700'
              }`}
            >
              <Train className="w-3 h-3" /> Rail Lines
            </button>
            <button
              onClick={() => setModeFilter('flight')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                modeFilter === 'flight' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700'
              }`}
            >
              <Plane className="w-3 h-3" /> Flights
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Box */}
      <div 
        className="relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-md text-xs flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-3.5 h-1.5 bg-emerald-600 rounded"></span>
            <span>Indian Railways Line</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-3.5 h-1.5 border-b-2 border-dashed border-blue-600"></span>
            <span>Flight Corridor</span>
          </div>
          {meetingPoint && (
            <div className="flex items-center gap-1.5 font-bold text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>BFS Meeting Node: {meetingPoint}</span>
            </div>
          )}
        </div>

        {/* Quick Hub Focus Bar */}
        <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur p-2 rounded-2xl border border-slate-200 shadow-md flex items-center gap-1.5 hidden md:flex text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Jump to:</span>
          {['Chennai', 'Delhi', 'Nagpur', 'Mumbai', 'Hyderabad', 'Bangalore'].map(city => (
            <button
              key={city}
              onClick={() => handleCityFocus(city)}
              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 font-semibold transition-all text-[11px]"
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
