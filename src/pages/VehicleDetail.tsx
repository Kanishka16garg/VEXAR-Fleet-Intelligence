import React from 'react';
import { ArrowLeft, Bike, HelpCircle, Wrench, Users, ShieldAlert, Calendar, Info, Activity } from 'lucide-react';
import { getVehicleById, getTripFeatures, getDrivers } from '../data/dataLoader';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface VehicleDetailProps {
  vehicleId: string;
  onBack: () => void;
  onSelectDriver: (id: string) => void;
}

export const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicleId, onBack, onSelectDriver }) => {
  const vehicle = getVehicleById(vehicleId);
  const trips = getTripFeatures().filter(t => t.Vehicle_ID === vehicleId);

  if (!vehicle) {
    return (
      <div className="p-8 text-center text-slate-400">
        Vehicle "{vehicleId}" not found.
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg">Go Back</button>
      </div>
    );
  }

  // Unique drivers list
  const uniqueDriverIds = Array.from(new Set(trips.map(t => t.Driver_ID)));
  const driversList = getDrivers().filter(d => uniqueDriverIds.includes(d.Driver_ID));

  // Component breakdown data
  const sensorData = [
    { name: 'Accel Vibration Dev', pct: vehicle.comp_accel_vibration_pct ?? 50, val: `${vehicle.accel_grav_dev_mean.toFixed(4)} g` },
    { name: 'Extreme Vibration Rate', pct: vehicle.comp_accel_extreme_rate_pct ?? 50, val: `${vehicle.accel_extremes_per_hour.toFixed(2)} extremes/hr` },
    { name: 'Rotational Rate', pct: vehicle.comp_gyro_rotational_pct ?? 50, val: `${vehicle.gyro_mag_p95_mean.toFixed(2)} dps` },
    { name: 'Cross-Driver Recurrence', pct: vehicle.comp_cross_driver_pct ?? 50, val: `${vehicle.unique_drivers_count} distinct drivers` }
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
          <span>Back to Vehicles List</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Vehicle ID: <strong>{vehicle.Vehicle_ID}</strong></span>
          <span className="text-xs font-mono font-bold bg-amber-950 text-amber-400 px-2.5 py-1 rounded border border-amber-800/50">
            Fleet Rank #{vehicle.fleet_rank}
          </span>
        </div>
      </div>

      {/* Vehicle Title Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-amber-950 text-amber-400 p-3 rounded-2xl border border-amber-800/50">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100">{vehicle.Make} {vehicle.Model} ({vehicle.Vehicle_ID})</h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span>Type: {vehicle.Vehicle_Type}</span>
                  <span>•</span>
                  <span>Age: {vehicle.vehicle_age_years} yrs</span>
                  <span>•</span>
                  <span>Odometer: {vehicle.Odometer_KM_Start_of_Week.toLocaleString()} km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scores & Action Pill */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">Inspection Signal</div>
              <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">{vehicle.hybrid_signal.toFixed(1)}</div>
            </div>
            <div className="text-center border-x border-slate-800 px-4">
              <div className="text-xs text-slate-400 font-medium">Evidence Strength</div>
              <div className="mt-1">
                <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                  vehicle.vehicle_evidence_strength === 'HIGH' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                  vehicle.vehicle_evidence_strength === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {vehicle.vehicle_evidence_strength}
                </span>
              </div>
            </div>
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 font-medium">Recommended Action</div>
              <div className="text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-800/60 px-3 py-1 rounded-lg mt-1">
                {vehicle.recommended_action}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WHY THIS VEHICLE IS FLAGGED */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-800/50 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-950 text-amber-400 p-2 rounded-xl border border-amber-800/60">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">WHY THIS VEHICLE IS FLAGGED</h3>
            <p className="text-xs text-slate-400">Data-driven operational justification generated reproducibly from computed fleet percentiles.</p>
          </div>
        </div>

        <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2">
          <p className="text-sm font-semibold text-slate-100">{vehicle.primary_reason}</p>
          <p className="text-xs text-slate-400">{vehicle.secondary_reason}</p>
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Non-Causal Operational Interpretation</div>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "{vehicle.operational_explanation}"
            </p>
          </div>
        </div>
      </div>

      {/* VISUALLY SEPARATED SECTIONS: OBSERVED SENSOR SIGNALS vs MAINTENANCE CONTEXT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION A: OBSERVED SENSOR SIGNALS */}
        <div className="bg-slate-900 border border-amber-900/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Activity className="w-4 h-4" />
            <span>OBSERVED SENSOR SIGNALS (80% Weight)</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sensorData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#9467bd" fontSize={11} width={140} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(val: any, name: any, props: any) => [`${val.toFixed(1)}th Percentile (${props.payload.val})`, 'Score']}
                />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {sensorData.map((entry, index) => (
                    <Cell key={`sensor-bar-${index}`} fill={entry.pct >= 75 ? '#e11d48' : entry.pct >= 50 ? '#d97706' : '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION B: MAINTENANCE CONTEXT (SEPARATED VISUALLY) */}
        <div className="bg-slate-900 border border-cyan-900/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Wrench className="w-4 h-4" />
              <span>MAINTENANCE CONTEXT (Contextual Evidence)</span>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <div>
                <div className="text-[11px] text-slate-400">Vehicle Age</div>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">{vehicle.vehicle_age_years} yrs</div>
              </div>
              <div className="border-x border-slate-800 px-2">
                <div className="text-[11px] text-slate-400">Odometer</div>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">{vehicle.Odometer_KM_Start_of_Week.toLocaleString()} km</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Days Since Service</div>
                <div className={`text-xl font-bold font-mono mt-1 ${vehicle.days_since_last_service > 180 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {vehicle.days_since_last_service}d
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-950 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-cyan-400 block uppercase">ANALYTICAL DIRECTIVE</span>
            <p className="text-slate-400 leading-relaxed">
              Maintenance information provides operational context but is <strong>not treated as proof of mechanical deterioration</strong>. Sensor evidence remains central.
            </p>
          </div>
        </div>
      </div>

      {/* DRIVERS WHO OPERATED THIS VEHICLE & ATTRIBUTION EVIDENCE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Drivers Who Operated This Vehicle ({driversList.length})</h3>
            <p className="text-xs text-slate-400">Cross-driver operational assignments during 7-day window</p>
          </div>
          <span className="text-xs font-mono text-amber-400 bg-amber-950 px-2.5 py-1 rounded border border-amber-800">
            Attribution: {vehicle.vehicle_attribution}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {driversList.map(d => (
            <div key={d.Driver_ID} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">{d.Driver_ID}</span>
                  <span className="text-[11px] text-slate-400">{d.Driver_Name}</span>
                </div>
              </div>
              <button
                onClick={() => onSelectDriver(d.Driver_ID)}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                Inspect
              </button>
            </div>
          ))}
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
          <span className="font-bold text-amber-400 uppercase tracking-wider block">Cross-Driver Recurrence Evidence</span>
          <p className="text-slate-400 leading-relaxed">
            {driversList.length > 1
              ? `Vehicle ${vehicle.Vehicle_ID} was operated by ${driversList.length} distinct drivers. When elevated sensor vibration recurs across multiple drivers, it strengthens evidence that the pattern is more consistent with a VEHICLE-LINKED signal.`
              : `Vehicle ${vehicle.Vehicle_ID} was operated by 1 driver exclusively during the 7-day observation window.`}
          </p>
        </div>
      </div>
    </div>
  );
};
