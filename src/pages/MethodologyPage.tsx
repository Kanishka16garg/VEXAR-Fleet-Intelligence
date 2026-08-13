import React, { useState } from 'react';
import { FileText, Layers, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, HelpCircle, Activity, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { getStabilityReport } from '../data/dataLoader';

export const MethodologyPage: React.FC = () => {
  const stabilityReport = getStabilityReport();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const weightingTable = [
    { scheme: '100/0 (Pure Interpretable Baseline)', interp: '1.00', iso: '0.00', driverCorr: '1.0000', vehCorr: '1.0000', note: 'Baseline reference model' },
    { scheme: '80/20 (Heavy Interpretable)', interp: '0.80', iso: '0.20', driverCorr: '0.9842', vehCorr: '0.9810', note: 'High stability; minor non-linear adjustment' },
    { scheme: '70/30 (SELECTED PRODUCTION CANDIDATE)', interp: '0.70', iso: '0.30', driverCorr: '0.9585', vehCorr: '0.9520', note: 'Selected candidate hybrid architecture' },
    { scheme: '60/40 (Balanced Anomaly)', interp: '0.60', iso: '0.40', driverCorr: '0.9120', vehCorr: '0.9045', note: 'Reduces linear explainability' }
  ];

  const sections = [
    {
      title: '1. What problem are we solving?',
      content: 'Fleet managers struggle to separate raw noisy telemetry spikes from persistent operational patterns across drivers and vehicles. VEXAR Fleet Intelligence translates raw IMU & GPS telemetry into explainable, evidence-backed operational signals.'
    },
    {
      title: '2. What data do we have?',
      content: 'A 7-day observation period (2026-07-31 to 2026-08-06) covering 30 drivers, 30 vehicles, 450 trips, and 12,987 1-minute telemetry records with 3-axis accelerometer, gyroscope, speed, and location.'
    },
    {
      title: '3. What can the data tell us?',
      content: 'The data reveals fleet-relative percentile rankings, behavioral variability (speed std, upper tail P95), rotational rate, vibration deviation, exposure-normalized event rates (events/hr), and temporal persistence.'
    },
    {
      title: '4. What can it NOT tell us?',
      content: 'The dataset contains ZERO ground-truth labels for accidents, safe/unsafe driving, or mechanical failures. Therefore, it CANNOT provide classification accuracy, precision, recall, F1-scores, ROC-AUC, or failure probabilities.'
    },
    {
      title: '5. How are features created?',
      content: 'Features are exposure-normalized (events per driving hour and per 100 km) to prevent longer trips from artificially skewing anomaly counts. Dynamic accelerometer deviation is calculated relative to nominal gravity (1.0086g).'
    },
    {
      title: '6. How is the driver signal calculated?',
      content: 'Composed of 6 fleet-relative percentiles: Speed Instability (std), Speed Tail (P95), Accel Deviation, Rotational Rate, Exposure Event Rate, and Temporal Persistence (active days showing top 25% metrics).'
    },
    {
      title: '7. How is the vehicle inspection signal calculated?',
      content: 'Composed of 5 percentiles: Accel Vibration Deviation (mean), Extreme Vibration Rate (per hr), Rotational Rate, Maintenance Context (age/odometer/service), and Cross-Driver Persistence. Sensor evidence is weighted 80% primary, Maintenance context 20%.'
    },
    {
      title: '8. Why Isolation Forest?',
      content: 'Isolation Forest provides a secondary unsupervised outlier score (30% weight) to capture multi-dimensional feature interactions that may not be obvious from individual linear percentile metrics alone.'
    },
    {
      title: '9. How do we determine evidence?',
      content: 'Evidence strength is categorized into LOW (limited repeated evidence), MEDIUM (some repeated evidence), and HIGH (repeated evidence across multiple distinct trips or assignments).'
    },
    {
      title: '10. How does attribution work?',
      content: 'If an anomaly recurs for a driver across multiple distinct vehicles, it is DRIVER-LINKED. If it recurs on a vehicle across multiple drivers, it is VEHICLE-LINKED. If both, JOINT. If isolated, INSUFFICIENT EVIDENCE FOR ATTRIBUTION (56 trips).'
    },
    {
      title: '11. How are recommendations generated?',
      content: 'Operational recommendations map signal levels, evidence strength, and attribution. Driver actions: Focused Coaching Review, Behavioral Coaching Review, Routine Monitoring. Vehicle actions: Priority Mechanical / Suspension Inspection, Routine Service, Fleet Monitoring.'
    },
    {
      title: '12. What are the limitations?',
      content: '7-day observation is short; 1-minute telemetry averages sub-second transient shocks; absence of accident/failure labels requires relative-risk framing rather than probabilistic predictions.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-bold text-slate-100">Methodology & System Architecture</h1>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Transparent, reproducible documentation of the end-to-end telemetry pipeline, baseline percentiles, hybrid weighting selection, and non-causal operational framing rules.
        </p>
      </div>

      {/* READ THIS FIRST BANNER */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 rounded-3xl p-6 space-y-2 shadow-xl">
        <div className="flex items-center gap-2.5 text-amber-400 font-extrabold text-sm uppercase tracking-wider">
          <Info className="w-5 h-5" />
          <span>READ THIS FIRST</span>
        </div>
        <p className="text-sm font-semibold text-slate-100 leading-relaxed">
          "This system does not predict accidents or mechanical failures. Instead, it identifies unusual patterns relative to this fleet and provides evidence-backed operational signals. A high score means the observed behaviour is unusual relative to the other entities in this dataset — not that an accident or failure will occur."
        </p>
      </div>

      {/* 12 EDUCATIONAL STRUCTURED ACCORDIONS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
        <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider mb-2">12-Step Educational Methodology</h2>

        <div className="space-y-2">
          {sections.map((sec, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden transition-all">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-slate-200 hover:text-cyan-400 transition-colors"
                >
                  <span>{sec.title}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-slate-300 border-t border-slate-800/80 leading-relaxed bg-slate-900/50">
                    {sec.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* HYBRID WEIGHTING EVALUATION TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Hybrid Score Weighting Evaluation</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluated alternative candidate weighting schemes against pure interpretable baseline (100/0) using Spearman rank correlation.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Weighting Scheme</th>
                <th className="py-2.5 px-3">Interpretable Wt</th>
                <th className="py-2.5 px-3">Isolation Wt</th>
                <th className="py-2.5 px-3">Driver Rank Corr</th>
                <th className="py-2.5 px-3">Vehicle Rank Corr</th>
                <th className="py-2.5 px-3">Selection Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {weightingTable.map((w, idx) => (
                <tr key={idx} className={w.scheme.includes('SELECTED') ? 'bg-cyan-950/40 font-bold border-l-4 border-cyan-500' : ''}>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{w.scheme}</td>
                  <td className="py-2.5 px-3 font-mono">{w.interp}</td>
                  <td className="py-2.5 px-3 font-mono">{w.iso}</td>
                  <td className="py-2.5 px-3 font-mono text-cyan-400">{w.driverCorr}</td>
                  <td className="py-2.5 px-3 font-mono text-amber-400">{w.vehCorr}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-400">{w.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODEL STABILITY AUDIT RESULTS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Model Stability & Sensitivity Audit (100 Bootstrap Iterations)</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Spearman rank correlation stability under contamination hyperparameter changes (0.05, 0.10, 0.15) and bootstrap sub-sampling.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Audit Metric</th>
                <th className="py-2.5 px-3">Spearman Rank Correlation</th>
                <th className="py-2.5 px-3">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stabilityReport.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-850/60">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{r.Audit_Metric}</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">{r.Value?.toFixed(4) || '0.0000'}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-400">{r.Interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
