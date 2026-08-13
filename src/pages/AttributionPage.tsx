import React from 'react';
import { GitMerge, HelpCircle, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Info, ArrowDown } from 'lucide-react';
import { getAttributionTrips } from '../data/dataLoader';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface AttributionPageProps {
  onSelectDriver: (id: string) => void;
  onSelectVehicle: (id: string) => void;
}

export const AttributionPage: React.FC<AttributionPageProps> = ({ onSelectDriver, onSelectVehicle }) => {
  const attributions = getAttributionTrips();

  const driverLinkedCount = attributions.filter(a => a.Attribution_Category === 'DRIVER-LINKED PATTERN').length;
  const vehicleLinkedCount = attributions.filter(a => a.Attribution_Category === 'VEHICLE-LINKED PATTERN').length;
  const jointCount = attributions.filter(a => a.Attribution_Category === 'JOINT DRIVER-VEHICLE CO-OCCURRENCE').length;
  const insufficientCount = attributions.filter(a => a.Attribution_Category === 'INSUFFICIENT EVIDENCE FOR ATTRIBUTION').length;

  const pieData = [
    { name: 'Insufficient Evidence (Isolated)', value: insufficientCount, color: '#64748b', pct: '72.7%' },
    { name: 'Vehicle-Linked Pattern', value: vehicleLinkedCount, color: '#f59e0b', pct: '22.1%' },
    { name: 'Driver-Linked Pattern', value: driverLinkedCount, color: '#06b6d4', pct: '3.9%' },
    { name: 'Joint Co-Occurrence', value: jointCount, color: '#10b981', pct: '1.3%' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
        <div className="flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-bold text-slate-100">ANOMALY ATTRIBUTION</h1>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Where does an unusual pattern appear to originate? The system evaluates cross-assignment telemetry across 77 candidate anomalous trips (top 10% rate tail).
        </p>
      </div>

      {/* VISUAL DIAGRAM BEFORE CHARTS: DRIVER vs VEHICLE RECURRENCE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">How Attribution Works</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* DRIVER LINKED DIAGRAM */}
          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-900/50 space-y-3">
            <span className="font-bold text-cyan-400 block text-sm">DRIVER-LINKED PATTERN</span>
            <div className="flex items-center justify-around text-center py-2 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-100">Same Driver</span>
              <ArrowDown className="w-4 h-4 text-cyan-400" />
              <div className="text-[11px] text-slate-300">
                <span className="block font-semibold text-cyan-300">Vehicle A</span>
                <span className="block font-semibold text-cyan-300">Vehicle B</span>
                <span className="block font-semibold text-cyan-300">Vehicle C</span>
              </div>
            </div>
            <p className="text-slate-400 text-[11px]">
              Same driver exhibits elevated rates across multiple distinct vehicles. Consistent with handling style.
            </p>
          </div>

          {/* VEHICLE LINKED DIAGRAM */}
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/50 space-y-3">
            <span className="font-bold text-amber-400 block text-sm">VEHICLE-LINKED PATTERN</span>
            <div className="flex items-center justify-around text-center py-2 bg-slate-900/80 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-300">
                <span className="block font-semibold text-amber-300">Driver A</span>
                <span className="block font-semibold text-amber-300">Driver B</span>
                <span className="block font-semibold text-amber-300">Driver C</span>
              </div>
              <ArrowDown className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-100">Same Vehicle</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Same vehicle exhibits elevated vibration across multiple distinct drivers. Candidate for mechanical inspection.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-cyan-900/50 p-4 rounded-2xl space-y-1">
          <div className="text-xs text-cyan-400 font-semibold uppercase">Driver-Linked</div>
          <div className="text-3xl font-bold font-mono text-cyan-300">{driverLinkedCount} Trips</div>
          <p className="text-[11px] text-slate-400">3.9% of candidate anomalies</p>
        </div>
        <div className="bg-slate-900 border border-amber-900/50 p-4 rounded-2xl space-y-1">
          <div className="text-xs text-amber-400 font-semibold uppercase">Vehicle-Linked</div>
          <div className="text-3xl font-bold font-mono text-amber-300">{vehicleLinkedCount} Trips</div>
          <p className="text-[11px] text-slate-400">22.1% of candidate anomalies</p>
        </div>
        <div className="bg-slate-900 border border-emerald-900/50 p-4 rounded-2xl space-y-1">
          <div className="text-xs text-emerald-400 font-semibold uppercase">Joint Co-Occurrence</div>
          <div className="text-3xl font-bold font-mono text-emerald-300">{jointCount} Trips</div>
          <p className="text-[11px] text-slate-400">1.3% of candidate anomalies</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-xs text-slate-400 font-semibold uppercase">Insufficient Evidence</div>
          <div className="text-3xl font-bold font-mono text-slate-300">{insufficientCount} Trips</div>
          <p className="text-[11px] text-slate-500">72.7% isolated single-trip spikes</p>
        </div>
      </div>

      {/* Chart & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">Attribution Share Breakdown</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4}>
                  {pieData.map((entry, index) => (
                    <Cell key={`attribution-pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Attribution Uncertainty Rationale</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Attribution requires repeated cross-assignment evidence. Isolated single-trip G-force spikes are intentionally left unattributed (56 trips, 72.7%) to prevent ungrounded claims.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
            <span className="font-bold text-cyan-400 uppercase tracking-wider block">Analytical Rule</span>
            <p className="text-slate-400 leading-relaxed">
              If an anomaly does not recur across multiple distinct assignments, the system marks evidence as INSUFFICIENT FOR ATTRIBUTION.
            </p>
          </div>
        </div>
      </div>

      {/* 77 Candidate Trips Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-bold text-slate-100">77 Candidate Anomalous Trips Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Trip ID</th>
                <th className="py-2.5 px-3">Driver</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Attribution Category</th>
                <th className="py-2.5 px-3">Evidence Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attributions.slice(0, 15).map(a => (
                <tr key={a.Trip_ID} className="hover:bg-slate-850/60 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-200">{a.Trip_ID}</td>
                  <td className="py-2.5 px-3">
                    <button onClick={() => onSelectDriver(a.Driver_ID)} className="font-mono text-cyan-400 hover:underline font-bold">
                      {a.Driver_ID}
                    </button>
                  </td>
                  <td className="py-2.5 px-3">
                    <button onClick={() => onSelectVehicle(a.Vehicle_ID)} className="font-mono text-amber-400 hover:underline font-bold">
                      {a.Vehicle_ID}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-xs font-semibold">
                    <span className={`px-2.5 py-0.5 rounded ${
                      a.Attribution_Category === 'VEHICLE-LINKED PATTERN' ? 'bg-amber-950 text-amber-300 border border-amber-800/50' :
                      a.Attribution_Category === 'DRIVER-LINKED PATTERN' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50' :
                      a.Attribution_Category === 'JOINT DRIVER-VEHICLE CO-OCCURRENCE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' :
                      'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}>
                      {a.Attribution_Category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-400">{a.Evidence_Summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
