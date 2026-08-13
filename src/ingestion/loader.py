"""
Module: loader.py
Description: Reproducible Data Ingestion pipeline for Vexar Fleet Intelligence.
Loads raw Excel workbook or CSV data into clean pandas DataFrames with explicit data typing.
"""

import os
from dataclasses import dataclass
import pandas as pd


@dataclass
class FleetDataset:
    drivers: pd.DataFrame
    vehicles: pd.DataFrame
    trips: pd.DataFrame
    telemetry: pd.DataFrame


def _find_header_row(df_raw: pd.DataFrame, target_col: str) -> int:
    """Finds the 0-indexed row number containing the target column header."""
    for idx, row in df_raw.iterrows():
        row_vals = [str(val).strip() for val in row.values]
        if target_col in row_vals:
            return idx
    return 0


def load_dataset(source_path: str = None) -> FleetDataset:
    """
    Loads all four primary entities (Drivers, Vehicles, Trips, Telemetry) reproducibly.
    Supports Excel workbook (.xlsx) or CSV directory / CSV files.

    Parameters:
    -----------
    source_path : str, optional
        Path to raw Excel workbook or raw data directory.

    Returns:
    --------
    FleetDataset
        Dataclass containing drivers, vehicles, trips, and telemetry DataFrames.
    """
    if source_path is None or not os.path.exists(source_path):
        # Default fallback paths
        possible_paths = [
            os.path.join("data", "raw", "VEXAR_Fleet_Dataset_CANDIDATE_VERSION.xlsx"),
            os.path.join("assignment", "official_workbook.xlsx"),
            os.path.join("..", "data", "raw", "VEXAR_Fleet_Dataset_CANDIDATE_VERSION.xlsx"),
            os.path.join("..", "assignment", "official_workbook.xlsx")
        ]
        found_path = None
        for p in possible_paths:
            if os.path.exists(p):
                found_path = p
                break
        if found_path is None:
            raise FileNotFoundError(f"Source data file not found at any known relative path.")
        source_path = found_path

    if source_path.endswith('.xlsx'):
        xls = pd.ExcelFile(source_path)

        # 1. Drivers
        df_drivers_raw = pd.read_excel(xls, 'Drivers', header=None)
        h_drivers = _find_header_row(df_drivers_raw, 'Driver_ID')
        drivers = pd.read_excel(xls, 'Drivers', skiprows=h_drivers)
        drivers.columns = [str(c).strip() for c in drivers.columns]
        drivers = drivers.dropna(how='all')

        # 2. Vehicles
        df_vehicles_raw = pd.read_excel(xls, 'Vehicles', header=None)
        h_vehicles = _find_header_row(df_vehicles_raw, 'Vehicle_ID')
        vehicles = pd.read_excel(xls, 'Vehicles', skiprows=h_vehicles)
        vehicles.columns = [str(c).strip() for c in vehicles.columns]
        vehicles = vehicles.dropna(how='all')

        # 3. Trips
        df_trips_raw = pd.read_excel(xls, 'Trips', header=None)
        h_trips = _find_header_row(df_trips_raw, 'Trip_ID')
        trips = pd.read_excel(xls, 'Trips', skiprows=h_trips)
        trips.columns = [str(c).strip() for c in trips.columns]
        trips = trips.dropna(how='all')

        # 4. Telemetry
        df_telemetry_raw = pd.read_excel(xls, 'Telemetry', header=None)
        h_telemetry = _find_header_row(df_telemetry_raw, 'Trip_ID')
        telemetry = pd.read_excel(xls, 'Telemetry', skiprows=h_telemetry)
        telemetry.columns = [str(c).strip() for c in telemetry.columns]
        telemetry = telemetry.dropna(how='all')

    elif os.path.isdir(source_path):
        drivers = pd.read_csv(os.path.join(source_path, 'drivers.csv'))
        vehicles = pd.read_csv(os.path.join(source_path, 'vehicles.csv'))
        trips = pd.read_csv(os.path.join(source_path, 'trips.csv'))
        telemetry = pd.read_csv(os.path.join(source_path, 'telemetry.csv'))
    else:
        raise ValueError(f"Unsupported source_path format: {source_path}")

    # Explicit Type Casting
    drivers['Driver_ID'] = drivers['Driver_ID'].astype(str)
    drivers['Driver_Name'] = drivers['Driver_Name'].astype(str)
    drivers['Age'] = pd.to_numeric(drivers['Age'], errors='coerce').astype('Int64')
    drivers['Gender'] = drivers['Gender'].astype('category')
    drivers['License_Experience_Years'] = pd.to_numeric(drivers['License_Experience_Years'], errors='coerce').astype('Int64')
    drivers['Date_Joined_Fleet'] = pd.to_datetime(drivers['Date_Joined_Fleet'], errors='coerce')
    drivers['Primary_Vehicle_ID'] = drivers['Primary_Vehicle_ID'].astype(str)
    drivers['Home_Hub'] = drivers['Home_Hub'].astype('category')

    vehicles['Vehicle_ID'] = vehicles['Vehicle_ID'].astype(str)
    vehicles['Vehicle_Type'] = vehicles['Vehicle_Type'].astype('category')
    vehicles['Make'] = vehicles['Make'].astype('category')
    vehicles['Model'] = vehicles['Model'].astype('category')
    vehicles['Manufacture_Year'] = pd.to_numeric(vehicles['Manufacture_Year'], errors='coerce').astype('Int64')
    vehicles['Registration_Date'] = pd.to_datetime(vehicles['Registration_Date'], errors='coerce')
    vehicles['Odometer_KM_Start_of_Week'] = pd.to_numeric(vehicles['Odometer_KM_Start_of_Week'], errors='coerce')
    vehicles['Last_Service_Date'] = pd.to_datetime(vehicles['Last_Service_Date'], errors='coerce')

    trips['Trip_ID'] = trips['Trip_ID'].astype(str)
    trips['Driver_ID'] = trips['Driver_ID'].astype(str)
    trips['Vehicle_ID'] = trips['Vehicle_ID'].astype(str)
    trips['Trip_Date'] = pd.to_datetime(trips['Trip_Date'], errors='coerce').dt.date

    def parse_trip_timestamp(row, time_col):
        val = row[time_col]
        if pd.isna(val):
            return pd.NaT
        if isinstance(val, str):
            return pd.to_datetime(f"{row['Trip_Date']} {val}", errors='coerce')
        if hasattr(val, 'strftime'):
            return pd.to_datetime(f"{row['Trip_Date']} {val.strftime('%H:%M:%S')}", errors='coerce')
        return pd.to_datetime(val, errors='coerce')

    trips['Start_Time'] = trips.apply(lambda r: parse_trip_timestamp(r, 'Start_Time'), axis=1)
    trips['End_Time'] = trips.apply(lambda r: parse_trip_timestamp(r, 'End_Time'), axis=1)
    trips['Duration_Min'] = pd.to_numeric(trips['Duration_Min'], errors='coerce')
    trips['Distance_KM'] = pd.to_numeric(trips['Distance_KM'], errors='coerce')
    trips['Avg_Speed_kmph'] = pd.to_numeric(trips['Avg_Speed_kmph'], errors='coerce')
    trips['Max_Speed_kmph'] = pd.to_numeric(trips['Max_Speed_kmph'], errors='coerce')
    trips['Start_Latitude'] = pd.to_numeric(trips.get('Start_Latitude', trips.get('start_latitude')), errors='coerce')
    trips['Start_Longitude'] = pd.to_numeric(trips.get('Start_Longitude', trips.get('start_longitude')), errors='coerce')
    trips['End_Latitude'] = pd.to_numeric(trips.get('End_Latitude', trips.get('end_latitude')), errors='coerce')
    trips['End_Longitude'] = pd.to_numeric(trips.get('End_Longitude', trips.get('end_longitude')), errors='coerce')

    telemetry['Trip_ID'] = telemetry['Trip_ID'].astype(str)
    telemetry['Driver_ID'] = telemetry['Driver_ID'].astype(str)
    telemetry['Vehicle_ID'] = telemetry['Vehicle_ID'].astype(str)
    telemetry['Timestamp'] = pd.to_datetime(telemetry['Timestamp'], errors='coerce')
    telemetry['Speed_kmph'] = pd.to_numeric(telemetry['Speed_kmph'], errors='coerce')
    telemetry['Accel_X_g'] = pd.to_numeric(telemetry['Accel_X_g'], errors='coerce')
    telemetry['Accel_Y_g'] = pd.to_numeric(telemetry['Accel_Y_g'], errors='coerce')
    telemetry['Accel_Z_g'] = pd.to_numeric(telemetry['Accel_Z_g'], errors='coerce')
    telemetry['Gyro_X_dps'] = pd.to_numeric(telemetry['Gyro_X_dps'], errors='coerce')
    telemetry['Gyro_Y_dps'] = pd.to_numeric(telemetry['Gyro_Y_dps'], errors='coerce')
    telemetry['Gyro_Z_dps'] = pd.to_numeric(telemetry['Gyro_Z_dps'], errors='coerce')
    if 'Latitude' in telemetry.columns:
        telemetry['Latitude'] = pd.to_numeric(telemetry['Latitude'], errors='coerce')
    if 'Longitude' in telemetry.columns:
        telemetry['Longitude'] = pd.to_numeric(telemetry['Longitude'], errors='coerce')

    return FleetDataset(
        drivers=drivers,
        vehicles=vehicles,
        trips=trips,
        telemetry=telemetry
    )


def export_raw_csv_files(dataset: FleetDataset, raw_dir: str):
    """Exports CSV copies of all four primary tables to raw data directory."""
    os.makedirs(raw_dir, exist_ok=True)
    dataset.drivers.to_csv(os.path.join(raw_dir, 'drivers.csv'), index=False)
    dataset.vehicles.to_csv(os.path.join(raw_dir, 'vehicles.csv'), index=False)
    dataset.trips.to_csv(os.path.join(raw_dir, 'trips.csv'), index=False)
    dataset.telemetry.to_csv(os.path.join(raw_dir, 'telemetry.csv'), index=False)

