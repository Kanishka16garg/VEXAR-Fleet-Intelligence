"""
Module: validator.py
Description: Automated Data Validation pipeline for Vexar Fleet Intelligence.
Executes 11 rigorous data quality, schema, relational, timestamp, and domain sanity checks.
Differentiates INVALID data from EXTREME BUT POSSIBLY VALID observations.
Generates human-readable and machine-readable validation reports.
"""

import os
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from src.ingestion.loader import FleetDataset


def run_full_validation(dataset: FleetDataset, output_dir: str = None) -> pd.DataFrame:
    """
    Executes 11 data quality & integrity checks across all 4 tables in the FleetDataset.

    Parameters:
    -----------
    dataset : FleetDataset
        Loaded dataset container.
    output_dir : str, optional
        Directory where validation_report.csv and validation_report.md will be saved.

    Returns:
    --------
    pd.DataFrame
        Detailed validation results table with Check, Category, Count, Total_Evaluated, Metric_Pct, Status, Details.
    """
    results: List[Dict[str, Any]] = []

    drivers = dataset.drivers
    vehicles = dataset.vehicles
    trips = dataset.trips
    telemetry = dataset.telemetry

    def _add_check(category: str, check_name: str, count: int, total: int, details: str, is_warning_only: bool = False):
        pct = (count / total * 100.0) if total > 0 else 0.0
        if is_warning_only:
            status = "INFO / UNUSUAL" if count > 0 else "PASS"
        else:
            status = "PASS" if count == 0 else "FAIL"
        results.append({
            "Category": category,
            "Check_Name": check_name,
            "Violation_Count": count,
            "Total_Evaluated": total,
            "Violation_Pct": round(pct, 4),
            "Status": status,
            "Details": details
        })

    # 1. Schema Validation
    exp_drivers = {'Driver_ID', 'Driver_Name', 'Age', 'Gender', 'License_Experience_Years', 'Date_Joined_Fleet', 'Primary_Vehicle_ID', 'Home_Hub'}
    exp_vehicles = {'Vehicle_ID', 'Vehicle_Type', 'Make', 'Model', 'Manufacture_Year', 'Registration_Date', 'Odometer_KM_Start_of_Week', 'Last_Service_Date'}
    exp_trips = {'Trip_ID', 'Driver_ID', 'Vehicle_ID', 'Trip_Date', 'Start_Time', 'End_Time', 'Duration_Min', 'Distance_KM', 'Avg_Speed_kmph', 'Max_Speed_kmph'}
    exp_telemetry = {'Trip_ID', 'Driver_ID', 'Vehicle_ID', 'Timestamp', 'Speed_kmph', 'Accel_X_g', 'Accel_Y_g', 'Accel_Z_g', 'Gyro_X_dps', 'Gyro_Y_dps', 'Gyro_Z_dps'}

    missing_drv_cols = len(exp_drivers - set(drivers.columns))
    missing_veh_cols = len(exp_vehicles - set(vehicles.columns))
    missing_trp_cols = len(exp_trips - set(trips.columns))
    missing_tel_cols = len(exp_telemetry - set(telemetry.columns))

    schema_violations = missing_drv_cols + missing_veh_cols + missing_trp_cols + missing_tel_cols
    _add_check("1. Schema", "Missing Required Columns", schema_violations, 4,
               f"Missing: Drivers={missing_drv_cols}, Vehicles={missing_veh_cols}, Trips={missing_trp_cols}, Telemetry={missing_tel_cols}")

    # 2. Primary Keys Uniqueness
    drv_pk_dups = drivers['Driver_ID'].duplicated().sum()
    veh_pk_dups = vehicles['Vehicle_ID'].duplicated().sum()
    trp_pk_dups = trips['Trip_ID'].duplicated().sum()
    _add_check("2. Primary Keys", "Driver_ID PK Duplicates", drv_pk_dups, len(drivers), f"{drv_pk_dups} duplicate driver IDs")
    _add_check("2. Primary Keys", "Vehicle_ID PK Duplicates", veh_pk_dups, len(vehicles), f"{veh_pk_dups} duplicate vehicle IDs")
    _add_check("2. Primary Keys", "Trip_ID PK Duplicates", trp_pk_dups, len(trips), f"{trp_pk_dups} duplicate trip IDs")

    # 3. Telemetry Practical Composite Key (Trip_ID + Timestamp)
    tel_key_dups = telemetry.duplicated(subset=['Trip_ID', 'Timestamp']).sum()
    _add_check("3. Telemetry Composite Key", "Trip_ID + Timestamp Duplicates", tel_key_dups, len(telemetry), f"{tel_key_dups} duplicate timestamp entries per trip")

    # 4. Missing Values Audit
    drv_missing = drivers.isna().sum().sum()
    veh_missing = vehicles.isna().sum().sum()
    trp_missing = trips.isna().sum().sum()
    tel_missing = telemetry.isna().sum().sum()
    total_missing = drv_missing + veh_missing + trp_missing + tel_missing
    total_cells = drivers.size + vehicles.size + trips.size + telemetry.size
    _add_check("4. Missing Values", "Total Missing Cell Count", total_missing, total_cells, f"Drivers={drv_missing}, Vehicles={veh_missing}, Trips={trp_missing}, Telemetry={tel_missing}")

    # 5. Full Row Duplicates
    drv_row_dups = drivers.duplicated().sum()
    veh_row_dups = vehicles.duplicated().sum()
    trp_row_dups = trips.duplicated().sum()
    tel_row_dups = telemetry.duplicated().sum()
    total_row_dups = drv_row_dups + veh_row_dups + trp_row_dups + tel_row_dups
    _add_check("5. Row Duplicates", "Full Row Duplicates", total_row_dups, total_cells, f"Full row dups across all tables: {total_row_dups}")

    # 6. Foreign Key Integrity
    inv_driver_fk = (~trips['Driver_ID'].isin(drivers['Driver_ID'])).sum()
    inv_vehicle_fk = (~trips['Vehicle_ID'].isin(vehicles['Vehicle_ID'])).sum()
    inv_telemetry_fk = (~telemetry['Trip_ID'].isin(trips['Trip_ID'])).sum()
    _add_check("6. Foreign Keys", "Trips -> Drivers Foreign Key", inv_driver_fk, len(trips), f"{inv_driver_fk} unmapped Driver_IDs in Trips")
    _add_check("6. Foreign Keys", "Trips -> Vehicles Foreign Key", inv_vehicle_fk, len(trips), f"{inv_vehicle_fk} unmapped Vehicle_IDs in Trips")
    _add_check("6. Foreign Keys", "Telemetry -> Trips Foreign Key", inv_telemetry_fk, len(telemetry), f"{inv_telemetry_fk} unmapped Trip_IDs in Telemetry")

    # 7. Contextual Foreign Key Consistency
    merged_tel_trips = telemetry.merge(trips[['Trip_ID', 'Driver_ID', 'Vehicle_ID', 'Start_Time', 'End_Time']], on='Trip_ID', suffixes=('_tel', '_trip'))
    drv_mismatches = (merged_tel_trips['Driver_ID_tel'] != merged_tel_trips['Driver_ID_trip']).sum()
    veh_mismatches = (merged_tel_trips['Vehicle_ID_tel'] != merged_tel_trips['Vehicle_ID_trip']).sum()
    _add_check("7. Context Consistency", "Telemetry Driver_ID vs Trip Driver_ID", drv_mismatches, len(telemetry), f"{drv_mismatches} telemetry rows mismatched Driver_ID")
    _add_check("7. Context Consistency", "Telemetry Vehicle_ID vs Trip Vehicle_ID", veh_mismatches, len(telemetry), f"{veh_mismatches} telemetry rows mismatched Vehicle_ID")

    # 8. Timestamp Integrity & Windows
    invalid_ts = telemetry['Timestamp'].isna().sum()
    _add_check("8. Timestamp Validation", "Invalid/Unparsable Timestamps", invalid_ts, len(telemetry), f"{invalid_ts} unparsable timestamps")

    tel_window = merged_tel_trips.copy()
    tel_before_start = (tel_window['Timestamp'] < tel_window['Start_Time']).sum()
    tel_after_end = (tel_window['Timestamp'] > (tel_window['End_Time'] + pd.Timedelta(minutes=1))).sum()
    _add_check("8. Timestamp Validation", "Telemetry Before Trip Start", tel_before_start, len(telemetry), f"{tel_before_start} points recorded before trip start time")
    _add_check("8. Timestamp Validation", "Telemetry After Trip End", tel_after_end, len(telemetry), f"{tel_after_end} points recorded after trip end time")

    telemetry_sorted = telemetry.sort_values(['Trip_ID', 'Timestamp'])
    telemetry_sorted['ts_diff'] = telemetry_sorted.groupby('Trip_ID')['Timestamp'].diff().dt.total_seconds()
    irregular_gaps = (telemetry_sorted['ts_diff'] > 60).sum()
    _add_check("8. Timestamp Validation", "Telemetry Interval Gaps (>60s)", irregular_gaps, len(telemetry) - len(trips), f"{irregular_gaps} intervals exceeding 60 seconds")

    # 9. Trip Logical Sanity
    invalid_durations = (trips['Duration_Min'] <= 0).sum()
    invalid_distances = (trips['Distance_KM'] <= 0).sum()
    speed_inconsistency = (trips['Max_Speed_kmph'] < trips['Avg_Speed_kmph']).sum()
    _add_check("9. Trip Logic", "Non-positive Trip Duration", invalid_durations, len(trips), f"{invalid_durations} trips with duration <= 0")
    _add_check("9. Trip Logic", "Non-positive Trip Distance", invalid_distances, len(trips), f"{invalid_distances} trips with distance <= 0")
    _add_check("9. Trip Logic", "Max_Speed < Avg_Speed Inconsistency", speed_inconsistency, len(trips), f"{speed_inconsistency} trips with Max_Speed < Avg_Speed")

    # 10. GPS Bounds
    gps_lat_col = 'Latitude' if 'Latitude' in telemetry.columns else ('Start_Latitude' if 'Start_Latitude' in telemetry.columns else None)
    gps_lon_col = 'Longitude' if 'Longitude' in telemetry.columns else ('Start_Longitude' if 'Start_Longitude' in telemetry.columns else None)

    if gps_lat_col and gps_lon_col:
        invalid_lat = ((telemetry[gps_lat_col] < -90) | (telemetry[gps_lat_col] > 90)).sum()
        invalid_lon = ((telemetry[gps_lon_col] < -180) | (telemetry[gps_lon_col] > 180)).sum()
        _add_check("10. GPS Coordinates", "Latitude Out-of-Bounds [-90, 90]", invalid_lat, len(telemetry), f"{invalid_lat} out-of-bounds latitude values")
        _add_check("10. GPS Coordinates", "Longitude Out-of-Bounds [-180, 180]", invalid_lon, len(telemetry), f"{invalid_lon} out-of-bounds longitude values")
    else:
        invalid_lat = (((trips['Start_Latitude'] < -90) | (trips['Start_Latitude'] > 90)) | ((trips['End_Latitude'] < -90) | (trips['End_Latitude'] > 90))).sum()
        invalid_lon = (((trips['Start_Longitude'] < -180) | (trips['Start_Longitude'] > 180)) | ((trips['End_Longitude'] < -180) | (trips['End_Longitude'] > 180))).sum()
        _add_check("10. GPS Coordinates", "Trip GPS Latitude Out-of-Bounds", invalid_lat, len(trips), f"{invalid_lat} out-of-bounds trip latitudes")
        _add_check("10. GPS Coordinates", "Trip GPS Longitude Out-of-Bounds", invalid_lon, len(trips), f"{invalid_lon} out-of-bounds trip longitudes")

    # 11. Numerical Sanity & Physical Bounds
    negative_speed = (telemetry['Speed_kmph'] < 0).sum()
    implausible_speed = (telemetry['Speed_kmph'] > 150).sum()
    _add_check("11. Numerical Sanity", "Negative Telemetry Speed (< 0 km/h)", negative_speed, len(telemetry), f"{negative_speed} negative speed observations (INVALID)")
    _add_check("11. Numerical Sanity", "Implausible Telemetry Speed (> 150 km/h)", implausible_speed, len(telemetry), f"{implausible_speed} speeds above 150 km/h (INVALID)")

    # Informational Tail Audits (Candidate Extremes - NOT DELETED OR FLAGGED AS INVALID)
    accel_raw_mag = np.sqrt(telemetry['Accel_X_g']**2 + telemetry['Accel_Y_g']**2 + telemetry['Accel_Z_g']**2)
    baseline_gravity = accel_raw_mag.median()
    accel_grav_dev = np.abs(accel_raw_mag - baseline_gravity)
    p99_accel_dev = accel_grav_dev.quantile(0.99)
    accel_tail_count = (accel_grav_dev > p99_accel_dev).sum()

    gyro_mag = np.sqrt(telemetry['Gyro_X_dps']**2 + telemetry['Gyro_Y_dps']**2 + telemetry['Gyro_Z_dps']**2)
    p99_gyro = gyro_mag.quantile(0.99)
    gyro_tail_count = (gyro_mag > p99_gyro).sum()

    _add_check("11. Numerical Sanity", "Candidate Accel Tail (> P99 Gravity Dev)", accel_tail_count, len(telemetry),
               f"{accel_tail_count} points in top 1% acceleration deviation tail (Preserved as candidate extreme, NOT invalid)", is_warning_only=True)
    _add_check("11. Numerical Sanity", "Candidate Gyro Tail (> P99 Gyro Rate)", gyro_tail_count, len(telemetry),
               f"{gyro_tail_count} points in top 1% rotational rate tail (Preserved as candidate extreme, NOT invalid)", is_warning_only=True)

    report_df = pd.DataFrame(results)

    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        csv_path = os.path.join(output_dir, "validation_report.csv")
        report_df.to_csv(csv_path, index=False)

        md_path = os.path.join(output_dir, "validation_report.md")
        with open(md_path, "w", encoding="utf-8") as f:
            f.write("# Vexar Fleet Intelligence - Data Validation Report\n\n")
            f.write("| Category | Check Name | Violation Count | Total Evaluated | Violation Pct (%) | Status | Details |\n")
            f.write("| :--- | :--- | :---: | :---: | :---: | :---: | :--- |\n")
            for _, row in report_df.iterrows():
                f.write(f"| {row['Category']} | {row['Check_Name']} | {row['Violation_Count']} | {row['Total_Evaluated']} | {row['Violation_Pct']:.4f}% | **{row['Status']}** | {row['Details']} |\n")

    return report_df

