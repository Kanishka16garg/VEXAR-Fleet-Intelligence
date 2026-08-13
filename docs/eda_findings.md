# Vexar Fleet Intelligence - Comprehensive EDA & Data Validation Report

**Author**: Antigravity Data Science & Engineering Team  
**Phase**: Stage 2 (Data Engineering + Exploratory Data Analysis)  
**Target Organization**: VexarDrive Technologies Internship Selection Assignment  

---

## 1. Input Files Detected

The ingestion pipeline detects and supports both raw Excel workbooks and raw CSV table directories:
- **Primary Source Workbook**: `data/raw/VEXAR_Fleet_Dataset_CANDIDATE_VERSION.xlsx` / `assignment/official_workbook.xlsx`.
- **Exported CSV Tables**: `data/raw/drivers.csv`, `data/raw/vehicles.csv`, `data/raw/trips.csv`, `data/raw/telemetry.csv`.
- All four core entities (`Drivers`, `Vehicles`, `Trips`, `Telemetry`) were successfully parsed and validated.

---

## 2. Dataset Row Counts & Schema Dimensions

The dataset represents continuous minute-by-minute monitoring of an urban commercial two-wheeler/rider fleet over a 7-day observation window (`2026-07-31` to `2026-08-06`).

| Dataset Entity | Record Count | Column Count | Evaluated Cells | Key Attributes |
| :--- | :---: | :---: | :---: | :--- |
| **Drivers** | 30 | 8 | 240 | `Driver_ID`, `Age`, `Gender`, `License_Experience_Years`, `Date_Joined_Fleet`, `Primary_Vehicle_ID`, `Home_Hub` |
| **Vehicles** | 30 | 8 | 240 | `Vehicle_ID`, `Vehicle_Type`, `Make`, `Model`, `Manufacture_Year`, `Registration_Date`, `Odometer_KM_Start_of_Week`, `Last_Service_Date` |
| **Trips** | 450 | 14 | 6,300 | `Trip_ID`, `Driver_ID`, `Vehicle_ID`, `Trip_Date`, `Start_Time`, `End_Time`, `Duration_Min`, `Distance_KM`, `Avg_Speed_kmph`, `Max_Speed_kmph`, Coordinates |
| **Telemetry** | 12,987 | 13 | 168,831 | `Trip_ID`, `Driver_ID`, `Vehicle_ID`, `Timestamp`, `Speed_kmph`, `Accel_X_g`, `Accel_Y_g`, `Accel_Z_g`, `Gyro_X_dps`, `Gyro_Y_dps`, `Gyro_Z_dps` |
| **TOTAL FLEET DATASET** | **13,497** | — | **175,611** | **100% Evaluated Cell Coverage** |

---

## 3. Data Validation Results Summary

An automated 11-step validation pipeline was executed on the dataset. All 11 validation categories returned **PASS** status across all 175,611 evaluated dataset cells.

| Category | Check Executed | Violation Count | Total Evaluated | Violation Pct (%) | Status | Details |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **1. Schema** | Missing Required Columns | 0 | 4 tables | 0.0000% | **PASS** | All expected columns present with valid dtypes |
| **2. Primary Keys** | PK Uniqueness (Driver, Vehicle, Trip) | 0 | 510 IDs | 0.0000% | **PASS** | `Driver_ID`, `Vehicle_ID`, `Trip_ID` strictly unique |
| **3. Composite Key** | Telemetry `Trip_ID + Timestamp` | 0 | 12,987 rows | 0.0000% | **PASS** | Zero duplicate timestamps per trip |
| **4. Missing Values** | Cell-level Null Audit | 0 | 175,611 cells | 0.0000% | **PASS** | 100% complete dataset |
| **5. Duplicates** | Full Row Duplicates | 0 | 175,611 cells | 0.0000% | **PASS** | Zero duplicate records across all tables |
| **6. Foreign Keys** | FK Validity (Trips & Telemetry) | 0 | 13,887 references | 0.0000% | **PASS** | All foreign key constraints satisfied |
| **7. Context Consistency** | Telemetry vs Trip Driver/Vehicle ID | 0 | 12,987 rows | 0.0000% | **PASS** | Zero context mismatches between Telemetry and Trips |
| **8. Timestamps** | Out-of-bounds / Gap Audit (>60s) | 0 | 12,987 timestamps | 0.0000% | **PASS** | Telemetry strictly bounded; 0 gaps > 60s |
| **9. Trip Logic** | Non-positive Duration/Distance, Speed | 0 | 450 trips | 0.0000% | **PASS** | `Duration > 0`, `Distance > 0`, `Max_Speed >= Avg_Speed` |
| **10. GPS Bounds** | Lat $[-90, 90]$, Lon $[-180, 180]$ | 0 | 12,987 points | 0.0000% | **PASS** | All GPS coordinates valid within urban bounds |
| **11. Physical Sanity** | Speed $[0, 150]$ km/h, Extreme Sensors | 0 | 12,987 points | 0.0000% | **PASS** | Zero negative/implausible speeds. Extremes preserved |

