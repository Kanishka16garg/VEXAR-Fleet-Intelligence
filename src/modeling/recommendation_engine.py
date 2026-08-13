"""
Module: recommendation_engine.py
Description: Operational Action Recommendation Engine for Vexar Fleet Intelligence.
Translates hybrid intelligence signals, evidence strength, temporal persistence, and attribution into actionable operational decisions.
"""

import pandas as pd
from typing import Tuple, Dict, Any



def derive_driver_recommendation(row: pd.Series) -> str:
    """
    Derives operational recommendation for a driver based on signal, evidence, persistence, and attribution.
    """
    signal = row['hybrid_signal']
    evidence = row['driver_evidence_strength']
    attr = row['driver_attribution']

    if signal >= 75.0 and evidence == "HIGH" and attr in ["DRIVER-LINKED PATTERN", "JOINT DRIVER-VEHICLE CO-OCCURRENCE"]:
        return "Focused Coaching Review"
    elif signal >= 60.0 and evidence in ["HIGH", "MEDIUM"]:
        return "Behavioral Coaching Review"
    elif signal >= 40.0:
        return "Routine Performance Monitoring"
    else:
        return "Standard Monitoring / Low Evidence"


def derive_vehicle_recommendation(row: pd.Series) -> str:
    """
    Derives operational recommendation for a vehicle based on signal, evidence, service recency, and attribution.
    """
    signal = row['hybrid_signal']
    evidence = row['vehicle_evidence_strength']
    attr = row['vehicle_attribution']
    service_days = row['days_since_last_service']

    if signal >= 75.0 and evidence == "HIGH" and (attr == "VEHICLE-LINKED PATTERN" or service_days > 180):
        return "Priority Mechanical / Suspension Inspection"
    elif signal >= 60.0 and evidence in ["HIGH", "MEDIUM"]:
        return "Routine Fleet Service Inspection"
    elif signal >= 40.0:
        return "Routine Fleet Monitoring"
    else:
        return "Standard Monitoring / Insufficient Evidence"


def apply_recommendations(driver_df: pd.DataFrame, vehicle_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Applies recommendation rules across driver and vehicle DataFrames."""
    d_df = driver_df.copy()
    v_df = vehicle_df.copy()

    d_df['recommended_action'] = d_df.apply(derive_driver_recommendation, axis=1)
    v_df['recommended_action'] = v_df.apply(derive_vehicle_recommendation, axis=1)

    return d_df, v_df
