"""
Module: telemetry_transformer.py
Description: Telemetry Preprocessing and Feature Extraction Engine.
Transforms raw telemetry streams into domain-informed, exposure-normalized trip-level statistical features.
Implements empirical baseline gravity deviation estimation and rotational velocity metrics.
"""

import pandas as pd
import numpy as np
from src.ingestion.loader import FleetDataset


def process_telemetry_features(dataset: FleetDataset) -> pd.DataFrame:
    """
    Computes fine-grained telemetry metrics and aggregates them to trip level.

    Parameters:
    -----------
    dataset : FleetDataset
        Loaded fleet dataset.

    Returns:
    --------
    pd.DataFrame
        Trip-level feature DataFrame (450 rows) containing trip metadata, speed statistics,
        gravity-relative acceleration deviation features, gyroscope features, and exposure-normalized rates.
    """
    tel = dataset.telemetry.copy()
    trips = dataset.trips.copy()

    # Sort telemetry chronologically per trip
    tel = tel.sort_values(['Trip_ID', 'Timestamp']).reset_index(drop=True)

    # 1. Sequential Speed Delta (min-to-min change)
    tel['speed_delta'] = tel.groupby('Trip_ID')['Speed_kmph'].diff().fillna(0.0)

    # Empirical speed delta tail flags (Upper 5% deceleration and acceleration tails)
    p95_accel_delta = tel['speed_delta'].quantile(0.95)   # ~ +8.2 km/h per min
    p05_brake_delta = tel['speed_delta'].quantile(0.05)   # ~ -8.1 km/h per min

    tel['is_high_accel_delta'] = tel['speed_delta'] >= p95_accel_delta
    tel['is_high_brake_delta'] = tel['speed_delta'] <= p05_brake_delta

    # 2. Accelerometer Processing: Baseline Gravity Estimation & Deviation
    # Raw magnitude: ||A_raw|| = sqrt(Ax^2 + Ay^2 + Az^2)
    tel['accel_raw_mag'] = np.sqrt(tel['Accel_X_g']**2 + tel['Accel_Y_g']**2 + tel['Accel_Z_g']**2)

    # Estimate empirical baseline gravity from fleet median (~ 1.0086g)
    baseline_gravity = float(tel['accel_raw_mag'].median())

    # Acceleration magnitude deviation from nominal gravity: ||A_grav_dev|| = | ||A_raw|| - baseline |
    tel['accel_grav_dev'] = np.abs(tel['accel_raw_mag'] - baseline_gravity)

    # Empirical P95 upper tail for candidate extreme acceleration deviation (~ 0.1365g)
    p95_accel_grav_dev = tel['accel_grav_dev'].quantile(0.95)
    tel['is_accel_grav_dev_extreme'] = tel['accel_grav_dev'] >= p95_accel_grav_dev

    # 3. Gyroscope Processing: Rotational Rate
    tel['gyro_mag'] = np.sqrt(tel['Gyro_X_dps']**2 + tel['Gyro_Y_dps']**2 + tel['Gyro_Z_dps']**2)

    # Empirical P95 upper tail for candidate extreme rotational rate (~ 7.5756 dps)
    p95_gyro_mag = tel['gyro_mag'].quantile(0.95)
    tel['is_gyro_mag_extreme'] = tel['gyro_mag'] >= p95_gyro_mag

    # 4. Aggregating Telemetry to Trip Level
    agg_funcs = {
        'Speed_kmph': [
            ('speed_mean', 'mean'),
            ('speed_median', 'median'),
            ('speed_std', 'std'),
            ('speed_max', 'max'),
            ('speed_p90', lambda x: np.percentile(x, 90)),
            ('speed_p95', lambda x: np.percentile(x, 95)),
            ('speed_p99', lambda x: np.percentile(x, 99)),
            ('speed_range', lambda x: x.max() - x.min())
        ],
        'speed_delta': [
            ('speed_delta_std', 'std'),
            ('speed_delta_max', 'max'),
            ('speed_delta_min', 'min')
        ],
        'is_high_accel_delta': [('high_accel_delta_count', 'sum')],
        'is_high_brake_delta': [('high_brake_delta_count', 'sum')],
        'accel_raw_mag': [
            ('accel_raw_mag_mean', 'mean'),
            ('accel_raw_mag_median', 'median'),
            ('accel_raw_mag_std', 'std'),
            ('accel_raw_mag_max', 'max'),
            ('accel_raw_mag_p95', lambda x: np.percentile(x, 95)),
            ('accel_raw_mag_p99', lambda x: np.percentile(x, 99))
        ],
        'accel_grav_dev': [
            ('accel_grav_dev_mean', 'mean'),
            ('accel_grav_dev_median', 'median'),
            ('accel_grav_dev_std', 'std'),
            ('accel_grav_dev_max', 'max'),
            ('accel_grav_dev_p95', lambda x: np.percentile(x, 95)),
            ('accel_grav_dev_p99', lambda x: np.percentile(x, 99))
        ],
        'is_accel_grav_dev_extreme': [('accel_extreme_count', 'sum')],
        'gyro_mag': [
            ('gyro_mag_mean', 'mean'),
            ('gyro_mag_median', 'median'),
            ('gyro_mag_std', 'std'),
            ('gyro_mag_max', 'max'),
            ('gyro_mag_p95', lambda x: np.percentile(x, 95)),
            ('gyro_mag_p99', lambda x: np.percentile(x, 99))
        ],
        'is_gyro_mag_extreme': [('gyro_extreme_count', 'sum')]
    }

    # Group by Trip_ID and compute metrics
    trip_tel_agg = tel.groupby('Trip_ID').agg(agg_funcs)

    col_names = []
    for spec in agg_funcs.values():
        for name, _ in spec:
            col_names.append(name)
    trip_tel_agg.columns = col_names
    trip_tel_agg = trip_tel_agg.reset_index()

    # 5. Merge with Trip Metadata
    trip_features = trips.merge(trip_tel_agg, on='Trip_ID', how='left')

    # Fill NaN std values if single-observation trip
    for col in trip_features.columns:
        if '_std' in col:
            trip_features[col] = trip_features[col].fillna(0.0)

    # 6. Exposure Normalization Rates (Per Driving Hour and Per 100 KM)
    duration_hours = np.maximum(trip_features['Duration_Min'] / 60.0, 1.0 / 60.0)
    distance_100k = np.maximum(trip_features['Distance_KM'] / 100.0, 0.01)

    trip_features['accel_extremes_per_hour'] = trip_features['accel_extreme_count'] / duration_hours
    trip_features['gyro_extremes_per_hour'] = trip_features['gyro_extreme_count'] / duration_hours
    trip_features['high_accel_deltas_per_hour'] = trip_features['high_accel_delta_count'] / duration_hours
    trip_features['high_brake_deltas_per_hour'] = trip_features['high_brake_delta_count'] / duration_hours

    trip_features['accel_extremes_per_100km'] = trip_features['accel_extreme_count'] / distance_100k
    trip_features['gyro_extremes_per_100km'] = trip_features['gyro_extreme_count'] / distance_100k
    trip_features['high_accel_deltas_per_100km'] = trip_features['high_accel_delta_count'] / distance_100k
    trip_features['high_brake_deltas_per_100km'] = trip_features['high_brake_delta_count'] / distance_100k

    return trip_features

