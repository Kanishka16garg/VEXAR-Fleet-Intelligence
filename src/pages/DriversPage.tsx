import React, { useState } from 'react';
import { Users, Filter, ArrowUpDown, Search, ArrowUpRight, HelpCircle, Info } from 'lucide-react';
import { getDrivers, DriverRecord } from '../data/dataLoader';

interface DriversPageProps {
  onSelectDriver: (id: string) => void;
}

export const DriversPage: React.FC<DriversPageProps> = ({ onSelectDriver }) => {
  const allDrivers = getDrivers();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [evidenceFilter, setEvidenceFilter] = useState('ALL');
  const [attributionFilter, setAttributionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'rank' | 'signal' | 'persistence' | 'speed_std'>('rank');

  // Filter logic
  let filtered = allDrivers.filter(d => {
    const matchSearch =
      d.Driver_ID.toLowerCase().includes(search.toLowerCase()) ||
      d.Driver_Name.toLowerCase().includes(search.toLowerCase());

    const matchAction = actionFilter === 'ALL' || d.recommended_action === actionFilter;
    const matchEvidence = evidenceFilter === 'ALL' || d.driver_evidence_strength === evidenceFilter;
    const matchAttribution = attributionFilter === 'ALL' || d.driver_attribution === attributionFilter;

    return matchSearch && matchAction && matchEvidence && matchAttribution;
  });

  // Sort logic
  filtered.sort((a, b) => {
    if (sortBy === 'rank') return a.fleet_rank - b.fleet_rank;
    if (sortBy === 'signal') return b.hybrid_signal - a.hybrid_signal;
    if (sortBy === 'persistence') return b.persistence_score - a.persistence_score;
    if (sortBy === 'speed_std') return b.speed_std_mean - a.speed_std_mean;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-bold text-slate-100">DRIVER BEHAVIOUR INTELLIGENCE</h1>
            </div>
            <p className="text-xs text-slate-400">
              Identify behavioural patterns that may deserve coaching or monitoring.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-3 py-1.5 rounded-lg border border-cyan-800/50 shrink-0">
            Showing {filtered.length} of 30 Drivers
          </span>
        </div>

        {/* INFO BOX: WHAT DOES THE SIGNAL MEAN? */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">WHAT DOES THE SIGNAL MEAN?</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              The driver signal is a fleet-relative measure based on speed variability, upper-tail speed behaviour, acceleration, rotational movement, exposure-normalized events and persistence.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Filters & Sorting</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Driver ID or Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Recommended Actions</option>
            <option value="Focused Coaching Review">Focused Coaching Review</option>
            <option value="Behavioral Coaching Review">Behavioral Coaching Review</option>
            <option value="Routine Performance Monitoring">Routine Performance Monitoring</option>
            <option value="Standard Monitoring / Low Evidence">Standard Monitoring / Low Evidence</option>
          </select>

          {/* Evidence Filter */}
          <select
            value={evidenceFilter}
            onChange={e => setEvidenceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Evidence Strengths</option>
            <option value="HIGH">HIGH Evidence</option>
            <option value="MEDIUM">MEDIUM Evidence</option>
            <option value="LOW">LOW Evidence</option>
          </select>

          {/* Attribution Filter */}
          <select
            value={attributionFilter}
            onChange={e => setAttributionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Attribution Categories</option>
            <option value="DRIVER-LINKED PATTERN">DRIVER-LINKED PATTERN</option>
            <option value="JOINT DRIVER-VEHICLE CO-OCCURRENCE">JOINT CO-OCCURRENCE</option>
            <option value="VEHICLE-LINKED PATTERN">VEHICLE-LINKED PATTERN</option>
            <option value="INSUFFICIENT EVIDENCE FOR ATTRIBUTION">INSUFFICIENT EVIDENCE</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="rank">Sort by Fleet Rank</option>
              <option value="signal">Sort by Hybrid Signal</option>
              <option value="persistence">Sort by Persistence Score</option>
              <option value="speed_std">Sort by Speed Instability</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clean Compact Drivers Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4">Signal</th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-4">Attribution</th>
                <th className="py-3 px-4">Why Flagged</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(d => (
                <tr key={d.Driver_ID} className="hover:bg-slate-850/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">#{d.fleet_rank}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-100">{d.Driver_ID}</span>
                    <span className="block text-xs text-slate-400">{d.Driver_Name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{d.hybrid_signal.toFixed(1)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                      d.driver_evidence_strength === 'HIGH' ? 'bg-rose-950 text-rose-300 border-rose-800/60' :
                      d.driver_evidence_strength === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border-amber-800/60' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {d.driver_evidence_strength}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-300">{d.driver_attribution}</td>
                  <td className="py-3 px-4 text-xs text-slate-300 max-w-xs truncate">{d.primary_reason}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                      d.recommended_action === 'Focused Coaching Review' ? 'bg-rose-950 text-rose-300 border-rose-800/50' :
                      d.recommended_action === 'Behavioral Coaching Review' ? 'bg-amber-950 text-amber-300 border-amber-800/50' :
                      d.recommended_action === 'Routine Performance Monitoring' ? 'bg-cyan-950 text-cyan-300 border-cyan-800/50' :
                      'bg-slate-950 text-slate-400 border-slate-800'
                    }`}>
                      {d.recommended_action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectDriver(d.Driver_ID)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1"
                    >
                      <span>Deep Dive</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
