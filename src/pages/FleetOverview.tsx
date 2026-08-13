import React from 'react';
import { Users, Bike, Route, Clock, Navigation, AlertTriangle, ShieldAlert, ArrowRight, ArrowUpRight, HelpCircle, Layers, Calendar, CheckCircle2, Info } from 'lucide-react';
import { getFleetOverviewStats, getDrivers, getVehicles, getAttributionTrips } from '../data/dataLoader';

interface FleetOverviewProps {
  onSelectEntity: (type: 'driver' | 'vehicle', id: string) => void;
  onNavigate: (tab: string) => void;
}

export const FleetOverview: React.FC<FleetOverviewProps> = ({ onSelectEntity, onNavigate }) => {
  const stats = getFleetOverviewStats();
  const topDriver = getDrivers()[0];
  const topVehicle = getVehicles()[0];
  const attributions = getAttributionTrips();

  const driverLinkedCount = attributions.filter(a => a.Attribution_Category === 'DRIVER-LINKED PATTERN').length;
  const vehicleLinkedCount = attributions.filter(a => a.Attribution_Category === 'VEHICLE-LINKED PATTERN').length;
  const jointCount = attributions.filter(a => a.Attribution_Category === 'JOINT DRIVER-VEHICLE CO-OCCURRENCE').length;
  const insufficientCount = attributions.filter(a => a.Attribution_Category === 'INSUFFICIENT EVIDENCE FOR ATTRIBUTION').length;

  return (
    <div className="space-y-8">
      {/* SECTION 1 — HERO / PRODUCT INTRO */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-cyan-950 text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full border border-cyan-800/60">
                Enterprise Analytics
              </span>
              <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800 text-xs text-slate-300 font-medium">
                <span>7-day fleet analysis</span>
                <span>•</span>
                <span>30 drivers</span>
                <span>•</span>
                <span>30 vehicles</span>
                <span>•</span>
                <span>450 trips</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
              Understand what is happening across your fleet.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              An explainable intelligence layer that analyzes driver behaviour, vehicle telemetry and operational patterns to surface signals worth investigating.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => onNavigate('methodology')}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 text-sm"
            >
              <span>HOW IT WORKS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2 — EXECUTIVE SUMMARY ("Fleet at a glance") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">Fleet at a glance</h2>
          <span className="text-xs text-slate-400 font-mono">Observation: 2026-07-31 to 2026-08-06</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center space-y-1">
            <div className="text-2xl font-black font-mono text-cyan-400">{stats.totalDrivers}</div>
            <div className="text-xs font-semibold text-slate-300">Drivers</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center space-y-1">
            <div className="text-2xl font-black font-mono text-amber-400">{stats.totalVehicles}</div>
            <div className="text-xs font-semibold text-slate-300">Vehicles</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center space-y-1">
            <div className="text-2xl font-black font-mono text-emerald-400">{stats.totalTrips}</div>
            <div className="text-xs font-semibold text-slate-300">Trips</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center space-y-1">
            <div className="text-2xl font-black font-mono text-purple-400">{stats.totalDurationHours}</div>
            <div className="text-xs font-semibold text-slate-300">Driving Hours</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center space-y-1">
            <div className="text-2xl font-black font-mono text-sky-400">{stats.totalDistanceKm}</div>
            <div className="text-xs font-semibold text-slate-300">KM Total</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center space-y-1">
            <div className="text-2xl font-black font-mono text-slate-200">7 Days</div>
            <div className="text-xs font-semibold text-slate-300">Observation Window</div>
          </div>
        </div>
      </div>

      {/* SECTION 3 — WHAT NEEDS ATTENTION? */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">What needs attention?</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Signals ranked by fleet-relative behaviour and strength of evidence.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DRIVER BEHAVIOUR PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-950 text-cyan-400 p-2.5 rounded-xl border border-cyan-800/60">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">DRIVER BEHAVIOUR</h3>
                    <p className="text-xs text-slate-400">Behavioral variability & coaching prioritization</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-900/50">
                  <div className="text-2xl font-bold text-rose-300 font-mono">{stats.driverActionCounts.focusedCoaching}</div>
                  <div className="text-xs font-semibold text-rose-400 mt-1">Focused Coaching</div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-900/50">
                  <div className="text-2xl font-bold text-amber-300 font-mono">{stats.driverActionCounts.behavioralCoaching}</div>
                  <div className="text-xs font-semibold text-amber-400 mt-1">Behavioural Coaching</div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-900/50">
                  <div className="text-2xl font-bold text-cyan-300 font-mono">{stats.driverActionCounts.routineMonitoring}</div>
                  <div className="text-xs font-semibold text-cyan-400 mt-1">Routine Monitoring</div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-2xl font-bold text-slate-300 font-mono">{stats.driverActionCounts.standardMonitoring}</div>
                  <div className="text-xs font-semibold text-slate-400 mt-1">Low Evidence</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('drivers')}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-cyan-800/60 text-cyan-400 font-bold py-3 rounded-xl transition-all text-xs tracking-wider uppercase"
            >
              <span>VIEW DRIVER INTELLIGENCE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* VEHICLE INSPECTION PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-950 text-amber-400 p-2.5 rounded-xl border border-amber-800/60">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">VEHICLE INSPECTION</h3>
                    <p className="text-xs text-slate-400">Sensor vibration & maintenance context prioritization</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-900/50">
                  <div className="text-2xl font-bold text-rose-300 font-mono">{stats.vehicleActionCounts.priorityInspection}</div>
                  <div className="text-xs font-semibold text-rose-400 mt-1">Priority Inspection</div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-900/50">
                  <div className="text-2xl font-bold text-amber-300 font-mono">{stats.vehicleActionCounts.routineService}</div>
                  <div className="text-xs font-semibold text-amber-400 mt-1">Routine Service</div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-900/50">
                  <div className="text-2xl font-bold text-cyan-300 font-mono">{stats.vehicleActionCounts.fleetMonitoring}</div>
                  <div className="text-xs font-semibold text-cyan-400 mt-1">Fleet Monitoring</div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-2xl font-bold text-slate-300 font-mono">{stats.vehicleActionCounts.standardMonitoring}</div>
                  <div className="text-xs font-semibold text-slate-400 mt-1">Insufficient Evidence</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('vehicles')}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-amber-800/60 text-amber-400 font-bold py-3 rounded-xl transition-all text-xs tracking-wider uppercase"
            >
              <span>VIEW VEHICLE INSPECTION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4 — TOP SIGNALS (DYNAMIC CARDS) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Top signals across the fleet</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Start with the strongest signals, then inspect the evidence behind each one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TOP DRIVER SIGNAL CARD */}
          {topDriver && (
            <div className="bg-slate-900 border border-cyan-900/60 rounded-2xl p-6 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">TOP DRIVER SIGNAL</span>
                <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-300 px-2.5 py-1 rounded border border-cyan-800">
                  Fleet Rank #1
                </span>
              </div>

              <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <div className="text-2xl font-extrabold text-slate-100">{topDriver.Driver_ID} — {topDriver.Driver_Name}</div>
                  <div className="text-xs text-cyan-300 font-semibold mt-1">{topDriver.driver_attribution}</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-cyan-400 font-mono">{topDriver.hybrid_signal.toFixed(1)}</div>
                  <span className="text-[10px] text-rose-300 font-bold bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                    {topDriver.driver_evidence_strength} EVIDENCE
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 font-semibold block">Primary Reason:</span>
                  <p className="text-slate-200 font-medium">{topDriver.primary_reason}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Recommended Action:</span>
                  <p className="text-rose-300 font-bold">{topDriver.recommended_action}</p>
                </div>
              </div>

              <button
                onClick={() => onSelectEntity('driver', topDriver.Driver_ID)}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl transition-colors text-xs"
              >
                <span>View Driver Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TOP VEHICLE SIGNAL CARD */}
          {topVehicle && (
            <div className="bg-slate-900 border border-amber-900/60 rounded-2xl p-6 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">TOP VEHICLE SIGNAL</span>
                <span className="text-xs font-mono font-bold bg-amber-950 text-amber-300 px-2.5 py-1 rounded border border-amber-800">
                  Fleet Rank #1
                </span>
              </div>

              <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <div className="text-2xl font-extrabold text-slate-100">{topVehicle.Vehicle_ID} — {topVehicle.Make} {topVehicle.Model}</div>
                  <div className="text-xs text-amber-300 font-semibold mt-1">{topVehicle.vehicle_attribution}</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-amber-400 font-mono">{topVehicle.hybrid_signal.toFixed(1)}</div>
                  <span className="text-[10px] text-rose-300 font-bold bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                    {topVehicle.vehicle_evidence_strength} EVIDENCE
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 font-semibold block">Primary Reason:</span>
                  <p className="text-slate-200 font-medium">{topVehicle.primary_reason}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Recommended Action:</span>
                  <p className="text-amber-300 font-bold">{topVehicle.recommended_action}</p>
                </div>
              </div>

              <button
                onClick={() => onSelectEntity('vehicle', topVehicle.Vehicle_ID)}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl transition-colors text-xs"
              >
                <span>View Vehicle Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5 — HOW THE INTELLIGENCE IS CREATED */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">How the intelligence is created</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              We combine transparent fleet-relative metrics with a secondary unsupervised anomaly model. Every signal is accompanied by evidence and an explanation.
            </p>
          </div>
          <button
            onClick={() => onNavigate('methodology')}
            className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-cyan-800/60 text-cyan-400 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shrink-0"
          >
            <span>EXPLORE METHODOLOGY</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Pipeline flowchart */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {[
            'Fleet Telemetry',
            'Data Validation',
            'Feature Engineering',
            'Fleet Percentiles',
            'Anomaly Model',
            'Evidence Strength',
            'Attribution',
            'Explanation',
            'Recommendation'
          ].map((step, idx) => (
            <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 block">Step {idx + 1}</span>
              <span className="text-xs font-semibold text-slate-200 block leading-tight">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6 — IMPORTANT UNCERTAINTY (TRUST & TRANSPARENCY DIFFERENTIATOR) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 text-slate-300 p-2.5 rounded-xl border border-slate-800">
            <Info className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              We don't force an explanation when the data doesn't support one.
            </h2>
            <p className="text-xs text-slate-400">Analytical transparency & uncertainty communication</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <div className="text-3xl font-black font-mono text-slate-200">77</div>
            <div className="text-xs font-bold text-slate-400 uppercase">Candidate Anomalous Trips</div>
            <p className="text-[11px] text-slate-500">Top 10% rate tail across fleet telemetry.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 md:col-span-2">
            <div className="text-3xl font-black font-mono text-cyan-400">56 Trips (72.7%)</div>
            <div className="text-xs font-bold text-slate-300 uppercase">Insufficient Evidence for Attribution</div>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              Some unusual trips cannot confidently be attributed to either the driver or vehicle from the available seven-day data. These isolated cases are intentionally left unattributed rather than forcing ungrounded assumptions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
