"""
Package: modeling
Description: Stage 3 Modeling and Intelligence Layer for Vexar Fleet Intelligence.
Provides interpretable driver scoring, vehicle inspection scoring, secondary Isolation Forest anomaly detection,
stability auditing, deterministic explanation generation, and operational recommendation rules.
"""

from .driver_scoring import compute_driver_intelligence
from .vehicle_scoring import compute_vehicle_intelligence
from .isolation_model import train_and_evaluate_isolation_forest
from .explanation_engine import generate_driver_explanations, generate_vehicle_explanations
from .recommendation_engine import derive_driver_recommendation, derive_vehicle_recommendation, apply_recommendations
from .model_validation import validate_stage3_outputs

__all__ = [
    "compute_driver_intelligence",
    "compute_vehicle_intelligence",
    "train_and_evaluate_isolation_forest",
    "generate_driver_explanations",
    "generate_vehicle_explanations",
    "derive_driver_recommendation",
    "derive_vehicle_recommendation",
    "apply_recommendations",
    "validate_stage3_outputs"
]

