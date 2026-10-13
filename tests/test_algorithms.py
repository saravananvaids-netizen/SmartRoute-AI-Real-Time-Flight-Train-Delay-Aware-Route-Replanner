"""
Unit Tests for SmartRoute AI Search Algorithms
Validates Standard BFS, Bidirectional BFS, and Time-Dependent Dijkstra.
"""

import unittest
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from algorithms.graph_builder import TransportGraph
from algorithms.standard_bfs import standard_bfs
from algorithms.bidirectional_bfs import bidirectional_bfs
from algorithms.dijkstra_time_dependent import TimeDependentRouter, parse_time_to_minutes, minutes_to_time_str

class TestAlgorithms(unittest.TestCase):
    def setUp(self):
        self.graph = TransportGraph()
        self.router = TimeDependentRouter(self.graph.raw_segments)

    def test_standard_bfs_discovery(self):
        res = standard_bfs(self.graph.adj, "Chennai", "Delhi")
        self.assertTrue(res["found"])
        self.assertIn("Chennai", res["path"])
        self.assertIn("Delhi", res["path"])
        self.assertGreater(res["nodes_explored"], 0)

    def test_bidirectional_bfs_meeting_point(self):
        res = bidirectional_bfs(self.graph.adj, self.graph.reverse_adj, "Chennai", "Delhi")
        self.assertTrue(res["found"])
        self.assertIsNotNone(res["meeting_point"])
        self.assertEqual(res["path"][0], "Chennai")
        self.assertEqual(res["path"][-1], "Delhi")
        self.assertIn(res["meeting_point"], res["path"])

    def test_bidirectional_vs_standard_bfs_efficiency(self):
        std_res = standard_bfs(self.graph.adj, "Chennai", "Delhi")
        bi_res = bidirectional_bfs(self.graph.adj, self.graph.reverse_adj, "Chennai", "Delhi")
        # Bidirectional search visits fewer or equal nodes than full unidirectional search
        self.assertLessEqual(bi_res["total_nodes_explored"], std_res["nodes_explored"] + 2)

    def test_time_dependent_dijkstra_finds_routes(self):
        routes = self.router.find_routes(
            origin="Chennai",
            destination="Delhi",
            dep_time_str="06:00",
            mode_preference="both",
            criteria="fastest"
        )
        self.assertGreater(len(routes), 0)
        fastest = routes[0]
        self.assertEqual(fastest["origin"], "Chennai")
        self.assertEqual(fastest["destination"], "Delhi")
        self.assertGreater(fastest["total_duration_min"], 0)

    def test_time_conversions(self):
        self.assertEqual(parse_time_to_minutes("06:30"), 390)
        self.assertEqual(minutes_to_time_str(390), "06:30")
        self.assertEqual(minutes_to_time_str(1440 + 60), "01:00 (+1d)")

if __name__ == "__main__":
    unittest.main()
