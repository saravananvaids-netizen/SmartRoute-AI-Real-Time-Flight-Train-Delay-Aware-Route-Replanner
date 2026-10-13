"""
SmartRoute AI - Amadeus Flight API Client
Reads credentials from environment variables AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET.
If credentials are not present or network fails, automatically operates in verified demonstration mode.
"""

import os
import requests
from typing import Dict, Any
from api_clients.base import BaseTransitClient

class AmadeusFlightClient(BaseTransitClient):
    def __init__(self):
        super().__init__("Amadeus Flight API")
        self.client_id = os.getenv("AMADEUS_CLIENT_ID", "")
        self.client_secret = os.getenv("AMADEUS_CLIENT_SECRET", "")
        self.token = None
        self.base_url = "https://test.api.amadeus.com/v2"

    def _authenticate(self) -> bool:
        if not self.client_id or not self.client_secret:
            return False
        try:
            auth_url = "https://test.api.amadeus.com/v1/security/oauth2/token"
            resp = requests.post(
                auth_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret
                },
                timeout=5
            )
            if resp.status_code == 200:
                self.token = resp.json().get("access_token")
                return True
        except Exception:
            pass
        return False

    def fetch_status(self, origin: str, destination: str, date: str) -> Dict[str, Any]:
        # Airport code mapping
        code_map = {"Chennai": "MAA", "Delhi": "DEL", "Mumbai": "BOM", "Hyderabad": "HYD", "Bangalore": "BLR"}
        orig_code = code_map.get(origin, origin)
        dest_code = code_map.get(destination, destination)

        cache_key = f"{orig_code}_{dest_code}_{date}"
        if cache_key in self.cache:
            return self.wrap_response(self.cache[cache_key], source="Cached")

        if self._authenticate() and self.token:
            try:
                headers = {"Authorization": f"Bearer {self.token}"}
                params = {
                    "originLocationCode": orig_code,
                    "destinationLocationCode": dest_code,
                    "departureDate": date,
                    "adults": 1,
                    "max": 5
                }
                res = requests.get(f"{self.base_url}/shopping/flight-offers", headers=headers, params=params, timeout=6)
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    self.cache[cache_key] = data
                    return self.wrap_response(data, source="Live API")
            except Exception as err:
                pass

        # Demonstration mode with realistic fallback data
        demo_flights = [
            {
                "flight_number": "6E-2041",
                "airline": "IndiGo",
                "departure": "06:10",
                "arrival": "08:55",
                "delay_minutes": 0,
                "status": "On Time",
                "price_inr": 5850
            },
            {
                "flight_number": "AI-542",
                "airline": "Air India",
                "departure": "19:20",
                "arrival": "22:15",
                "delay_minutes": 45,
                "status": "Delayed (Slot Congestion)",
                "price_inr": 6400
            }
        ]
        return self.wrap_response(
            demo_flights,
            source="Simulated Demonstration (Credentials not configured)",
            status="demo_mode"
        )
