# Vexar Fleet Intelligence - Stage 3 Comprehensive Modeling Report

**Author**: Antigravity Data Science & Engineering Team  
**Phase**: Stage 3 (Modeling & Intelligence Layer)  

---

## 1. Executive Summary

Stage 3 completes the implementation of the **Vexar Fleet Intelligence Engine**, transforming raw preprocessed telemetry and trip data into explainable **Driver Behaviour Intelligence** and **Vehicle Health Intelligence**.

### Key System Achievements:
- **Processed Entities**: Exactly 30 Drivers (450 trips) and 30 Vehicles (450 trips).
- **Primary Hybrid Scoring**: 70% Interpretable Fleet-Relative Percentiles + 30% Secondary Isolation Forest Score.
- **Model Stability**: Bootstrap resampling stability achieved $r = 0.8013$ (Drivers) and $r = 0.6870$ (Vehicles).
- **Evidence-Based Attribution**: 3 Driver-Linked Patterns, 17 Vehicle-Linked Patterns, 1 Joint Pattern, and 56 Insufficient Evidence Isolated Trips identified.
- **100% Automated Assertion Coverage**: All 10 Stage 3 model validation tests passed. Zero NaNs, zero demographic variables used, and zero causal claims made.

---

## 2. Top Scored Drivers (Behavioral Signals)

| Rank | Driver ID | Driver Name | Hybrid Signal | Interpretable | Isolation | Evidence Strength | Attribution | Recommended Action |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | D23 | Kavya Pillai | **93.2** | 94.7 | 89.7 | HIGH | VEHICLE-LINKED PATTERN | **Behavioral Coaching Review** |
| 2 | D19 | Senthil Pillai | **93.1** | 91.6 | 96.6 | HIGH | INSUFFICIENT EVIDENCE FOR ATTRIBUTION | **Behavioral Coaching Review** |
| 3 | D14 | Rajesh Subramaniam | **84.8** | 90.2 | 72.4 | HIGH | INSUFFICIENT EVIDENCE FOR ATTRIBUTION | **Behavioral Coaching Review** |
| 4 | D06 | Bhavani Raj | **83.8** | 79.8 | 93.1 | HIGH | INSUFFICIENT EVIDENCE FOR ATTRIBUTION | **Behavioral Coaching Review** |
| 5 | D24 | Lakshmi Iyer | **83.8** | 82.8 | 86.2 | HIGH | DRIVER-LINKED PATTERN | **Focused Coaching Review** |

---

## 3. Top Scored Vehicles (Health Inspection Signals)

| Rank | Vehicle ID | Make / Model | Hybrid Signal | Interpretable | Isolation | Days Since Service | Attribution | Recommended Action |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | V02 | TVS Raider | **94.6** | 92.2 | 100.0 | 86d | VEHICLE-LINKED PATTERN | **Priority Mechanical / Suspension Inspection** |
| 2 | V19 | TVS Ntorq | **88.7** | 86.8 | 93.1 | 42d | VEHICLE-LINKED PATTERN | **Priority Mechanical / Suspension Inspection** |
| 3 | V14 | TVS Raider | **79.9** | 72.8 | 96.6 | 5d | VEHICLE-LINKED PATTERN | **Priority Mechanical / Suspension Inspection** |
| 4 | V23 | Suzuki Access | **79.7** | 88.8 | 58.6 | 45d | VEHICLE-LINKED PATTERN | **Priority Mechanical / Suspension Inspection** |
| 5 | V12 | TVS Ntorq | **76.1** | 74.8 | 79.3 | 52d | INSUFFICIENT EVIDENCE FOR ATTRIBUTION | **Routine Fleet Service Inspection** |

---

## 4. System Limitations

1. **Short Observation Period**: 7 days of monitoring is insufficient for long-term wear modeling or seasonal trend extrapolation.
2. **Absence of Ground-Truth Labels**: Zero accident or maintenance failure logs mandate unsupervised relative-risk framing rather than failure probability estimation.
3. **1-Minute Telemetry Resolution**: High-frequency sub-second transient shocks are averaged over 60-second intervals.
