"""
Module: driver_scoring.py
Description: Interpretable Driver Behaviour Intelligence Engine for Vexar Fleet Intelligence.
Computes 6 transparent, fleet-relative percentile components per driver:
  1. speed_instability (speed_std percentile)
  2. speed_tail (speed_p95 percentile)
  3. acceleration_signal (accel_grav_dev_mean percentile)
  4. gyro_signal (gyro_mag_p95 percentile)
  5. exposure_event_rate (events/hour percentile)
  6. persistence_score (elevated active days ratio percentile)
Determines Driver Evidence Strength and integrates operational attribution.
"""

import pandas as pd
import numpy as np
from scipy.stats import rankdata
from typing import Dict, Any, Tuple


def _percentile_rank_series(series: pd.Series) -> pd.Series:
    """Computes empirical percentile rank (0.0 to 100.0) for a pandas Series."""
    if len(series) <= 1:
        return pd.Series(50.0, index=series.index)
    ranks = rankdata(series, method='average')
    pcts = (ranks - 1.0) / (len(series) - 1.0) * 100.0
    return pd.Series(pcts, index=series.index)


def compute_driver_intelligence(dataset: Any, trip_features: pd.DataFrame, attribution_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Computes interpretable driver behaviour intelligence scores and component contributions.

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
        Driver intelligence summary DataFrame with 30 rows and component metrics.
    """
    drivers = dataset.drivers.copy()
    trips = dataset.trips.copy()

    # 1. Temporal Persistence & Daily Breakdown per Driver
    trip_features['Trip_Date'] = pd.to_datetime(trip_features['Trip_Date'])
    
    # Define exploratory top 25% fleet threshold for "elevated" trip
    accel_p75 = trip_features['accel_extremes_per_hour'].quantile(0.75)
    gyro_p75 = trip_features['gyro_extremes_per_hour'].quantile(0.75)
    trip_features['is_elevated_trip'] = (trip_features['accel_extremes_per_hour'] > accel_p75) | (trip_features['gyro_extremes_per_hour'] > gyro_p75)

    # Aggregate trip metrics by Driver_ID
    driver_agg = trip_features.groupby('Driver_ID').agg(
        total_trips=('Trip_ID', 'count'),
        total_distance_km=('Distance_KM', 'sum'),
        total_duration_min=('Duration_Min', 'sum'),
        speed_std_mean=('speed_std', 'mean'),
        speed_p95_mean=('speed_p95', 'mean'),
        accel_grav_dev_mean=('accel_grav_dev_mean', 'mean'),
        gyro_mag_p95_mean=('gyro_mag_p95', 'mean'),
        accel_extremes_per_hour=('accel_extremes_per_hour', 'mean'),
        gyro_extremes_per_hour=('gyro_extremes_per_hour', 'mean'),
        accel_extremes_per_100km=('accel_extremes_per_100km', 'mean'),
        gyro_extremes_per_100km=('gyro_extremes_per_100km', 'mean'),
        unique_vehicles_used=('Vehicle_ID', lambda x: len(x.unique()))
    ).reset_index()

    driver_agg['driving_hours'] = driver_agg['total_duration_min'] / 60.0

    # Calculate active days and elevated days per driver
    daily_driver = trip_features.groupby(['Driver_ID', 'Trip_Date']).agg(
        daily_elevated=('is_elevated_trip', lambda x: x.sum() > 0)
    ).reset_index()

    persistence_df = daily_driver.groupby('Driver_ID').agg(
        active_days=('Trip_Date', 'count'),
        elevated_days=('daily_elevated', 'sum')
    ).reset_index()

    persistence_df['elevated_day_ratio'] = persistence_df['elevated_days'] / np.maximum(persistence_df['active_days'], 1.0)
    persistence_df['persistence_score'] = persistence_df['elevated_day_ratio'] * 100.0

    # Merge persistence into driver_agg
    driver_df = driver_agg.merge(persistence_df[['Driver_ID', 'active_days', 'elevated_days', 'elevated_day_ratio', 'persistence_score']], on='Driver_ID', how='left')

    # Composite Exposure Rate
    driver_df['composite_event_rate'] = driver_df['accel_extremes_per_hour'] + driver_df['gyro_extremes_per_hour']

    # 2. Fleet-Relative Percentile Ranks for 6 Components
    driver_df['comp_speed_instability_pct'] = _percentile_rank_series(driver_df['speed_std_mean'])
    driver_df['comp_speed_tail_pct'] = _percentile_rank_series(driver_df['speed_p95_mean'])
    driver_df['comp_accel_signal_pct'] = _percentile_rank_series(driver_df['accel_grav_dev_mean'])
    driver_df['comp_gyro_signal_pct'] = _percentile_rank_series(driver_df['gyro_mag_p95_mean'])
    driver_df['comp_exposure_event_pct'] = _percentile_rank_series(driver_df['composite_event_rate'])
    driver_df['comp_persistence_pct'] = _percentile_rank_series(driver_df['persistence_score'])

    # 3. Transparent Weighted Score Calculation
    # Weights: 0.20 speed_instability, 0.20 speed_tail, 0.20 accel, 0.15 gyro, 0.15 exposure, 0.10 persistence
    driver_df['interpretable_driver_score'] = (
        0.20 * driver_df['comp_speed_instability_pct'] +
        0.20 * driver_df['comp_speed_tail_pct'] +
        0.20 * driver_df['comp_accel_signal_pct'] +
        0.15 * driver_df['comp_gyro_signal_pct'] +
        0.15 * driver_df['comp_exposure_event_pct'] +
        0.10 * driver_df['comp_persistence_pct']
    )

    # 4. Evidence Strength & Attribution Mapping
    # Multi-vehicle anomaly check from Stage 2 attribution
    driver_multi_veh_anoms = {}
    if attribution_df is not None and not attribution_df.empty:
        for d_id, group in attribution_df.groupby('Driver_ID'):
            driver_multi_veh_anoms[d_id] = (group['Attribution_Category'] == 'DRIVER-LINKED PATTERN').sum()

    def _determine_driver_evidence(row):
        d_id = row['Driver_ID']
        has_multi_veh_pattern = driver_multi_veh_anoms.get(d_id, 0) > 0
        ratio = row['elevated_day_ratio']

        if has_multi_veh_pattern or ratio >= 0.60:
            return "HIGH"
        elif ratio >= 0.35 or row['unique_vehicles_used'] > 1:
            return "MEDIUM"
        else:
            return "LOW"

    driver_df['driver_evidence_strength'] = driver_df.apply(_determine_driver_evidence, axis=1)

    def _determine_driver_attribution(row):
        d_id = row['Driver_ID']
        if attribution_df is not None and not attribution_df.empty:
            driver_attrs = attribution_df[attribution_df['Driver_ID'] == d_id]['Attribution_Category'].tolist()
            if 'DRIVER-LINKED PATTERN' in driver_attrs:
                return "DRIVER-LINKED PATTERN"
            elif 'JOINT DRIVER-VEHICLE CO-OCCURRENCE' in driver_attrs:
                return "JOINT DRIVER-VEHICLE CO-OCCURRENCE"
            elif 'VEHICLE-LINKED PATTERN' in driver_attrs:
                return "VEHICLE-LINKED PATTERN"
        if row['unique_vehicles_used'] > 1 and row['elevated_day_ratio'] >= 0.40:
            return "DRIVER-LINKED PATTERN"
        return "INSUFFICIENT EVIDENCE FOR ATTRIBUTION"

    driver_df['driver_attribution'] = driver_df.apply(_determine_driver_attribution, axis=1)

    # Merge Driver Master Info (excluding protected demographic attributes Age/Gender from model scoring)
    driver_master = drivers[['Driver_ID', 'Driver_Name', 'License_Experience_Years', 'Date_Joined_Fleet', 'Primary_Vehicle_ID', 'Home_Hub']]
    res_df = driver_master.merge(driver_df, on='Driver_ID', how='left')

    return res_df