---

## 4. Missing Values Audit

- **Drivers Table**: 0 missing values out of 240 cells ($0.00\%$).
- **Vehicles Table**: 0 missing values out of 240 cells ($0.00\%$).
- **Trips Table**: 0 missing values out of 6,300 cells ($0.00\%$).
- **Telemetry Table**: 0 missing values out of 168,831 cells ($0.00\%$).
- **Total Missing Cells**: 0 out of 175,611 total dataset cells ($0.00\%$).

---

## 5. Duplicate Findings

- **Primary Key Duplicates**: `Driver_ID` (0), `Vehicle_ID` (0), `Trip_ID` (0).
- **Composite Key Duplicates**: `Trip_ID + Timestamp` duplicate count = 0.
- **Full Row Duplicates**: 0 duplicate rows across all tables.

---

## 6. Foreign-Key Findings

- **Trips $\rightarrow$ Drivers**: 450 / 450 foreign key references valid ($100.00\%$).
- **Trips $\rightarrow$ Vehicles**: 450 / 450 foreign key references valid ($100.00\%$).
- **Telemetry $\rightarrow$ Trips**: 12,987 / 12,987 foreign key references valid ($100.00\%$).
- **Contextual Redundancy Audit**: Zero mismatches between `Telemetry.Driver_ID` / `Telemetry.Vehicle_ID` and the referenced `Trips` row.

---

## 7. Timestamp Findings

- **Unparsable Timestamps**: 0 ($0.00\%$).
- **Telemetry Before Trip Start**: 0 points recorded prior to `Start_Time`.
- **Telemetry After Trip End**: 0 points recorded after `End_Time` (allowing 1-minute boundary buffer).
- **Telemetry Interval Continuity**: Exactly 12,537 sequential intervals evaluated. 0 intervals exceeded 60 seconds.

---

## 8. Speed Telemetry Findings

From 12,987 minute-by-minute speed measurements across the fleet:

$$\text{Mean} = 24.19\text{ km/h}, \quad \text{Median} = 24.90\text{ km/h}, \quad \text{Std Dev} = 11.32\text{ km/h}$$

### Speed Tail Distribution:
- **Minimum**: $0.00\text{ km/h}$
- **P25**: $17.80\text{ km/h}$
- **P50 (Median)**: $24.90\text{ km/h}$
- **P75**: $31.50\text{ km/h}$
- **P90**: $37.40\text{ km/h}$
- **P95**: $41.80\text{ km/h}$
- **P99**: $51.30\text{ km/h}$
- **Maximum**: $73.60\text{ km/h}$

*Sequential Speed Change ($\Delta \text{speed} = \text{speed}_t - \text{speed}_{t-1}$)*:
- Mean: $+0.002\text{ km/h/min}$
- P05 (Deceleration tail): $-8.10\text{ km/h/min}$
- P95 (Acceleration tail): $+8.20\text{ km/h/min}$

---

## 9. Accelerometer Findings (Nominal Gravity Deviation)

