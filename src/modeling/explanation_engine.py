"""
Module: explanation_engine.py
Description: Deterministic Data-Driven Explanation Generator for Vexar Fleet Intelligence.
Generates human-readable, fully reproducible explanations for Driver Behaviour and Vehicle Inspection signals.
Strictly template-driven (NO LLMs). Enforces non-causal operational wording.
"""

import pandas as pd
from typing import Dict, Any, Tuple


def generate_driver_explanations(driver_df: pd.DataFrame) -> pd.DataFrame:
    """
    Generates primary reason, secondary reason, and operational explanation strings for drivers.

    Parameters:
    -----------
    driver_df : pd.DataFrame
        Scored driver intelligence DataFrame.

    Returns:
    --------
    pd.DataFrame
        Updated DataFrame with primary_reason, secondary_reason, evidence_summary, and operational_explanation.
    """
    df = driver_df.copy()

    primary_reasons = []
    secondary_reasons = []
    evidence_summaries = []
    explanations = []

    for _, row in df.iterrows():
        # Component comparison to identify dominant driver signals
        comps = {
            "speed instability": row['comp_speed_instability_pct'],
            "sustained upper-tail speed": row['comp_speed_tail_pct'],
            "acceleration deviation": row['comp_accel_signal_pct'],
            "rotational rate": row['comp_gyro_signal_pct'],
            "exposure-normalized extreme rate": row['comp_exposure_event_pct'],
            "temporal persistence": row['comp_persistence_pct']
        }
        sorted_comps = sorted(comps.items(), key=lambda x: x[1], reverse=True)
        top1_name, top1_val = sorted_comps[0]
        top2_name, top2_val = sorted_comps[1]

        primary = f"{top1_name.title()} is at the {top1_val:.1f}th fleet percentile ({row['accel_extremes_per_hour']:.2f} accel extremes/hr)."
        secondary = f"{top2_name.title()} is elevated at the {top2_val:.1f}th fleet percentile."

        ev_text = f"Evidence strength is {row['driver_evidence_strength']} based on {row['elevated_days']}/{row['active_days']} elevated active days ({row['elevated_day_ratio']*100:.1f}% ratio) across {row['unique_vehicles_used']} vehicles."

        # Non-causal operational interpretation
        if row['hybrid_signal'] >= 75.0:
            interp = f"Observed telemetry patterns reflect high fleet-relative variability ({row['percentile_rank']:.1f}th percentile). Evidence is {row['driver_evidence_strength'].lower()} and {row['driver_attribution'].lower()}. Recommend behavioral coaching review."
        elif row['hybrid_signal'] >= 50.0:
            interp = f"Observed telemetry patterns reflect moderate fleet-relative variability ({row['percentile_rank']:.1f}th percentile). Recommend routine performance monitoring."
        else:
            interp = f"Driver operates within baseline fleet parameters ({row['percentile_rank']:.1f}th percentile). Standard operational monitoring."

        primary_reasons.append(primary)
        secondary_reasons.append(secondary)
        evidence_summaries.append(ev_text)
        explanations.append(interp)

    df['primary_reason'] = primary_reasons
    df['secondary_reason'] = secondary_reasons
    df['evidence_summary'] = evidence_summaries
    df['operational_explanation'] = explanations

    return df


def generate_vehicle_explanations(vehicle_df: pd.DataFrame) -> pd.DataFrame:
    """
    Generates primary reason, secondary reason, contextual maintenance note, and operational explanation strings for vehicles.

    Parameters:
    -----------
    vehicle_df : pd.DataFrame
        Scored vehicle intelligence DataFrame.

    Returns:
    --------
    pd.DataFrame
        Updated DataFrame with primary_reason, secondary_reason, maintenance_context_note, and operational_explanation.
    """
    df = vehicle_df.copy()

    primary_reasons = []
    secondary_reasons = []
    maint_notes = []
    explanations = []

    for _, row in df.iterrows():
        # Component comparison for vehicle signals
        comps = {
            "acceleration vibration deviation": row['comp_accel_vibration_pct'],
            "exposure-normalized extreme vibration rate": row['comp_accel_extreme_rate_pct'],
            "rotational rate": row['comp_gyro_rotational_pct'],
            "multi-driver recurring signal": row['comp_cross_driver_pct']
        }
        sorted_comps = sorted(comps.items(), key=lambda x: x[1], reverse=True)
        top1_name, top1_val = sorted_comps[0]
        top2_name, top2_val = sorted_comps[1]

        primary = f"{top1_name.title()} is at the {top1_val:.1f}th fleet percentile ({row['accel_extremes_per_hour']:.2f} vibration extremes/hr)."
        secondary = f"{top2_name.title()} is elevated at the {top2_val:.1f}th fleet percentile across {row['unique_drivers_count']} drivers."

        maint_text = f"Contextual Maintenance: Last service was {row['days_since_last_service']} days ago (Vehicle Age: {row['vehicle_age_years']} yrs, Odometer: {row['Odometer_KM_Start_of_Week']:,.0f} km)."

        # Non-causal operational interpretation (never claims vehicle is faulty)
        if row['hybrid_signal'] >= 75.0:
            interp = f"Observed telemetry patterns are elevated relative to fleet baseline ({row['percentile_rank']:.1f}th percentile). Pattern recurrence across {row['unique_drivers_count']} drivers makes it more consistent with a vehicle-linked signal. Recommend inspection."
        elif row['hybrid_signal'] >= 50.0:
            interp = f"Observed telemetry patterns reflect moderate fleet-relative variation ({row['percentile_rank']:.1f}th percentile). Recommend routine fleet service inspection."
        else:
            interp = f"Vehicle operates within normal baseline telemetry parameters ({row['percentile_rank']:.1f}th percentile). Standard routine monitoring."

        primary_reasons.append(primary)
        secondary_reasons.append(secondary)
        maint_notes.append(maint_text)
        explanations.append(interp)

    df['primary_reason'] = primary_reasons
    df['secondary_reason'] = secondary_reasons
    df['maintenance_context_note'] = maint_notes
    df['operational_explanation'] = explanations

    return df
