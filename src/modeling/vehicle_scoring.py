"""
Module: vehicle_scoring.py
Description: Vehicle Health Intelligence & Inspection Signal Engine for Vexar Fleet Intelligence.
Computes 5 transparent, fleet-relative percentile components per vehicle:
  1. accel_vibration_dev (accel_grav_dev_mean percentile)
  2. accel_extreme_rate (accel_extremes_per_hour percentile)
  3. gyro_rotational_signal (gyro_mag_p95 percentile)
  4. maintenance_context_score (days_since_last_service & vehicle_age percentile)
  5. cross_driver_persistence (multi-driver recurring sensor anomaly percentile)
Differentiates OBSERVED SENSOR SIGNALS from CONTEXTUAL MAINTENANCE INFORMATION.
"""

import pandas as pd
import numpy as np
from scipy.stats import rankdata
from typing import Dict, Any


def _percentile_rank_series(series: pd.Series) -> pd.Series:
    """Computes empirical percentile rank (0.0 to 100.0) for a pandas Series."""
    if len(series) <= 1:
        return pd.Series(50.0, index=series.index)
    ranks = rankdata(series, method='average')
    pcts = (ranks - 1.0) / (len(series) - 1.0) * 100.0
    return pd.Series(pcts, index=series.index)


def compute_vehicle_intelligence(dataset: Any, trip_features: pd.DataFrame, attribution_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Computes vehicle health inspection signals and component metrics reproducibly.

    Parameters:
    -----------
    dataset : FleetDataset
        Loaded dataset container.
    trip_features : pd.DataFrame
        Processed trip-level feature table.
    attribution_df : pd.DataFrame, optional
        Driver-vehicle attribution table from Stage 2.

    Returns:
    --------
    pd.DataFrame
        Vehicle intelligence summary DataFrame with 30 rows.
    """
    vehicles = dataset.vehicles.copy()
    trips = dataset.trips.copy()

    obs_start_date = pd.to_datetime('2026-07-31')
    vehicles['days_since_last_service'] = (obs_start_date - pd.to_datetime(vehicles['Last_Service_Date'])).dt.days
    vehicles['vehicle_age_years'] = 2026 - vehicles['Manufacture_Year']

    trip_features['Trip_Date'] = pd.to_datetime(trip_features['Trip_Date'])
    
    # Define exploratory top 25% fleet threshold for "elevated" trip
    accel_p75 = trip_features['accel_extremes_per_hour'].quantile(0.75)
    gyro_p75 = trip_features['gyro_extremes_per_hour'].quantile(0.75)
    trip_features['is_elevated_trip'] = (trip_features['accel_extremes_per_hour'] > accel_p75) | (trip_features['gyro_extremes_per_hour'] > gyro_p75)

    # Aggregate trip metrics by Vehicle_ID
    veh_agg = trip_features.groupby('Vehicle_ID').agg(
        total_trips=('Trip_ID', 'count'),
        total_distance_km=('Distance_KM', 'sum'),
        total_duration_min=('Duration_Min', 'sum'),
        unique_drivers_count=('Driver_ID', lambda x: len(x.unique())),
        accel_grav_dev_mean=('accel_grav_dev_mean', 'mean'),
        accel_grav_dev_p95=('accel_grav_dev_p95', 'mean'),
        gyro_mag_p95_mean=('gyro_mag_p95', 'mean'),
        accel_extremes_per_hour=('accel_extremes_per_hour', 'mean'),
        gyro_extremes_per_hour=('gyro_extremes_per_hour', 'mean'),
        accel_extremes_per_100km=('accel_extremes_per_100km', 'mean'),
        gyro_extremes_per_100km=('gyro_extremes_per_100km', 'mean')
    ).reset_index()

    veh_agg['driving_hours'] = veh_agg['total_duration_min'] / 60.0

    # Calculate active days and elevated days per vehicle
    daily_veh = trip_features.groupby(['Vehicle_ID', 'Trip_Date']).agg(
        daily_elevated=('is_elevated_trip', lambda x: x.sum() > 0),
        distinct_drivers=('Driver_ID', lambda x: len(x.unique()))
    ).reset_index()

    persistence_df = daily_veh.groupby('Vehicle_ID').agg(
        active_days=('Trip_Date', 'count'),
        elevated_days=('daily_elevated', 'sum')
    ).reset_index()

    persistence_df['elevated_day_ratio'] = persistence_df['elevated_days'] / np.maximum(persistence_df['active_days'], 1.0)
    persistence_df['persistence_score'] = persistence_df['elevated_day_ratio'] * 100.0

    veh_df = veh_agg.merge(persistence_df[['Vehicle_ID', 'active_days', 'elevated_days', 'elevated_day_ratio', 'persistence_score']], on='Vehicle_ID', how='left')

    # Merge Vehicle Master Info
    veh_df = vehicles.merge(veh_df, on='Vehicle_ID', how='left')

    # Calculate Contextual Maintenance Composite Score
    service_pct = _percentile_rank_series(veh_df['days_since_last_service'])
    age_pct = _percentile_rank_series(veh_df['vehicle_age_years'])
    odo_pct = _percentile_rank_series(veh_df['Odometer_KM_Start_of_Week'])
    veh_df['comp_maintenance_context_pct'] = 0.50 * service_pct + 0.30 * age_pct + 0.20 * odo_pct

    # Multi-driver recurring anomaly count per vehicle
    veh_multi_drv_anoms = {}
    if attribution_df is not None and not attribution_df.empty:
        for v_id, group in attribution_df.groupby('Vehicle_ID'):
            veh_multi_drv_anoms[v_id] = (group['Attribution_Category'] == 'VEHICLE-LINKED PATTERN').sum()

    veh_df['multi_driver_anomaly_count'] = veh_df['Vehicle_ID'].map(lambda v: veh_multi_drv_anoms.get(v, 0))

    # 2. Fleet-Relative Percentile Ranks for 5 Components
    veh_df['comp_accel_vibration_pct'] = _percentile_rank_series(veh_df['accel_grav_dev_mean'])
    veh_df['comp_accel_extreme_rate_pct'] = _percentile_rank_series(veh_df['accel_extremes_per_hour'])
    veh_df['comp_gyro_rotational_pct'] = _percentile_rank_series(veh_df['gyro_mag_p95_mean'])
    veh_df['comp_cross_driver_pct'] = _percentile_rank_series(veh_df['multi_driver_anomaly_count'] * 10.0 + veh_df['unique_drivers_count'])

    # 3. Transparent Weighted Score Calculation
    # Weights: 0.25 accel_vibration, 0.25 accel_extreme_rate, 0.15 gyro, 0.20 maintenance_context, 0.15 cross_driver_persistence
    # Note: Sensor components = 80%, Contextual maintenance = 20%
    veh_df['interpretable_vehicle_score'] = (
        0.25 * veh_df['comp_accel_vibration_pct'] +
        0.25 * veh_df['comp_accel_extreme_rate_pct'] +
        0.15 * veh_df['comp_gyro_rotational_pct'] +
        0.20 * veh_df['comp_maintenance_context_pct'] +
        0.15 * veh_df['comp_cross_driver_pct']
    )

    # 4. Evidence Strength & Attribution Mapping
    def _determine_vehicle_evidence(row):
        v_id = row['Vehicle_ID']
        has_multi_drv_pattern = veh_multi_drv_anoms.get(v_id, 0) > 0
        ratio = row['elevated_day_ratio']

        if (has_multi_drv_pattern and row['unique_drivers_count'] > 1) or ratio >= 0.60:
            return "HIGH"
        elif ratio >= 0.35 or row['unique_drivers_count'] > 1:
            return "MEDIUM"
        else:
            return "LOW"

    veh_df['vehicle_evidence_strength'] = veh_df.apply(_determine_vehicle_evidence, axis=1)

    def _determine_vehicle_attribution(row):
        v_id = row['Vehicle_ID']
        if attribution_df is not None and not attribution_df.empty:
            veh_attrs = attribution_df[attribution_df['Vehicle_ID'] == v_id]['Attribution_Category'].tolist()
            if 'VEHICLE-LINKED PATTERN' in veh_attrs:
                return "VEHICLE-LINKED PATTERN"
            elif 'JOINT DRIVER-VEHICLE CO-OCCURRENCE' in veh_attrs:
                return "JOINT DRIVER-VEHICLE CO-OCCURRENCE"
            elif 'DRIVER-LINKED PATTERN' in veh_attrs:
                return "DRIVER-LINKED PATTERN"
        if row['unique_drivers_count'] > 1 and row['elevated_day_ratio'] >= 0.40:
            return "VEHICLE-LINKED PATTERN"
        return "INSUFFICIENT EVIDENCE FOR ATTRIBUTION"

    veh_df['vehicle_attribution'] = veh_df.apply(_determine_vehicle_attribution, axis=1)

    return veh_df