3-axis accelerometers capture static Earth gravity alongside kinetic vehicle motion.
Raw magnitude $||A_{\text{raw}}|| = \sqrt{A_x^2 + A_y^2 + A_z^2}$ exhibits an empirical baseline median of:

$$\text{Baseline Gravity Median} = 1.0086\text{ g}$$

To quantify dynamic motion shocks without making unverified assumptions about phone orientation or sensor axis alignment, we derived the **acceleration magnitude deviation from nominal gravity**:

$$||A_{\text{grav\_dev}}|| = | ||A_{\text{raw}}|| - 1.0086 |$$

### Gravity Deviation Distribution:
- **Mean**: $0.0471\text{ g}$
- **Median**: $0.0299\text{ g}$
- **Std Dev**: $0.0730\text{ g}$
- **P90**: $0.0888\text{ g}$
- **P95**: $0.1365\text{ g}$
- **P99**: $0.4188\text{ g}$
- **Maximum**: $0.9590\text{ g}$

> [!NOTE]
> **Proxy Documentation**: Scalar magnitude deviation $||A_{\text{grav\_dev}}||$ is a 1D proxy for total dynamic acceleration magnitude and NOT a full 3D vector orientation decomposition. All extreme readings were preserved intact as candidate observations.

---

## 10. Gyroscope Findings

Gyroscope angular velocity magnitude $||\Omega|| = \sqrt{\Omega_x^2 + \Omega_y^2 + \Omega_z^2}$ measures vehicle rotational rate in degrees per second (dps).

- **Mean**: $4.72\text{ dps}$
- **Median**: $3.18\text{ dps}$
- **Std Dev**: $7.50\text{ dps}$
- **P90**: $5.53\text{ dps}$
- **P95**: $7.58\text{ dps}$
- **P99**: $47.01\text{ dps}$
- **Maximum**: $58.21\text{ dps}$

---

## 11. Trip-Level Findings

- **Total Fleet Trips**: Exactly 450 trips (15 trips per driver across 30 drivers).
- **Total Fleet Distance**: $6,151.68\text{ km}$ (Mean: $13.67\text{ km/trip}$, Range: $3.20\text{ km}$ to $34.50\text{ km}$).
- **Total Fleet Duration**: $216.45\text{ hours}$ ($12,987\text{ minutes}$, Mean: $28.86\text{ min/trip}$, Range: $8.00\text{ min}$ to $65.00\text{ min}$).
- **Average Trip Speed**: Mean $28.42\text{ km/h}$ (Range: $14.20\text{ km/h}$ to $52.60\text{ km/h}$).

---

## 12. Driver-Level Findings

- **Driver Count**: 30 drivers.
- **Trips per Driver**: Exactly 15 trips per driver.
- **Speed Instability**: Average within-trip speed standard deviation (`speed_std`) varies by driver from $6.42\text{ km/h}$ to $18.90\text{ km/h}$.
- **Demographic Policy**: Protected demographic attributes (`Age`, `Gender`) were audited for dataset distribution but strictly excluded from driver risk modeling to maintain ethical, defensible behavioral scoring.

---

## 13. Vehicle-Level Findings

- **Vehicle Count**: 30 vehicles.
- **Manufacture Year**: 2018 to 2025 (Vehicle Age: 1 to 8 years, Mean: $4.2\text{ years}$).
- **Starting Odometer**: $12,450\text{ km}$ to $184,200\text{ km}$.
- **Service Recency**: Days since last service ranges from 12 days to 310 days. Vehicles with $>180$ days since service exhibit a statistically significant elevation in candidate acceleration deviation rates ($r = 0.42, p < 0.05$).

---

## 14. Temporal Findings

- **Observation Window**: 7 days (`2026-07-31` to `2026-08-06`).
- **Daily Volume Consistency**: Daily trip count remained uniform (~64 trips/day, ~880 km/day).
- **Single-Week Constraint Note**: 7 days of monitoring is insufficient for long-term seasonal wear modeling or multi-month trend extrapolation.

---

## 15. Exposure-Normalized Findings & Bias Audit

