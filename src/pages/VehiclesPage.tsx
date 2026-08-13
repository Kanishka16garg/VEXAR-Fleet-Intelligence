import React, { useState } from 'react';
import { Bike, Filter, ArrowUpDown, Search, ArrowUpRight, Info } from 'lucide-react';
import { getVehicles, VehicleRecord } from '../data/dataLoader';

interface VehiclesPageProps {
  onSelectVehicle: (id: string) => void;
}

export const VehiclesPage: React.FC<VehiclesPageProps> = ({ onSelectVehicle }) => {
  const allVehicles = getVehicles();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [evidenceFilter, setEvidenceFilter] = useState('ALL');
  const [attributionFilter, setAttributionFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'rank' | 'signal' | 'service' | 'age'>('rank');

  // Filter logic
  let filtered = allVehicles.filter(v => {
    const matchSearch =
      v.Vehicle_ID.toLowerCase().includes(search.toLowerCase()) ||
      v.Make.toLowerCase().includes(search.toLowerCase()) ||
      v.Model.toLowerCase().includes(search.toLowerCase());

    const matchAction = actionFilter === 'ALL' || v.recommended_action === actionFilter;
    const matchEvidence = evidenceFilter === 'ALL' || v.vehicle_evidence_strength === evidenceFilter;
    const matchAttribution = attributionFilter === 'ALL' || v.vehicle_attribution === attributionFilter;
    const matchService =
      serviceFilter === 'ALL' ||
      (serviceFilter === 'OVER_180' && v.days_since_last_service > 180) ||
      (serviceFilter === 'UNDER_90' && v.days_since_last_service <= 90);

    return matchSearch && matchAction && matchEvidence && matchAttribution && matchService;
  });

  // Sort logic
  filtered.sort((a, b) => {
    if (sortBy === 'rank') return a.fleet_rank - b.fleet_rank;
    if (sortBy === 'signal') return b.hybrid_signal - a.hybrid_signal;
    if (sortBy === 'service') return b.days_since_last_service - a.days_since_last_service;
    if (sortBy === 'age') return b.vehicle_age_years - a.vehicle_age_years;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bike className="w-5 h-5 text-amber-400" />
              <h1 className="text-xl font-bold text-slate-100">VEHICLE INSPECTION INTELLIGENCE</h1>
            </div>
            <p className="text-xs text-slate-400">
              Surface vehicles whose telemetry contains unusual fleet-relative patterns.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-3 py-1.5 rounded-lg border border-amber-800/50 shrink-0">
            Showing {filtered.length} of 30 Vehicles
          </span>
        </div>

        {/* INFO BOX: INSPECTION SIGNAL DISCLAIMER */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">WHAT DOES THE SIGNAL MEAN?</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              This is an inspection signal indicating whether telemetry behaviour is unusual relative to comparable vehicles — not a mechanical failure prediction.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span>Filters & Sorting</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, Make, Model..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Inspection Actions</option>
            <option value="Priority Mechanical / Suspension Inspection">Priority Mechanical Inspection</option>
            <option value="Routine Fleet Service Inspection">Routine Fleet Service Inspection</option>
            <option value="Routine Fleet Monitoring">Routine Fleet Monitoring</option>
            <option value="Standard Monitoring / Insufficient Evidence">Standard Monitoring</option>
          </select>

          {/* Evidence Filter */}
          <select
            value={evidenceFilter}
            onChange={e => setEvidenceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Evidence Strengths</option>
            <option value="HIGH">HIGH Evidence</option>
            <option value="MEDIUM">MEDIUM Evidence</option>
            <option value="LOW">LOW Evidence</option>
          </select>

          {/* Service Recency Filter */}
          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Service Recencies</option>
            <option value="OVER_180">Service &gt; 180 Days Ago</option>
            <option value="UNDER_90">Service &le; 90 Days Ago</option>
          </select>

          {/* Attribution Filter */}
          <select
            value={attributionFilter}
            onChange={e => setAttributionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Attribution Categories</option>
            <option value="VEHICLE-LINKED PATTERN">VEHICLE-LINKED PATTERN</option>
            <option value="JOINT DRIVER-VEHICLE CO-OCCURRENCE">JOINT CO-OCCURRENCE</option>
            <option value="DRIVER-LINKED PATTERN">DRIVER-LINKED PATTERN</option>
            <option value="INSUFFICIENT EVIDENCE FOR ATTRIBUTION">INSUFFICIENT EVIDENCE</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="rank">Sort by Fleet Rank</option>
              <option value="signal">Sort by Inspection Signal</option>
              <option value="service">Sort by Days Since Service</option>
              <option value="age">Sort by Vehicle Age</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Inspection Signal</th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-4">Days Since Service</th>
                <th className="py-3 px-4">Attribution</th>
                <th className="py-3 px-4">Primary Signal</th>
                <th className="py-3 px-4">Recommendation</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(v => (
                <tr key={v.Vehicle_ID} className="hover:bg-slate-850/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">#{v.fleet_rank}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-100">{v.Vehicle_ID}</span>
                    <span className="block text-xs text-slate-400">{v.Make} {v.Model} ({v.vehicle_age_years} yrs)</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-400">{v.hybrid_signal.toFixed(1)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                      v.vehicle_evidence_strength === 'HIGH' ? 'bg-rose-950 text-rose-300 border-rose-800/60' :
                      v.vehicle_evidence_strength === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border-amber-800/60' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {v.vehicle_evidence_strength}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    <span className={v.days_since_last_service > 180 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {v.days_since_last_service}d ago
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-300">{v.vehicle_attribution}</td>
                  <td className="py-3 px-4 text-xs text-slate-300 max-w-xs truncate">{v.primary_reason}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                      v.recommended_action === 'Priority Mechanical / Suspension Inspection' ? 'bg-rose-950 text-rose-300 border-rose-800/50' :
                      v.recommended_action === 'Routine Fleet Service Inspection' ? 'bg-amber-950 text-amber-300 border-amber-800/50' :
                      v.recommended_action === 'Routine Fleet Monitoring' ? 'bg-cyan-950 text-cyan-300 border-cyan-800/50' :
                      'bg-slate-950 text-slate-400 border-slate-800'
                    }`}>
                      {v.recommended_action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectVehicle(v.Vehicle_ID)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1"
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
