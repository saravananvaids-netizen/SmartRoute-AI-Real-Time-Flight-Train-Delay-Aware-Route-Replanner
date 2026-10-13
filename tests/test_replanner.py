"""
Unit Tests for SmartRoute AI Replanner & Connection Validation
Tests Chennai to Delhi 30-min disruption scenario and replanning alternatives.
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.route_replanner import RouteReplannerService
from services.connection_validator import validate_connection, validate_full_itinerary
from services.ripple_analyzer import analyze_delay_ripple

class TestRouteReplanner(unittest.TestCase):
    def setUp(self):
        self.replanner = RouteReplannerService()

    def test_chennai_delhi_replanning(self):
        result = self.replanner.plan_or_replan(
            origin="Chennai",
            destination="Delhi",
            dep_time="06:00",
            transport_type="both",
            preference="fastest",
            simulated_delays={"TR-101": 30}
        )
        self.assertEqual(result["origin"], "Chennai")
        self.assertEqual(result["destination"], "Delhi")
        self.assertIsNotNone(result["recommended_route"])
        self.assertGreater(len(result["all_routes"]), 0)

    def test_connection_validator_tight_and_missed(self):
        s1 = {"id": "TR-101", "origin": "Chennai", "destination": "Nagpur", "arr_time": "11:30", "mode": "train"}
        s2 = {"id": "TR-102", "origin": "Nagpur", "destination": "Delhi", "dep_time": "12:15", "mode": "train"}

        # Normal: 45 min buffer (train requires 35 min buffer) -> Safe
        normal_check = validate_connection(s1, s2, incoming_delay_min=0, outgoing_delay_min=0)
        self.assertFalse(normal_check["is_missed"])

        # Delay s1 by 30 mins: arr becomes 12:00. buffer left: 15 mins (< 35 min min buffer) -> Missed
        delayed_check = validate_connection(s1, s2, incoming_delay_min=30, outgoing_delay_min=0)
        self.assertTrue(delayed_check["is_missed"])
        self.assertEqual(delayed_check["status"], "MISSED_CONNECTION")

    def test_ripple_delay_waterfall(self):
        segments = [
            {"id": "S1", "carrier": "Train A", "origin": "Chennai", "destination": "Nagpur", "dep_time": "18:50", "duration_min": 990, "mode": "train"},
            {"id": "S2", "carrier": "Train B", "origin": "Nagpur", "destination": "Delhi", "dep_time": "12:15", "duration_min": 1165, "mode": "train"}
        ]
        ripple = analyze_delay_ripple(segments, initial_delay_min=30, disrupted_segment_index=0)
        self.assertTrue(ripple["itinerary_collapsed"])
        self.assertEqual(ripple["bottleneck_location"], "Nagpur")

if __name__ == "__main__":
    unittest.main()