Raw event counts are naturally biased by trip volume, driving duration, and distance traveled.
- **Exposure Bias Evidence**: Driver D04 logged 15 trips totaling 280 km and accumulated 32 raw extreme sensor points. Driver D12 logged 15 short urban trips totaling 110 km and accumulated 14 raw points. On raw counts alone, D04 appears worse; however, when normalized per driving hour, D12 exhibits a $35\%$ higher rate of extreme events per unit exposure.
- **Normalized Rates Derived**:
  - `accel_extremes_per_hour` ($\text{events / driving hour}$)
  - `accel_extremes_per_100km` ($\text{events / 100 km}$)
  - `gyro_extremes_per_hour` ($\text{events / driving hour}$)
  - `gyro_extremes_per_100km` ($\text{events / 100 km}$)

---

## 16. Driver-vs-Vehicle Operational Attribution Findings

### Operational Cross-Assignment Matrix:
- **25 Drivers** operate 1 primary vehicle exclusively.
- **5 Drivers** operate multiple vehicles across the week.
- **19 Vehicles** are operated by 1 driver exclusively.
- **11 Vehicles** are operated by multiple drivers.

### Anomaly Attribution Results (77 Candidate Anomalous Trips Flagged at Upper 10% Rate Tail):
1. **DRIVER-LINKED PATTERN (3 Trips)**: Candidate anomaly recurs for the **same driver across multiple vehicles**. Consistent with driver handling style.
2. **VEHICLE-LINKED PATTERN (17 Trips)**: Candidate anomaly recurs on the **same vehicle across multiple drivers**. Candidate signal for mechanical inspection / suspension check.
3. **JOINT DRIVER-VEHICLE CO-OCCURRENCE (1 Trip)**: Anomaly present in both driver history and vehicle history.
4. **INSUFFICIENT EVIDENCE FOR ATTRIBUTION (56 Trips)**: Candidate anomaly occurs on an isolated trip pair without repeated cross-assignment evidence.

---

## 17. Candidate Anomalies Summary

Out of 12,987 minute-by-minute telemetry points:
- **Upper 1% Acceleration Deviation Tail ($||A_{\text{grav\_dev}}|| > 0.4188\text{g}$)**: 130 telemetry observations.
- **Upper 1% Gyroscope Rotational Rate Tail ($||\Omega|| > 47.01\text{ dps}$)**: 130 telemetry observations.
- **Trips Flagged with Upper 10% Rate Tail**: 77 trips. Zero rows deleted.

---

## 18. Important Correlations Audit

| Pair Evaluated | Statistic | Correlation ($r$) | Analytical Rationale & Action |
| :--- | :---: | :---: | :--- |
| `speed_mean` vs `Trips.Avg_Speed_kmph` | Pearson $r$ | **$> 0.999$** | **REJECT (Redundant)**: Telemetry mean speed is identical to trip average speed. |
| `speed_max` vs `Trips.Max_Speed_kmph` | Pearson $r$ | **$> 0.999$** | **REJECT (Redundant)**: Telemetry peak speed is identical to trip max speed. |
| `Distance_KM` vs `Duration_Min` | Pearson $r$ | **$+0.880$** | **INVESTIGATE**: High spatial-temporal correlation, but represents distinct physical dimensions. |
| `days_since_last_service` vs `accel_extremes_per_hour` | Pearson $r$ | **$+0.420$** | **KEEP ($p < 0.05$)**: Statistically significant positive association with sensor vibration rate. |

---

## 19. Candidate Feature Evaluation Table

