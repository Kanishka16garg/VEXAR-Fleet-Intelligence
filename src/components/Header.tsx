import React, { useState } from 'react';
import { Search, Calendar, ShieldCheck, Activity, ArrowRight, Info } from 'lucide-react';
import { getDrivers, getVehicles } from '../data/dataLoader';

interface HeaderProps {
  onSelectEntity: (type: 'driver' | 'vehicle', id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSelectEntity }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const drivers = getDrivers();
  const vehicles = getVehicles();

  const filteredDrivers = searchQuery.trim()
    ? drivers.filter(
        d =>
          d.Driver_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.Driver_Name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const filteredVehicles = searchQuery.trim()
    ? vehicles.filter(
        v =>
          v.Vehicle_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.Make.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.Model.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const hasResults = filteredDrivers.length > 0 || filteredVehicles.length > 0;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
      {/* Title & Product Positioning */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2.5 rounded-xl text-slate-950 font-black shadow-lg shadow-cyan-500/10 shrink-0">
          <Activity className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">VEXAR Fleet Intelligence</h1>
            <span className="bg-cyan-950 text-cyan-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-800/50">
              Explainable Signals
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Explainable intelligence for driver behaviour and vehicle inspection.
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Driver ID, Name, Vehicle ID, Model..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* Search Dropdown Modal */}
          {isOpen && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60">
              {filteredDrivers.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Drivers</div>
                  {filteredDrivers.map(d => (
                    <button
                      key={d.Driver_ID}
                      onClick={() => {
                        onSelectEntity('driver', d.Driver_ID);
                        setSearchQuery('');
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <span className="text-sm font-semibold text-slate-200">{d.Driver_ID} — {d.Driver_Name}</span>
                        <span className="text-xs text-slate-400 block">{d.recommended_action}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-cyan-400">Signal: {d.hybrid_signal.toFixed(1)}</span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredVehicles.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Vehicles</div>
                  {filteredVehicles.map(v => (
                    <button
                      key={v.Vehicle_ID}
                      onClick={() => {
                        onSelectEntity('vehicle', v.Vehicle_ID);
                        setSearchQuery('');
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <span className="text-sm font-semibold text-slate-200">{v.Vehicle_ID} — {v.Make} {v.Model}</span>
                        <span className="text-xs text-slate-400 block">{v.recommended_action}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-400">Signal: {v.hybrid_signal.toFixed(1)}</span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors ml-auto" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!hasResults && (
                <div className="p-4 text-center text-sm text-slate-400">
                  No matching driver or vehicle found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Methodology Disclaimer Badge */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-400">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>Signals are fleet-relative; not accident/failure probabilities.</span>
      </div>
    </header>
  );
};
