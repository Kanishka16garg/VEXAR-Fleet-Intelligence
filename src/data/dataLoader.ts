import fleetDataRaw from './fleetData.json';

export interface DriverRecord {
  Driver_ID: string;
  Driver_Name: string;
  total_trips: number;
  total_distance_km: number;
  driving_hours: number;
  speed_p95_mean: number;
  speed_std_mean: number;
  accel_grav_dev_mean: number;
  accel_extremes_per_hour: number;
  gyro_mag_p95_mean: number;
  gyro_extremes_per_hour: number;
  interpretable_driver_score: number;
  isolation_score: number;
  hybrid_signal: number;
  percentile_rank: number;
  fleet_rank: number;
  driver_evidence_strength: string;
  persistence_score: number;
  elevated_day_ratio: number;
  driver_attribution: string;
  primary_reason: string;
  secondary_reason: string;
  evidence_summary: string;
  operational_explanation: string;
  recommended_action: string;
  comp_speed_instability_pct?: number;
  comp_speed_tail_pct?: number;
  comp_accel_signal_pct?: number;
  comp_gyro_signal_pct?: number;
  comp_exposure_event_pct?: number;
  comp_persistence_pct?: number;
  License_Experience_Years?: number;
  Home_Hub?: string;
  Date_Joined_Fleet?: string;
}

export interface VehicleRecord {
  Vehicle_ID: string;
  Vehicle_Type: string;
  Make: string;
  Model: string;
  vehicle_age_years: number;
  Odometer_KM_Start_of_Week: number;
  Last_Service_Date: string;
  days_since_last_service: number;
  total_trips: number;
  total_distance_km: number;
  driving_hours: number;
  unique_drivers_count: number;
  accel_grav_dev_mean: number;
  accel_extremes_per_hour: number;
  gyro_mag_p95_mean: number;
  gyro_extremes_per_hour: number;
  interpretable_vehicle_score: number;
  isolation_score: number;
  hybrid_signal: number;
  percentile_rank: number;
  fleet_rank: number;
  vehicle_evidence_strength: string;
  persistence_score: number;
  elevated_day_ratio: number;
  vehicle_attribution: string;
  primary_reason: string;
  secondary_reason: string;
  maintenance_context_note: string;
  operational_explanation: string;
  recommended_action: string;
  comp_accel_vibration_pct?: number;
  comp_accel_extreme_rate_pct?: number;
  comp_gyro_rotational_pct?: number;
  comp_maintenance_context_pct?: number;
  comp_cross_driver_pct?: number;
}


export interface StabilityRecord {
  Audit_Metric: string;
  Value: number;
  Interpretation: string;
}

export interface AttributionTripRecord {
  Trip_ID: string;
  Driver_ID: string;
  Vehicle_ID: string;
  Attribution_Category: string;
  Evidence_Summary: string;
  Accel_Extremes_Per_Hour: number;
  Gyro_Extremes_Per_Hour: number;
}

export interface TripFeatureRecord {
  Trip_ID: string;
  Driver_ID: string;
  Vehicle_ID: string;
  Trip_Date: string;
  Duration_Min: number;
  Distance_KM: number;
  Avg_Speed_kmph: number;
  Max_Speed_kmph: number;
  accel_extremes_per_hour: number;
  gyro_extremes_per_hour: number;
  is_candidate_anomaly: number;
}

const fleetData = fleetDataRaw as Record<string, any[]>;

export function getDrivers(): DriverRecord[] {
  return (fleetData['driver_intelligence'] || []) as DriverRecord[];
}

export function getDriverById(id: string): DriverRecord | undefined {
  return getDrivers().find(d => d.Driver_ID === id);
}

export function getVehicles(): VehicleRecord[] {
  return (fleetData['vehicle_intelligence'] || []) as VehicleRecord[];
}

export function getVehicleById(id: string): VehicleRecord | undefined {
  return getVehicles().find(v => v.Vehicle_ID === id);
}

export function getStabilityReport(): StabilityRecord[] {
  return (fleetData['model_stability_report'] || []) as StabilityRecord[];
}

export function getAttributionTrips(): AttributionTripRecord[] {
  return (fleetData['anomaly_attribution'] || []) as AttributionTripRecord[];
}

export function getTripFeatures(): TripFeatureRecord[] {
  return (fleetData['trip_features'] || []) as TripFeatureRecord[];
}

export function getFleetOverviewStats() {
  const drivers = getDrivers();
  const vehicles = getVehicles();
  const trips = getTripFeatures();

  const totalDrivers = drivers.length;
  const totalVehicles = vehicles.length;
  const totalTrips = trips.length;

  const totalDistanceKm = trips.reduce((sum, t) => sum + (t.Distance_KM || 0), 0);
  const totalDurationHours = trips.reduce((sum, t) => sum + (t.Duration_Min || 0), 0) / 60.0;

  // Driver Action Counts
  const driverFocusedCoaching = drivers.filter(d => d.recommended_action === 'Focused Coaching Review').length;
  const driverBehavioralCoaching = drivers.filter(d => d.recommended_action === 'Behavioral Coaching Review').length;
  const driverRoutineMonitoring = drivers.filter(d => d.recommended_action === 'Routine Performance Monitoring').length;
  const driverStandardMonitoring = drivers.filter(d => d.recommended_action === 'Standard Monitoring / Low Evidence').length;

  // Vehicle Action Counts
  const vehiclePriorityInspection = vehicles.filter(v => v.recommended_action === 'Priority Mechanical / Suspension Inspection').length;
  const vehicleRoutineService = vehicles.filter(v => v.recommended_action === 'Routine Fleet Service Inspection').length;
  const vehicleFleetMonitoring = vehicles.filter(v => v.recommended_action === 'Routine Fleet Monitoring').length;
  const vehicleStandardMonitoring = vehicles.filter(v => v.recommended_action === 'Standard Monitoring / Insufficient Evidence').length;

  return {
    totalDrivers,
    totalVehicles,
    totalTrips,
    totalDistanceKm: round(totalDistanceKm, 2),
    totalDurationHours: round(totalDurationHours, 2),
    driverActionCounts: {
      focusedCoaching: driverFocusedCoaching,
      behavioralCoaching: driverBehavioralCoaching,
      routineMonitoring: driverRoutineMonitoring,
      standardMonitoring: driverStandardMonitoring
    },
    vehicleActionCounts: {
      priorityInspection: vehiclePriorityInspection,
      routineService: vehicleRoutineService,
      fleetMonitoring: vehicleFleetMonitoring,
      standardMonitoring: vehicleStandardMonitoring
    }
  };
}

function round(val: number, decimals: number): number {
  return Number(val.toFixed(decimals));
}
