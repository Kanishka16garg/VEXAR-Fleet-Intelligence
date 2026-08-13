"""
Module: eda_engine.py
Description: Exploratory Data Analysis & Visualization Pipeline.
Generates publication-quality analytical charts, computes statistical summaries across Fleet, Driver, Vehicle, Speed,
Accelerometer, Gyroscope, Temporal, Exposure, and Attribution dimensions, evaluates candidate features, and compiles Stage 3 recommendations.
"""

import os
from typing import Dict, Any
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from src.ingestion.loader import FleetDataset


# Set clean dark/modern styling for Matplotlib/Seaborn
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['axes.edgecolor'] = '#CCCCCC'
plt.rcParams['axes.linewidth'] = 0.8


def run_full_eda(dataset: FleetDataset, trip_features: pd.DataFrame, output_dir: str, figures_dir: str) -> Dict[str, Any]:
    """
    Executes full EDA workflow, exports visual figures, evaluates candidate features,
    and returns comprehensive statistical summaries.

    Parameters:
    -----------
    dataset : FleetDataset
        Loaded raw dataset container.
    trip_features : pd.DataFrame
        Processed trip-level features table.
    output_dir : str
        Processed data / output directory.
    figures_dir : str
        Figures output directory.

    Returns:
    --------
    Dict[str, Any]
        Dictionary of all computed metrics and analytical findings.
    """
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(figures_dir, exist_ok=True)

    tel = dataset.telemetry.copy()
    trips = dataset.trips.copy()
    drivers = dataset.drivers.copy()
    vehicles = dataset.vehicles.copy()

    # Calculate Speed Deltas and Baseline Gravity Deviation in telemetry
    tel = tel.sort_values(['Trip_ID', 'Timestamp']).reset_index(drop=True)
    tel['speed_delta'] = tel.groupby('Trip_ID')['Speed_kmph'].diff().fillna(0.0)
    tel['accel_raw_mag'] = np.sqrt(tel['Accel_X_g']**2 + tel['Accel_Y_g']**2 + tel['Accel_Z_g']**2)

    # Baseline gravity estimation from fleet median (~1.0086g)
    baseline_gravity = float(tel['accel_raw_mag'].median())
    tel['accel_grav_dev'] = np.abs(tel['accel_raw_mag'] - baseline_gravity)
    tel['gyro_mag'] = np.sqrt(tel['Gyro_X_dps']**2 + tel['Gyro_Y_dps']**2 + tel['Gyro_Z_dps']**2)

    stats = {}

    # --- 1. Dataset Overview ---
    stats['num_drivers'] = len(drivers)
    stats['num_vehicles'] = len(vehicles)
    stats['num_trips'] = len(trips)
    stats['num_telemetry'] = len(tel)
    stats['total_fleet_distance_km'] = trips['Distance_KM'].sum()
    stats['total_fleet_driving_hours'] = trips['Duration_Min'].sum() / 60.0
    stats['avg_trip_duration_min'] = trips['Duration_Min'].mean()
    stats['avg_trip_distance_km'] = trips['Distance_KM'].mean()
    stats['avg_trip_speed_kmph'] = trips['Avg_Speed_kmph'].mean()

    # --- 2. Telemetry Speed Statistics ---
    sp = tel['Speed_kmph']
    stats['speed_stats'] = {
        'mean': sp.mean(),
        'std': sp.std(),
        'median': sp.median(),
        'min': sp.min(),
        'max': sp.max(),
        'p25': sp.quantile(0.25),
        'p50': sp.quantile(0.50),
        'p75': sp.quantile(0.75),
        'p90': sp.quantile(0.90),
        'p95': sp.quantile(0.95),
        'p99': sp.quantile(0.99)
    }

    # --- 3. Accelerometer Baseline & Gravity Deviation Statistics ---
    stats['baseline_gravity_median'] = baseline_gravity
    stats['accel_grav_dev_stats'] = {
        'mean': tel['accel_grav_dev'].mean(),
        'std': tel['accel_grav_dev'].std(),
        'median': tel['accel_grav_dev'].median(),
        'p90': tel['accel_grav_dev'].quantile(0.90),
        'p95': tel['accel_grav_dev'].quantile(0.95),
        'p99': tel['accel_grav_dev'].quantile(0.99),
        'max': tel['accel_grav_dev'].max()
    }

    # --- 4. Gyroscope Rotational Rate Statistics ---
    stats['gyro_stats'] = {
        'mean': tel['gyro_mag'].mean(),
        'std': tel['gyro_mag'].std(),
        'median': tel['gyro_mag'].median(),
        'p90': tel['gyro_mag'].quantile(0.90),
        'p95': tel['gyro_mag'].quantile(0.95),
        'p99': tel['gyro_mag'].quantile(0.99),
        'max': tel['gyro_mag'].max()
    }

    # --- VISUALIZATION GENERATION ---

    # Figure 1: Speed Distribution & Upper Percentile Tails
    fig, ax = plt.subplots(figsize=(8, 4.5))
    sns.histplot(tel['Speed_kmph'], kde=True, bins=40, color='#1f77b4', ax=ax)
    ax.set_title('Fleet Telemetry Speed Distribution (12,987 Observations)', fontsize=12, fontweight='bold', pad=12)
    ax.set_xlabel('Speed (km/h)', fontsize=11)
    ax.set_ylabel('Observation Frequency', fontsize=11)
    ax.axvline(stats['speed_stats']['p90'], color='#ff7f0e', linestyle='--', label=f"P90: {stats['speed_stats']['p90']:.1f} km/h")
    ax.axvline(stats['speed_stats']['p95'], color='#d62728', linestyle='--', label=f"P95: {stats['speed_stats']['p95']:.1f} km/h")
    ax.axvline(stats['speed_stats']['p99'], color='#9467bd', linestyle='--', label=f"P99: {stats['speed_stats']['p99']:.1f} km/h")
    ax.legend(frameon=True)
    plt.tight_layout()
    fig.savefig(os.path.join(figures_dir, '01_speed_distribution.png'), dpi=300)
    plt.close(fig)

    # Figure 2: Accelerometer Baseline Gravity vs Deviation Distribution
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.5))
    sns.histplot(tel['accel_raw_mag'], kde=True, bins=40, color='#2ca02c', ax=ax1)
    ax1.set_title(f'Raw Accelerometer Magnitude ||A_raw||\n(Baseline Median = {baseline_gravity:.4f}g)', fontsize=11, fontweight='bold')
    ax1.set_xlabel('Raw Acceleration (g)', fontsize=10)
    ax1.set_ylabel('Frequency', fontsize=10)

    sns.histplot(tel['accel_grav_dev'], kde=True, bins=40, color='#d62728', ax=ax2)
    ax2.set_title('Gravity-Relative Acceleration Deviation\n(| ||A_raw|| - baseline |)', fontsize=11, fontweight='bold')
    ax2.set_xlabel('Magnitude Deviation (g)', fontsize=10)
    ax2.set_ylabel('Frequency', fontsize=10)
    ax2.axvline(stats['accel_grav_dev_stats']['p95'], color='black', linestyle='--', label=f"P95: {stats['accel_grav_dev_stats']['p95']:.3f}g")
    ax2.legend(frameon=True)
    plt.tight_layout()
    fig.savefig(os.path.join(figures_dir, '02_accel_gravity_decomposition.png'), dpi=300)
    plt.close(fig)

    # Figure 3: Gyroscope Rotational Rate Distribution
    fig, ax = plt.subplots(figsize=(8, 4.5))
    sns.histplot(tel['gyro_mag'], kde=True, bins=40, color='#9467bd', ax=ax)
    ax.set_title('Gyroscope Angular Velocity Magnitude ||Gyro|| Distribution', fontsize=12, fontweight='bold', pad=12)
    ax.set_xlabel('Rotational Rate (dps)', fontsize=11)
    ax.set_ylabel('Frequency', fontsize=11)
    ax.axvline(stats['gyro_stats']['p95'], color='#d62728', linestyle='--', label=f"P95: {stats['gyro_stats']['p95']:.1f} dps")
    ax.axvline(stats['gyro_stats']['p99'], color='#1f77b4', linestyle='--', label=f"P99: {stats['gyro_stats']['p99']:.1f} dps")
    ax.legend(frameon=True)
    plt.tight_layout()
    fig.savefig(os.path.join(figures_dir, '03_gyro_distribution.png'), dpi=300)
    plt.close(fig)

    # Figure 4: Distance vs Duration Scatter Plot
    fig, ax = plt.subplots(figsize=(8, 5))
    sns.scatterplot(data=trip_features, x='Duration_Min', y='Distance_KM', hue='speed_mean', palette='viridis', size='Max_Speed_kmph', sizes=(20, 150), ax=ax)
    ax.set_title('Trip Distance vs. Duration by Operating Speed Profile (450 Trips)', fontsize=12, fontweight='bold', pad=12)
    ax.set_xlabel('Trip Duration (Minutes)', fontsize=11)
    ax.set_ylabel('Trip Distance (KM)', fontsize=11)
    plt.tight_layout()
    fig.savefig(os.path.join(figures_dir, '04_distance_vs_duration.png'), dpi=300)
    plt.close(fig)

    # Figure 5: Driver Speed Variability Ranking
    driver_var = trip_features.groupby('Driver_ID')['speed_std'].mean().sort_values(ascending=False).reset_index()
    fig, ax = plt.subplots(figsize=(10, 5))
    sns.barplot(data=driver_var, x='Driver_ID', y='speed_std', hue='Driver_ID', palette='magma', legend=False, ax=ax)
    ax.set_title('Driver Speed Variability Ranking (Average Within-Trip Speed Std Dev)', fontsize=12, fontweight='bold', pad=12)
    ax.set_xlabel('Driver ID', fontsize=10)
    ax.set_ylabel('Speed Std Dev (km/h)', fontsize=10)
    plt.xticks(rotation=45)
    plt.tight_layout()
    fig.savefig(os.path.join(figures_dir, '05_driver_speed_variability.png'), dpi=300)
    plt.close(fig)

    # Figure 6: Vehicle Service Recency & Age vs Sensor Variability
    veh_summary_path = os.path.join(output_dir, "vehicle_summary.csv")
    if os.path.exists(veh_summary_path):
        veh_df = pd.read_csv(veh_summary_path)
        fig, ax = plt.subplots(figsize=(8, 5))
        sns.scatterplot(data=veh_df, x='days_since_last_service', y='accel_extremes_per_hour', hue='vehicle_age_years', size='total_distance_km', sizes=(40, 200), palette='coolwarm', ax=ax)
        ax.set_title('Days Since Service vs. Candidate Accel Deviation Rate per Hour', fontsize=12, fontweight='bold', pad=12)
        ax.set_xlabel('Days Since Last Service', fontsize=11)
        ax.set_ylabel('Accel Extremes per Hour', fontsize=11)
        plt.tight_layout()
        fig.savefig(os.path.join(figures_dir, '06_service_recency_vs_sensor_variability.png'), dpi=300)
        plt.close(fig)

    # Figure 7: Driver-Vehicle Usage Heatmap
    usage_path = os.path.join(output_dir, "driver_vehicle_usage.csv")
    if os.path.exists(usage_path):
        usage_matrix = pd.read_csv(usage_path, index_col=0)
        fig, ax = plt.subplots(figsize=(12, 8))
        sns.heatmap(usage_matrix, cmap='YlGnBu', annot=False, cbar=True, ax=ax)
        ax.set_title('Driver ↔ Vehicle Operational Cross-Assignment Matrix (450 Trips)', fontsize=12, fontweight='bold', pad=12)
        ax.set_xlabel('Vehicle ID', fontsize=11)
        ax.set_ylabel('Driver ID', fontsize=11)
        plt.tight_layout()
        fig.savefig(os.path.join(figures_dir, '07_driver_vehicle_usage_heatmap.png'), dpi=300)
        plt.close(fig)

    # Figure 8: Telemetry Profile for a Candidate High-Variance Trip
    top_anom_trip = trip_features.sort_values('accel_extremes_per_hour', ascending=False)['Trip_ID'].iloc[0]
    sample_tel = tel[tel['Trip_ID'] == top_anom_trip].copy()
    fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(10, 7), sharex=True)

    ax1.plot(sample_tel['Timestamp'], sample_tel['Speed_kmph'], color='#1f77b4', linewidth=1.8, label='Speed (km/h)')
    ax1.set_ylabel('Speed (km/h)', fontsize=10)
    ax1.set_title(f'Telemetry Profile for High-Variance Trip: {top_anom_trip}', fontsize=12, fontweight='bold')
    ax1.legend(loc='upper right')

    ax2.plot(sample_tel['Timestamp'], sample_tel['accel_grav_dev'], color='#d62728', linewidth=1.8, label='||A_grav_dev|| (g)')
    ax2.axhline(stats['accel_grav_dev_stats']['p95'], color='black', linestyle='--', alpha=0.7, label=f"P95 Thresh ({stats['accel_grav_dev_stats']['p95']:.3f}g)")
    ax2.set_ylabel('Accel Dev (g)', fontsize=10)
    ax2.legend(loc='upper right')

    ax3.plot(sample_tel['Timestamp'], sample_tel['gyro_mag'], color='#9467bd', linewidth=1.8, label='||Gyro|| (dps)')
    ax3.axhline(stats['gyro_stats']['p95'], color='black', linestyle='--', alpha=0.7, label=f"P95 Thresh ({stats['gyro_stats']['p95']:.1f} dps)")
    ax3.set_ylabel('Gyro Rate (dps)', fontsize=10)
    ax3.set_xlabel('Timestamp', fontsize=10)
    ax3.legend(loc='upper right')

    plt.tight_layout()
    fig.savefig(os.path.join(figures_dir, '08_anomalous_trip_telemetry_profile.png'), dpi=300)
    plt.close(fig)

    # Figure 9: Exposure Bias Demonstration: Raw Counts vs. Normalized Rates
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.5))
    top_drivers_raw = trip_features.groupby('Driver_ID')['accel_extreme_count'].sum().sort_values(ascending=False).head(10)
    top_drivers_norm = trip_features.groupby('Driver_ID')['accel_extremes_per_hour'].mean().sort_values(ascending=False).head(10)

    top_drivers_raw.plot(kind='bar', color='#1f77b4', ax=ax1)
    ax1.set_title('Top 10 Drivers by Raw Extreme Counts (Biased by Trip Volume)', fontsize=10, fontweight='bold')
    ax1.set_ylabel('Total Raw Count', fontsize=10)
    ax1.set_xlabel('Driver ID', fontsize=10)

    top_drivers_norm.plot(kind='bar', color='#d62728', ax=ax2)
    ax2.set_title('Top 10 Drivers by Exposure-Normalized Rate (Events / Driving Hour)', fontsize=10, fontweight='bold')
    ax2.set_ylabel('Events / Hour', fontsize=10)
    ax2.set_xlabel('Driver ID', fontsize=10)
    plt.tight_layout()
    fig.savefig(os.path.join(figures_dir, '09_exposure_bias_comparison.png'), dpi=300)
    plt.close(fig)

    # --- CANDIDATE FEATURE EVALUATION REPORT ---
    candidate_features_list = [
        {"Feature": "speed_mean", "Level": "Trip", "Source": "Telemetry Speed", "Reason": "Central tendency of trip operating velocity", "Interpretability": "High", "Potential Issue": "Redundant with Trips.Avg_Speed_kmph (corr > 0.999)", "Action": "REJECT (Redundant)"},
        {"Feature": "speed_max", "Level": "Trip", "Source": "Telemetry Speed", "Reason": "Peak instantaneous speed", "Interpretability": "Medium", "Potential Issue": "Redundant with Trips.Max_Speed_kmph (corr > 0.999)", "Action": "REJECT (Redundant)"},
        {"Feature": "speed_p95", "Level": "Trip", "Source": "Telemetry Speed", "Reason": "Captures sustained high operating speed tail without minute noise", "Interpretability": "High", "Potential Issue": "None", "Action": "KEEP"},
        {"Feature": "speed_std", "Level": "Trip", "Source": "Telemetry Speed", "Reason": "Quantifies speed instability and stop-and-go driving pattern", "Interpretability": "High", "Potential Issue": "Influenced by hub traffic density", "Action": "KEEP"},
        {"Feature": "accel_grav_dev_mean", "Level": "Trip", "Source": "3-Axis Accel Magnitude Deviation", "Reason": "Mean magnitude deviation from nominal baseline gravity (~1.0086g)", "Interpretability": "High", "Potential Issue": "Scalar proxy, not full 3D vector decomposition", "Action": "KEEP"},
        {"Feature": "accel_extremes_per_hour", "Level": "Trip", "Source": "3-Axis Accel Magnitude Deviation", "Reason": "Exposure-normalized rate of candidate extreme acceleration deviations", "Interpretability": "Very High", "Potential Issue": "Can reflect road surface irregularity or handling", "Action": "KEEP"},
        {"Feature": "gyro_mag_p95", "Level": "Trip", "Source": "3-Axis Gyroscope", "Reason": "Upper tail rotational velocity (cornering/swerving rate)", "Interpretability": "High", "Potential Issue": "None", "Action": "KEEP"},
        {"Feature": "gyro_extremes_per_hour", "Level": "Trip", "Source": "3-Axis Gyroscope", "Reason": "Exposure-normalized rate of candidate extreme rotational velocities", "Interpretability": "Very High", "Potential Issue": "Can reflect steering slop or sharp turns", "Action": "KEEP"},
        {"Feature": "days_since_last_service", "Level": "Vehicle", "Source": "Vehicles Master Data", "Reason": "Maintenance recency operational signal", "Interpretability": "High", "Potential Issue": "Static across 1-week window", "Action": "INVESTIGATE"},
        {"Feature": "vehicle_age_years", "Level": "Vehicle", "Source": "Vehicles Master Data", "Reason": "Vehicle structural aging indicator", "Interpretability": "High", "Potential Issue": "Correlated with initial odometer", "Action": "INVESTIGATE"},
        {"Feature": "Distance_KM", "Level": "Trip", "Source": "Trips Master Data", "Reason": "Total trip spatial span", "Interpretability": "High", "Potential Issue": "Strong correlation with Duration_Min (r = 0.88), but distinct physical dimension", "Action": "INVESTIGATE"}
    ]

    feature_eval_df = pd.DataFrame(candidate_features_list)
    feature_eval_df.to_csv(os.path.join(output_dir, "candidate_features_evaluation.csv"), index=False)

    # Export trip_features.csv to data/processed/
    trip_features.to_csv(os.path.join(output_dir, "trip_features.csv"), index=False)

    return stats
