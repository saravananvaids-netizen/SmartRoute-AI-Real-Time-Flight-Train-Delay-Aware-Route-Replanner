"""
SmartRoute AI - Graph Builder Module
Constructs unweighted and time-dependent directed transit networks.
"""

import json
import os
from typing import Dict, List, Any

DEFAULT_ROUTES_PATH = os.path.join(os.path.dirname(__file__), "..", "sample_data", "routes.json")

def load_network_data(filepath: str = DEFAULT_ROUTES_PATH) -> Dict[str, Any]:
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

class TransportGraph:
    def __init__(self, raw_data: Dict[str, Any] = None):
        if raw_data is None:
            raw_data = load_network_data()
        
        self.cities = raw_data.get("cities", {})
        self.raw_segments = raw_data.get("segments", [])
        
        # Adjacency lists for unweighted search
        self.adj: Dict[str, List[str]] = {city: [] for city in self.cities}
        self.reverse_adj: Dict[str, List[str]] = {city: [] for city in self.cities}
        
        # Segment lookup by (origin, destination)
        self.segments_by_pair: Dict[tuple, List[Dict[str, Any]]] = {}
        
        self._build_graph()

    def _build_graph(self):
        for seg in self.raw_segments:
            u = seg["origin"]
            v = seg["destination"]
            
            if u not in self.adj:
                self.adj[u] = []
            if v not in self.adj:
                self.adj[v] = []
                
            if u not in self.reverse_adj:
                self.reverse_adj[u] = []
            if v not in self.reverse_adj:
                self.reverse_adj[v] = []
                
            if v not in self.adj[u]:
                self.adj[u].append(v)
            if u not in self.reverse_adj[v]:
                self.reverse_adj[v].append(u)
                
            pair = (u, v)
            if pair not in self.segments_by_pair:
                self.segments_by_pair[pair] = []
            self.segments_by_pair[pair].append(seg)

    def get_segments(self, origin: str, dest: str, mode_filter: str = "all") -> List[Dict[str, Any]]:
        segs = self.segments_by_pair.get((origin, dest), [])
        if mode_filter == "all" or mode_filter.lower() == "both":
            return segs
        return [s for s in segs if s["mode"].lower() == mode_filter.lower()]
