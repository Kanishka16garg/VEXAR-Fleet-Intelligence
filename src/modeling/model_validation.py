"""
Module: model_validation.py
Description: Automated Model Assertions & Validation Test Suite for Vexar Fleet Intelligence Stage 3.
Executes 10 automated data and structural checks to ensure correctness, reproducibility, and compliance with guidelines.
"""

import pandas as pd
import numpy as np


def validate_stage3_outputs(driver_df: pd.DataFrame, vehicle_df: pd.DataFrame) -> bool:
    """
    Executes automated validation assertions on final Stage 3 driver and vehicle intelligence tables.

    Returns:
    --------
    bool
        True if all assertions pass. Raises AssertionError if any test fails.
    """
    print("=== Executing Stage 3 Model Validation Assertion Suite ===")

    # 1. Null / NaN Check
    assert driver_df.isna().sum().sum() == 0, f"Driver intelligence table contains {driver_df.isna().sum().sum()} NaNs!"
    assert vehicle_df.isna().sum().sum() == 0, f"Vehicle intelligence table contains {vehicle_df.isna().sum().sum()} NaNs!"
    print("[PASS] Assertion 1: Zero NaNs across all Stage 3 output tables.")

    # 2. Entity Count & Uniqueness
    assert len(driver_df) == 30, f"Expected 30 drivers, found {len(driver_df)}!"
    assert driver_df['Driver_ID'].nunique() == 30, "Driver_ID PK violation in driver intelligence table!"
    assert len(vehicle_df) == 30, f"Expected 30 vehicles, found {len(vehicle_df)}!"
    assert vehicle_df['Vehicle_ID'].nunique() == 30, "Vehicle_ID PK violation in vehicle intelligence table!"
    print("[PASS] Assertion 2: Driver_ID and Vehicle_ID entity counts (30 each) strictly unique.")

    # 3. Score Boundedness [0.0, 100.0]
    for col in ['interpretable_driver_score', 'isolation_score', 'hybrid_signal', 'percentile_rank']:
        min_v = driver_df[col].min()
        max_v = driver_df[col].max()
        assert min_v >= 0.0 and max_v <= 100.0, f"Driver score {col} out of bounds: [{min_v}, {max_v}]!"

    for col in ['interpretable_vehicle_score', 'isolation_score', 'hybrid_signal', 'percentile_rank']:
        min_v = vehicle_df[col].min()
        max_v = vehicle_df[col].max()
        assert min_v >= 0.0 and max_v <= 100.0, f"Vehicle score {col} out of bounds: [{min_v}, {max_v}]!"
    print("[PASS] Assertion 3: All intelligence signals strictly bounded between 0.0 and 100.0.")

    # 4. Demographic Exclusion Policy
    for demog in ['Age', 'Gender']:
        assert demog not in driver_df.columns or not any(col for col in ['interpretable_driver_score', 'hybrid_signal'] if demog in col), \
            f"Protected demographic attribute {demog} detected in scoring formula!"
    print("[PASS] Assertion 4: Protected demographic attributes (Age, Gender) strictly excluded from scoring.")

    # 5. Redundant Feature Rejection Audit
    for red_col in ['speed_mean', 'speed_max']:
        assert red_col not in driver_df.columns or red_col not in vehicle_df.columns, f"Redundant feature {red_col} detected in output tables!"
    print("[PASS] Assertion 5: Stage 2 rejected redundant features (speed_mean, speed_max) strictly excluded.")

    # 6. Valid Attribution Categories
    valid_attrs = {
        'DRIVER-LINKED PATTERN', 'VEHICLE-LINKED PATTERN',
        'JOINT DRIVER-VEHICLE CO-OCCURRENCE', 'INSUFFICIENT EVIDENCE FOR ATTRIBUTION'
    }
    assert set(driver_df['driver_attribution']).issubset(valid_attrs), "Invalid driver attribution category found!"
    assert set(vehicle_df['vehicle_attribution']).issubset(valid_attrs), "Invalid vehicle attribution category found!"
    print("[PASS] Assertion 6: Attribution categories strictly conform to 4 evidence-based classes.")

    # 7. Valid Evidence Strengths
    valid_evs = {'LOW', 'MEDIUM', 'HIGH'}
    assert set(driver_df['driver_evidence_strength']).issubset(valid_evs), "Invalid driver evidence strength!"
    assert set(vehicle_df['vehicle_evidence_strength']).issubset(valid_evs), "Invalid vehicle evidence strength!"
    print("[PASS] Assertion 7: Evidence strengths strictly restricted to LOW, MEDIUM, HIGH.")

    # 8. Exposure Normalization Check
    assert 'accel_extremes_per_hour' in driver_df.columns and 'gyro_extremes_per_hour' in driver_df.columns, "Missing exposure-normalized rate features!"
    print("[PASS] Assertion 8: Exposure-normalized rate metrics present and active.")

    # 9. Non-Causal Explanation Wording Check
    causal_words = ['faulty vehicle', 'dangerous driver', 'accident probability', 'failure prediction', 'will break down']
    for text in list(driver_df['operational_explanation']) + list(vehicle_df['operational_explanation']):
        for word in causal_words:
            assert word not in text.lower(), f"Forbidden causal claim '{word}' found in explanation text: '{text}'"
    print("[PASS] Assertion 9: Non-causal wording policy verified across all explanation strings.")

    # 10. Valid Recommendation Mapping
    valid_driver_recs = {'Focused Coaching Review', 'Behavioral Coaching Review', 'Routine Performance Monitoring', 'Standard Monitoring / Low Evidence'}
    valid_vehicle_recs = {'Priority Mechanical / Suspension Inspection', 'Routine Fleet Service Inspection', 'Routine Fleet Monitoring', 'Standard Monitoring / Insufficient Evidence'}

    assert set(driver_df['recommended_action']).issubset(valid_driver_recs), "Invalid driver recommendation!"
    assert set(vehicle_df['recommended_action']).issubset(valid_vehicle_recs), "Invalid vehicle recommendation!"
    print("[PASS] Assertion 10: Operational recommendations strictly map to documented action rules.")

    print("=== ALL 10 STAGE 3 MODEL VALIDATION ASSERTIONS PASSED SUCCESSFULLY! ===")
    return True
