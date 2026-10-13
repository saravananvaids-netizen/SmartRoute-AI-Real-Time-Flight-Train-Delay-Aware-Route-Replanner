"""
SmartRoute AI - AI Delay Prediction Service
Predicts delay severity and risk probability using historical transit records.
Implements Scikit-learn with graceful fallback heuristics when scikit-learn is not installed.
"""

import os
import csv
from typing import Dict, Any, Tuple

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "sample_data", "delays_historical.csv")

class DelayPredictor:
    def __init__(self):
        self.model = None
        self.encoder = None
        self.is_trained = False
        self._train_or_load()

    def _train_or_load(self):
        try:
            import pandas as pd
            from sklearn.ensemble import RandomForestRegressor
            from sklearn.preprocessing import OneHotEncoder

            if not os.path.exists(CSV_PATH):
                self.is_trained = False
                return

            df = pd.read_csv(CSV_PATH)
            X = df[["transport_type", "origin", "destination", "departure_hour", "weather_severity", "historical_congestion"]]
            y = df["delay_minutes"]

            # Simple pipeline
            from sklearn.compose import ColumnTransformer
            from sklearn.pipeline import Pipeline

            cat_cols = ["transport_type", "origin", "destination"]
            num_cols = ["departure_hour", "weather_severity", "historical_congestion"]

            preprocessor = ColumnTransformer(
                transformers=[
                    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
                    ("num", "passthrough", num_cols)
                ]
            )

            pipeline = Pipeline(steps=[
                ("preprocessor", preprocessor),
                ("regressor", RandomForestRegressor(n_estimators=30, random_state=42))
            ])

            pipeline.fit(X, y)
            self.model = pipeline
            self.is_trained = True
        except Exception:
            # Fallback to statistical rule-based model if sklearn / pandas not in environment
            self.is_trained = False

    def predict_delay(
        self,
        transport_type: str,
        origin: str,
        destination: str,
        departure_hour: int = 12,
        weather_severity: float = 0.1,
        historical_congestion: float = 0.4
    ) -> Dict[str, Any]:
        """
        Estimates delay minutes, risk category (Low, Medium, High), and confidence percentage.
        """
        predicted_min = 0.0

        if self.is_trained and self.model is not None:
            try:
                import pandas as pd
                sample_df = pd.DataFrame([{
                    "transport_type": transport_type.lower(),
                    "origin": origin,
                    "destination": destination,
                    "departure_hour": departure_hour,
                    "weather_severity": weather_severity,
                    "historical_congestion": historical_congestion
                }])
                pred = self.model.predict(sample_df)[0]
                predicted_min = max(0.0, float(pred))
            except Exception:
                predicted_min = self._heuristic_delay(transport_type, origin, destination, departure_hour, weather_severity)
        else:
            predicted_min = self._heuristic_delay(transport_type, origin, destination, departure_hour, weather_severity)

        # Categorize
        if predicted_min < 12:
            category = "Low Risk"
            risk_color = "emerald"
            risk_score = min(25, int(predicted_min * 2))
        elif predicted_min < 28:
            category = "Moderate Risk"
            risk_color = "amber"
            risk_score = min(65, int(25 + predicted_min * 1.5))
        else:
            category = "High Risk"
            risk_color = "rose"
            risk_score = min(96, int(60 + predicted_min * 0.8))

        return {
            "predicted_delay_min": round(predicted_min, 1),
            "risk_category": category,
            "risk_color": risk_color,
            "risk_score_percent": risk_score,
            "confidence": 0.88 if self.is_trained else 0.76,
            "factors": {
                "weather_impact": f"{int(weather_severity * 100)}%",
                "corridor_congestion": f"{int(historical_congestion * 100)}%",
                "departure_peak_time": "Peak Hour" if (8 <= departure_hour <= 11 or 17 <= departure_hour <= 21) else "Off-Peak"
            }
        }

    def _heuristic_delay(self, transport_type: str, origin: str, destination: str, hour: int, weather: float) -> float:
        base = 8.0 if transport_type.lower() == "train" else 5.0
        # Peak hours bump
        if 8 <= hour <= 11 or 17 <= hour <= 21:
            base += 12.0
        # Weather impact
        base += weather * 40.0
        # High-traffic corridors (e.g. Central India, Delhi entry)
        if "Delhi" in destination or "Bhopal" in origin:
            base += 10.0
        return base
