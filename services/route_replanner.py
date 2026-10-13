"""
SmartRoute AI - Master Route Replanner Service
Coordinates graph search, delay simulation, ripple cascading, and explainable recommendations.
"""

from typing import Dict, Any, List, Optional
from algorithms.graph_builder import TransportGraph
from algorithms.standard_bfs import standard_bfs
from algorithms.bidirectional_bfs import bidirectional_bfs
from algorithms.dijkstra_time_dependent import TimeDependentRouter, parse_time_to_minutes
from services.delay_predictor import DelayPredictor
from services.connection_validator import validate_full_itinerary
from services.ripple_analyzer import analyze_delay_ripple

class RouteReplannerService:
    def __init__(self, raw_data: Dict[str, Any] = None):
        self.graph = TransportGraph(raw_data)
        self.predictor = DelayPredictor()
        self.router = TimeDependentRouter(self.graph.raw_segments)

    def plan_or_replan(
        self,
        origin: str,
        destination: str,
        dep_time: str = "06:00",
        transport_type: str = "both",
        preference: str = "fastest",
        max_budget: Optional[float] = None,
        simulated_delays: Dict[str, int] = None
    ) -> Dict[str, Any]:
        simulated_delays = simulated_delays or {}

        # 1. Topology Discovery & Algorithm Comparison
        std_bfs_result = standard_bfs(self.graph.adj, origin, destination)
        bi_bfs_result = bidirectional_bfs(self.graph.adj, self.graph.reverse_adj, origin, destination)

        # 2. Schedule-based Time-dependent Itineraries
        candidates = self.router.find_routes(
            origin=origin,
            destination=destination,
            dep_time_str=dep_time,
            mode_preference=transport_type,
            criteria=preference,
            active_delays=simulated_delays
        )

        # Filter by budget if provided
        if max_budget is not None and max_budget > 0:
            budget_filtered = [c for c in candidates if c["total_fare"] <= max_budget]
            if budget_filtered:
                candidates = budget_filtered

        # 3. Enrich Candidates with AI Delay Risk, Validation, and Explanations
        enriched_routes = []
        for rank, cand in enumerate(candidates):
            segs = cand["segments"]
            validation = validate_full_itinerary(segs, simulated_delays)

            # Predict delay risk on the most critical segment
            primary_seg = segs[0]
            hour = parse_time_to_minutes(primary_seg["dep_time"]) // 60
            ai_risk = self.predictor.predict_delay(
                transport_type=primary_seg["mode"],
                origin=primary_seg["origin"],
                destination=primary_seg["destination"],
                departure_hour=hour,
                weather_severity=0.15 if "flight" in primary_seg["mode"] else 0.05,
                historical_congestion=0.4
            )

            # Delay ripple check
            ripple = analyze_delay_ripple(
                segments=segs,
                initial_delay_min=simulated_delays.get(primary_seg["id"], primary_seg.get("current_delay_min", 0)),
                disrupted_segment_index=0
            )

            # Generate Explainable AI Reasoning
            reasons = []
            if rank == 0:
                if preference == "fastest":
                    reasons.append(f"Optimal total travel time of {cand['total_duration_min'] // 60}h {cand['total_duration_min'] % 60}m.")
                elif preference == "cheapest":
                    reasons.append(f"Lowest total estimated fare of ₹{cand['total_fare']:,}.")
                else:
                    reasons.append(f"Minimal transfers ({cand['transfers']} stops) for hassle-free transit.")

            if validation["has_missed_connection"]:
                reasons.append("⚠️ Contains a broken connection buffer; reroute required.")
            else:
                reasons.append(f"Safe connection buffer preserved with {ai_risk['risk_category']} ({ai_risk['risk_score_percent']}% delay risk).")

            enriched_routes.append({
                "rank": rank + 1,
                "route_id": f"ROUTE-{rank + 1}",
                "origin": origin,
                "destination": destination,
                "departure_time": cand["departure_time"],
                "arrival_time": cand["arrival_time"],
                "total_duration_min": cand["total_duration_min"],
                "total_duration_formatted": f"{cand['total_duration_min'] // 60}h {cand['total_duration_min'] % 60}m",
                "total_fare": cand["total_fare"],
                "transfers": cand["transfers"],
                "segments": segs,
                "validation": validation,
                "ai_risk": ai_risk,
                "ripple_analysis": ripple,
                "explanation": " ".join(reasons),
                "is_recommended": (rank == 0 and not validation["has_missed_connection"])
            })

        # Determine original vs replanned
        original_route = enriched_routes[0] if enriched_routes else None
        recommended_route = None
        for r in enriched_routes:
            if not r["validation"]["has_missed_connection"]:
                recommended_route = r
                break

        if not recommended_route and enriched_routes:
            recommended_route = enriched_routes[0]

        # Calculate time saved
        time_saved = 0
        if original_route and recommended_route and original_route != recommended_route:
            time_saved = max(0, original_route["total_duration_min"] - recommended_route["total_duration_min"])

        return {
            "origin": origin,
            "destination": destination,
            "departure_time": dep_time,
            "preference": preference,
            "algorithm_comparison": {
                "standard_bfs": std_bfs_result,
                "bidirectional_bfs": bi_bfs_result,
                "speedup_ratio": round(
                    (std_bfs_result["nodes_explored"] / max(1, bi_bfs_result["total_nodes_explored"])), 2
                )
            },
            "original_route": original_route,
            "recommended_route": recommended_route,
            "alternatives": [r for r in enriched_routes if r != recommended_route][:3],
            "all_routes": enriched_routes,
            "time_saved_min": time_saved
        }
