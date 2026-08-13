"""
Module: driver_vehicle_attribution.py
Description: Driver-vs-Vehicle Anomaly Attribution Engine.
Analyzes multi-vehicle drivers and multi-driver vehicles, quantifies operational relationship metrics,
and attributes candidate telemetry anomalies to Driver-linked vs Vehicle-linked operational causes with evidence bounds.
"""

import os
from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np
from src.ingestion.loader import FleetDataset


def analyze_driver_vehicle_relationships(dataset: FleetDataset, trip_features: pd.DataFrame, output_dir: str = None) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Analyzes vehicle assignment patterns, aggregates driver & vehicle metrics,
    and performs anomaly attribution.

    Parameters:
    -----------
    dataset : FleetDataset
        Loaded dataset.
    trip_features : pd.DataFrame
        Processed trip-level feature table.
    output_dir : str, optional
        Directory to save processed outputs.

    Returns:
    --------
    Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]
        driver_summary, vehicle_summary, driver_vehicle_usage, attribution_insights
    """
    drivers = dataset.drivers.copy()
    vehicles = dataset.vehicles.copy()
    trips = dataset.trips.copy()

    # 1. Driver-Vehicle Usage Cross-Tabulation Matrix
    usage_matrix = pd.crosstab(trips['Driver_ID'], trips['Vehicle_ID'])

    # Driver cross-usage statistics
    drivers_vehicle_counts = (usage_matrix > 0).sum(axis=1)
    single_veh_drivers_count = (drivers_vehicle_counts == 1).sum()
    multi_veh_drivers_count = (drivers_vehicle_counts > 1).sum()

    # Vehicle cross-usage statistics
    vehicles_driver_counts = (usage_matrix > 0).sum(axis=0)
    single_drv_vehicles_count = (vehicles_driver_counts == 1).sum()
    multi_drv_vehicles_count = (vehicles_driver_counts > 1).sum()

    # 2. Driver Summary Aggregation
    driver_trips = trip_features.groupby('Driver_ID').agg({
        'Trip_ID': 'count',
        'Distance_KM': 'sum',
        'Duration_Min': 'sum',
        'Vehicle_ID': lambda x: len(x.unique()),
        'speed_mean': 'mean',
        'speed_p95': 'mean',
        'speed_max': 'max',
        'speed_std': 'mean',
        'accel_extreme_count': 'sum',
        'gyro_extreme_count': 'sum',
        'accel_extremes_per_hour': 'mean',
        'gyro_extremes_per_hour': 'mean'
    }).reset_index()

    driver_trips.rename(columns={
        'Trip_ID': 'total_trips',
        'Distance_KM': 'total_distance_km',
        'Duration_Min': 'total_duration_min',
        'Vehicle_ID': 'unique_vehicles_used',
        'speed_mean': 'avg_speed_kmph',
        'speed_p95': 'avg_speed_p95',
        'speed_max': 'max_observed_speed_kmph',
        'speed_std': 'avg_speed_variability'
    }, inplace=True)

    driver_summary = drivers.merge(driver_trips, on='Driver_ID', how='left')

    # 3. Vehicle Summary Aggregation
    obs_start_date = pd.to_datetime('2026-07-31')
    vehicles['days_since_last_service'] = (obs_start_date - vehicles['Last_Service_Date']).dt.days
    vehicles['vehicle_age_years'] = 2026 - vehicles['Manufacture_Year']

    vehicle_trips = trip_features.groupby('Vehicle_ID').agg({
        'Trip_ID': 'count',
        'Distance_KM': 'sum',
        'Duration_Min': 'sum',
        'Driver_ID': lambda x: len(x.unique()),
        'speed_mean': 'mean',
        'speed_p95': 'mean',
        'speed_max': 'max',
        'accel_raw_mag_mean': 'mean',
        'accel_grav_dev_mean': 'mean',
        'accel_grav_dev_p95': 'mean',
        'accel_extreme_count': 'sum',
        'gyro_mag_mean': 'mean',
        'gyro_mag_p95': 'mean',
        'gyro_extreme_count': 'sum',
        'accel_extremes_per_hour': 'mean',
        'gyro_extremes_per_hour': 'mean'
    }).reset_index()

    vehicle_trips.rename(columns={
        'Trip_ID': 'total_trips',
        'Distance_KM': 'total_distance_km',
        'Duration_Min': 'total_duration_min',
        'Driver_ID': 'unique_drivers_count',
        'speed_mean': 'avg_speed_kmph',
        'speed_p95': 'avg_speed_p95',
        'speed_max': 'max_observed_speed_kmph'
    }, inplace=True)

    vehicle_summary = vehicles.merge(vehicle_trips, on='Vehicle_ID', how='left')

    # 4. Candidate Anomaly Attribution Identification
    # Define candidate anomaly thresholds based on empirical upper 90th percentile of trip rates
    accel_p90_thresh = trip_features['accel_extremes_per_hour'].quantile(0.90)
    gyro_p90_thresh = trip_features['gyro_extremes_per_hour'].quantile(0.90)

    trip_features['is_high_accel_anomaly'] = trip_features['accel_extremes_per_hour'] > accel_p90_thresh
    trip_features['is_high_gyro_anomaly'] = trip_features['gyro_extremes_per_hour'] > gyro_p90_thresh
    trip_features['is_candidate_anomaly'] = trip_features['is_high_accel_anomaly'] | trip_features['is_high_gyro_anomaly']

    anom_trips = trip_features[trip_features['is_candidate_anomaly']].copy()

    # Evidence-Based Attribution Logic Evaluation
    attribution_results = []
    for _, trip in anom_trips.iterrows():
        d_id = trip['Driver_ID']
        v_id = trip['Vehicle_ID']

        # Check if driver showed anomalies on other vehicles
        driver_anoms_other_vehs = trip_features[
            (trip_features['Driver_ID'] == d_id) &
            (trip_features['Vehicle_ID'] != v_id) &
            (trip_features['is_candidate_anomaly'])
        ].shape[0]

        # Check if vehicle showed anomalies with other drivers
        veh_anoms_other_drvs = trip_features[
            (trip_features['Vehicle_ID'] == v_id) &
            (trip_features['Driver_ID'] != d_id) &
            (trip_features['is_candidate_anomaly'])
        ].shape[0]

        if driver_anoms_other_vehs > 0 and veh_anoms_other_drvs == 0:
            attr = "DRIVER-LINKED PATTERN"
            evidence = f"Driver {d_id} exhibits candidate anomalies across multiple vehicles ({driver_anoms_other_vehs} on other vehicles)."
        elif veh_anoms_other_drvs > 0 and driver_anoms_other_vehs == 0:
            attr = "VEHICLE-LINKED PATTERN"
            evidence = f"Vehicle {v_id} exhibits candidate sensor anomalies across multiple drivers ({veh_anoms_other_drvs} with other drivers)."
        elif driver_anoms_other_vehs > 0 and veh_anoms_other_drvs > 0:
            attr = "JOINT DRIVER-VEHICLE CO-OCCURRENCE"
            evidence = f"Candidate anomalies present across both driver history ({driver_anoms_other_vehs}) and vehicle history ({veh_anoms_other_drvs})."
        else:
            attr = "INSUFFICIENT EVIDENCE FOR ATTRIBUTION"
            evidence = "Candidate anomaly appears isolated to a single driver-vehicle trip pair; evidence currently insufficient for persistent attribution."

        attribution_results.append({
            'Trip_ID': trip['Trip_ID'],
            'Driver_ID': d_id,
            'Vehicle_ID': v_id,
            'Trip_Date': trip['Trip_Date'],
            'accel_extremes_per_hour': trip['accel_extremes_per_hour'],
            'gyro_extremes_per_hour': trip['gyro_extremes_per_hour'],
            'Attribution_Category': attr,
            'Evidence_Summary': evidence
        })

    attribution_df = pd.DataFrame(attribution_results)

    insights = {
        'single_veh_drivers': single_veh_drivers_count,
        'multi_veh_drivers': multi_veh_drivers_count,
        'single_drv_vehicles': single_drv_vehicles_count,
        'multi_drv_vehicles': multi_drv_vehicles_count,
        'total_anomalous_trips': len(anom_trips),
        'driver_linked_anomalies': (attribution_df['Attribution_Category'] == "DRIVER-LINKED PATTERN").sum() if not attribution_df.empty else 0,
        'vehicle_linked_anomalies': (attribution_df['Attribution_Category'] == "VEHICLE-LINKED PATTERN").sum() if not attribution_df.empty else 0,
        'insufficient_evidence_anomalies': (attribution_df['Attribution_Category'] == "INSUFFICIENT EVIDENCE FOR ATTRIBUTION").sum() if not attribution_df.empty else 0
    }

    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        driver_summary.to_csv(os.path.join(output_dir, "driver_summary.csv"), index=False)
        vehicle_summary.to_csv(os.path.join(output_dir, "vehicle_summary.csv"), index=False)
        usage_matrix.to_csv(os.path.join(output_dir, "driver_vehicle_usage.csv"))
        if not attribution_df.empty:
            attribution_df.to_csv(os.path.join(output_dir, "anomaly_attribution.csv"), index=False)

    return driver_summary, vehicle_summary, usage_matrix, insights