| Feature Name | Level | Source | Rationale | Interpretability | Action |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `speed_p95` | Trip | Telemetry Speed | Upper tail sustained operating speed without single-minute noise | High | **KEEP** |
| `speed_std` | Trip | Telemetry Speed | Quantifies speed instability and stop-and-go driving pattern | High | **KEEP** |
| `accel_grav_dev_mean` | Trip | Accel Gravity Deviation | Baseline dynamic motion magnitude after removing baseline gravity (~1.0086g) | High | **KEEP** |
| `accel_extremes_per_hour` | Trip | Accel Gravity Deviation | Exposure-normalized rate of candidate extreme acceleration deviations | Very High | **KEEP** |
| `gyro_mag_p95` | Trip | Gyroscope | Upper tail rotational velocity (cornering / swerving rate) | High | **KEEP** |
| `gyro_extremes_per_hour` | Trip | Gyroscope | Exposure-normalized rate of candidate extreme rotational velocities | Very High | **KEEP** |
| `days_since_last_service` | Vehicle | Vehicles Master Data | Maintenance recency operational signal | High | **INVESTIGATE** |
| `vehicle_age_years` | Vehicle | Vehicles Master Data | Vehicle structural aging indicator | High | **INVESTIGATE** |
| `Distance_KM` | Trip | Trips Master Data | Total trip spatial span | High | **INVESTIGATE** |
| `speed_mean` | Trip | Telemetry Speed | Central operating speed | High | **REJECT (Redundant)** |
| `speed_max` | Trip | Telemetry Speed | Instantaneous peak speed | Medium | **REJECT (Redundant)** |

---

## 20. Redundant & Rejected Features Summary

- **`speed_mean`**: Rejected due to exact collinearity ($r > 0.999$) with `Trips.Avg_Speed_kmph`.
- **`speed_max`**: Rejected due to exact collinearity ($r > 0.999$) with `Trips.Max_Speed_kmph`.

---

## 21. Recommended Stage 3 Modeling Approach

> [!IMPORTANT]
> **Recommended Modeling Architecture**:
> **Hybrid Unsupervised Scoring + Evidence Attribution Framework**

1. **Interpretable Percentile-Based Score**:
   - Compute exposure-normalized rates ($\text{events / hour}$, $\text{events / 100km}$).
   - Map metric distributions to robust percentile ranks ($0 - 100$) per benchmark category.
2. **Robust Statistical Anomaly Signal**:
   - Apply **Isolation Forest** or **Median Absolute Deviation (MAD)** on non-redundant trip features (`speed_p95`, `accel_extremes_per_hour`, `gyro_extremes_per_hour`, `speed_std`).
3. **Unsupervised Evaluation Strategy**:
   - Evaluate model quality via **Stability** (bootstrap rank correlation), **Sensitivity** (feature perturbation response), **Ranking Consistency**, **Expert Interpretability**, and **Temporal Persistence**.

---

## 22. Major Limitations

1. **Short Observation Window**: 7 days of monitoring is insufficient for long-term wear modeling or seasonal trend extrapolation.
2. **Absence of Ground-Truth Labels**: Zero accident or maintenance failure logs mandate unsupervised anomaly framing.
3. **1-Minute Telemetry Resolution**: High-frequency sub-second transient shocks (e.g. 50 Hz pot-hole hits) are averaged over 60-second intervals.

---

## 23. Unexpected Findings

1. **Multi-Driver Vehicle Assignments**: 11 vehicles operated by multiple drivers created an immediate natural experiment for isolating vehicle-linked sensor vibration signals from driver handling.
2. **IMU Static Gravity Baseline Offset**: Empirical median gravity centered at $1.0086\text{ g}$ rather than exactly $1.0000\text{ g}$, revealing slight mobile phone IMU sensor calibration offsets.

---

## 24. Five Strongest Insights for Eventual Dashboard

1. **Automated Anomaly Attribution Engine**: Clear operational tagging separating **Driver Coaching Signals** (driver-persistent) from **Vehicle Maintenance Signals** (vehicle-persistent).
2. **Exposure-Normalized Risk & Sensor Rates**: Primary KPI framing metrics as $\text{Events / Driving Hour}$ rather than raw counts to prevent exposure bias.
3. **Speed Instability & Upper-Tail Velocity**: Combination of within-trip speed standard deviation and P95 sustained velocity for driver safety profiling.
4. **Service Recency & Sensor Degradation Correlation**: Highlighting vehicles with $>180$ days since service showing elevated vibration deviation rates.
5. **Evidence Persistence Indicator**: Visual tag distinguishing isolated single-trip anomalies from persistent multi-trip operational signals.

