"""
SmartRoute AI - RailRadar / Train Status API Client
Integrates with authorized Indian Railways APIs or RailRadar services.
Gracefully transitions to clear sample data mode when keys are missing or services time out.
"""

import os
import requests
from typing import Dict, Any
from api_clients.base import BaseTransitClient

class RailRadarTrainClient(BaseTransitClient):
    def __init__(self):
        super().__init__("RailRadar Train API")
        self.api_key = os.getenv("RAIL_RADAR_API_KEY", "")
        self.base_url = "https://api.railradar.in/v1"

    def fetch_status(self, origin: str, destination: str, date: str) -> Dict[str, Any]:
        station_map = {
            "Chennai": "MAS",
            "Delhi": "NDLS",
            "Nagpur": "NGP",
            "Vijayawada": "BZA",
            "Bhopal": "BPL",
            "Mumbai": "CSMT",
            "Bangalore": "SBC"
        }
        orig_stn = station_map.get(origin, origin)
        dest_stn = station_map.get(destination, destination)

        cache_key = f"{orig_stn}_{dest_stn}_{date}"
        if cache_key in self.cache:
            return self.wrap_response(self.cache[cache_key], source="Cached")

        if self.api_key:
            try:
                headers = {"Authorization": f"Bearer {self.api_key}"}
                params = {"from": orig_stn, "to": dest_stn, "date": date}
                resp = requests.get(f"{self.base_url}/trains/status", headers=headers, params=params, timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    self.cache[cache_key] = data
                    return self.wrap_response(data, source="Live API")
            except Exception:
                pass

        # Demonstration mode data
        demo_trains = [
            {
                "train_number": "12615",
                "train_name": "Grand Trunk Express",
                "from_station": orig_stn,
                "to_station": dest_stn,
                "scheduled_departure": "18:50",
                "actual_departure": "19:20",
                "delay_minutes": 30,
                "status": "Delayed (+30 min at Itarsi block)",
                "classes": ["1A", "2A", "3A", "SL"]
            },
            {
                "train_number": "12621",
                "train_name": "Tamil Nadu Express",
                "from_station": orig_stn,
                "to_station": dest_stn,
                "scheduled_departure": "22:00",
                "actual_departure": "22:00",
                "delay_minutes": 0,
                "status": "On Time",
                "classes": ["1A", "2A", "3A", "SL"]
            }
        ]
        return self.wrap_response(
            demo_trains,
            source="Simulated Demonstration (Credentials not configured)",
            status="demo_mode"
        )
