import React from 'react';
import { ArrowLeft, Users, ShieldAlert, Award, Calendar, Bike, Activity, HelpCircle } from 'lucide-react';
import { getDriverById, getTripFeatures } from '../data/dataLoader';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface DriverDetailProps {
  driverId: string;
  onBack: () => void;
  onSelectVehicle: (id: string) => void;
}

export const DriverDetail: React.FC<DriverDetailProps> = ({ driverId, onBack, onSelectVehicle }) => {
  const driver = getDriverById(driverId);
  const trips = getTripFeatures().filter(t => t.Driver_ID === driverId);

  if (!driver) {
    return (
      <div className="p-8 text-center text-slate-400">
        Driver "{driverId}" not found.
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg">Go Back</button>
      </div>
    );
  }

  // Multi-vehicle list
  const uniqueVehicles = Array.from(new Set(trips.map(t => t.Vehicle_ID)));

  // Component breakdown data
  const componentsData = [
    { name: 'Speed Instability', pct: driver.comp_speed_instability_pct ?? 50, val: `${driver.speed_std_mean.toFixed(2)} km/h std` },
    { name: 'Speed Tail (P95)', pct: driver.comp_speed_tail_pct ?? 50, val: `${driver.speed_p95_mean.toFixed(1)} km/h` },
    { name: 'Accel Deviation', pct: driver.comp_accel_signal_pct ?? 50, val: `${driver.accel_grav_dev_mean.toFixed(4)} g` },
    { name: 'Rotational Rate', pct: driver.comp_gyro_signal_pct ?? 50, val: `${driver.gyro_mag_p95_mean.toFixed(2)} dps` },
    { name: 'Exposure Rates', pct: driver.comp_exposure_event_pct ?? 50, val: `${driver.accel_extremes_per_hour.toFixed(2)} events/hr` },
    { name: 'Temporal Persistence', pct: driver.comp_persistence_pct ?? 50, val: `${(driver.elevated_day_ratio * 100).toFixed(0)}% days` }
  ];

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Drivers List</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Driver ID: <strong>{driver.Driver_ID}</strong></span>
          <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-400 px-2.5 py-1 rounded border border-cyan-800/50">
            Fleet Rank #{driver.fleet_rank}
          </span>
        </div>
      </div>

      {/* Driver Title Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-cyan-950 text-cyan-400 p-3 rounded-2xl border border-cyan-800/50">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100">{driver.Driver_Name}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span>Trips: {driver.total_trips}</span>
                  <span>•</span>
                  <span>Distance: {driver.total_distance_km.toFixed(1)} km</span>
                  <span>•</span>
                  <span>Driving Hours: {driver.driving_hours.toFixed(1)} hrs</span>
                </div>
              </div>
            </div>
          </div>


          {/* Scores & Recommendation Pill */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">Hybrid Signal</div>
              <div className="text-2xl font-black text-cyan-400 font-mono mt-0.5">{driver.hybrid_signal.toFixed(1)}</div>
            </div>
            <div className="text-center border-x border-slate-800 px-4">
              <div className="text-xs text-slate-400 font-medium">Evidence Strength</div>
              <div className="mt-1">
                <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                  driver.driver_evidence_strength === 'HIGH' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                  driver.driver_evidence_strength === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {driver.driver_evidence_strength}
                </span>
              </div>
            </div>
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">Recommended Action</div>
              <div className="text-xs font-bold text-rose-300 bg-rose-950/70 border border-rose-800/60 px-3 py-1 rounded-lg mt-1">
                {driver.recommended_action}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROMINENT EXPLAINABILITY CARD: WHY THIS SIGNAL? */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-800/50 rounded-2xl p-6 space-y-4 relative shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="bg-cyan-950 text-cyan-400 p-2 rounded-xl border border-cyan-800/60">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">WHY THIS SIGNAL? (Deterministic Explainability)</h3>
            <p className="text-xs text-slate-400">Data-driven operational justification generated reproducibly from computed fleet percentiles.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Primary Behavioral Signal</div>
            <p className="text-sm font-semibold text-slate-100">{driver.primary_reason}</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Secondary Behavioral Signal</div>
            <p className="text-sm font-semibold text-slate-100">{driver.secondary_reason}</p>
          </div>
        </div>

        <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evidence & Persistence Summary</span>
            <span className="text-xs font-mono text-cyan-300">Attribution: <strong>{driver.driver_attribution}</strong></span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {driver.evidence_summary}
          </p>
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Operational Interpretation</div>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "{driver.operational_explanation}"
            </p>
          </div>
        </div>
      </div>

      {/* Component Breakdown & Multi-Vehicle Usage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component Percentile Breakdown Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">6 Component Percentile Breakdown</h3>
              <p className="text-xs text-slate-400">Fleet-relative percentile ranks (0 - 100) per component</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
              Interpretable Score: {driver.interpretable_driver_score.toFixed(1)}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={componentsData} layout="vertical" margin={{ left: 40, right: 30 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#9467bd" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(val: any, name: any, props: any) => [`${val.toFixed(1)}th Percentile (${props.payload.val})`, 'Score']}
                />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {componentsData.map((entry, index) => (
                    <Cell key={`comp-bar-${index}`} fill={entry.pct >= 75 ? '#e11d48' : entry.pct >= 50 ? '#0284c7' : '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Vehicle Usage & Persistence Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200">Vehicles Used (7 Days)</h4>
              <span className="text-xs text-cyan-400 font-mono">{uniqueVehicles.length} Vehicles</span>
            </div>

            <div className="space-y-2">
              {uniqueVehicles.map(vId => (
                <div key={vId} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">{vId}</span>
                  </div>
                  <button
                    onClick={() => onSelectVehicle(vId)}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    View Vehicle
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-xs font-semibold text-slate-300">Multi-Vehicle Persistence Note</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {uniqueVehicles.length > 1
                ? `Driver ${driver.Driver_ID} operated ${uniqueVehicles.length} distinct vehicles. Behavioral persistence across multiple vehicles strengthens evidence for a DRIVER-LINKED pattern.`
                : `Driver ${driver.Driver_ID} operated 1 vehicle exclusively during the 7-day observation period.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
