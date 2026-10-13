"""
Unit Tests for AI Delay Predictor
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.delay_predictor import DelayPredictor

class TestDelayPredictor(unittest.TestCase):
    def setUp(self):
        self.predictor = DelayPredictor()

    def test_predict_delay_output_structure(self):
        res = self.predictor.predict_delay(
            transport_type="train",
            origin="Chennai",
            destination="Delhi",
            departure_hour=18,
            weather_severity=0.2,
            historical_congestion=0.6
        )
        self.assertIn("predicted_delay_min", res)
        self.assertIn("risk_category", res)
        self.assertIn("risk_score_percent", res)
        self.assertIn(res["risk_category"], ["Low Risk", "Moderate Risk", "High Risk"])
        self.assertGreaterEqual(res["risk_score_percent"], 0)
        self.assertLessEqual(res["risk_score_percent"], 100)

if __name__ == "__main__":
    unittest.main()
