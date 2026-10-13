"""
SmartRoute AI - Time-Dependent Dijkstra Algorithm
Optimizes journeys across departure schedules, reported delays, and minimum transfer buffers.
Eliminates physically infeasible connections that have already departed or violate connection buffers.
"""

import heapq
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

def parse_time_to_minutes(time_str: str) -> int:
    """Converts HH:MM string to minutes from start of day."""
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])

def minutes_to_time_str(mins: int) -> str:
    """Converts cumulative minutes to (Day +N) HH:MM display format."""
    day = mins // (24 * 60)
    rem = mins % (24 * 60)
    hh = rem // 60
    mm = rem % 60
    time_repr = f"{hh:02d}:{mm:02d}"
    if day > 0:
        return f"{time_repr} (+{day}d)"
    return time_repr

def get_min_transfer_buffer(incoming_mode: str, outgoing_mode: str) -> int:
    """
    Returns required minimum layover buffer in minutes.
    Train -> Train: 35 min
    Flight -> Flight: 60 min
    Train -> Flight: 90 min (station to airport transit)
    Flight -> Train: 75 min (airport exit to station)
    """
    inc = incoming_mode.lower()
    out = outgoing_mode.lower()
    if inc == "train" and out == "train":
        return 35
    if inc == "flight" and out == "flight":
        return 60
    if inc == "train" and out == "flight":
        return 90
    if inc == "flight" and out == "train":
        return 75
    return 45

class TimeDependentRouter:
    def __init__(self, segments: List[Dict[str, Any]]):
        self.segments = segments

    def find_routes(
        self,
        origin: str,
        destination: str,
        dep_time_str: str = "06:00",
        mode_preference: str = "both",  # train, flight, both
        criteria: str = "fastest",       # fastest, cheapest, fewest_transfers
        max_transfers: int = 2,
        active_delays: Dict[str, int] = None # segment_id -> added delay mins
    ) -> List[Dict[str, Any]]:
        active_delays = active_delays or {}
        start_min = parse_time_to_minutes(dep_time_str)

        # Priority queue entries:
        # (cost_metric, current_time_min, current_city, list_of_segments_taken, total_fare)
        pq = []
        heapq.heappush(pq, (0, start_min, origin, [], 0))

        valid_itineraries = []
        seen_paths = set()

        while pq and len(valid_itineraries) < 6:
            cost, curr_time, curr_city, path, curr_fare = heapq.heappop(pq)

            if curr_city == destination:
                path_key = tuple(s["id"] for s in path)
                if path_key not in seen_paths:
                    seen_paths.add(path_key)
                    
                    total_dur = curr_time - start_min
                    valid_itineraries.append({
                        "segments": path,
                        "origin": origin,
                        "destination": destination,
                        "departure_time": minutes_to_time_str(path[0]["actual_dep_min"]) if path else dep_time_str,
                        "arrival_time": minutes_to_time_str(curr_time),
                        "total_duration_min": total_dur,
                        "total_fare": curr_fare,
                        "transfers": max(0, len(path) - 1),
                        "cost_score": cost,
                        "status": "Feasible"
                    })
                continue

            if len(path) >= (max_transfers + 1):
                continue

            # Check outgoing segments from curr_city
            for seg in self.segments:
                if seg["origin"] != curr_city:
                    continue

                # Filter mode
                seg_mode = seg["mode"].lower()
                if mode_preference != "both" and seg_mode != mode_preference.lower():
                    continue

                # Segment delay calculation
                base_delay = seg.get("current_delay_min", 0)
                sim_delay = active_delays.get(seg["id"], 0)
                total_delay = base_delay + sim_delay

                seg_sched_dep = parse_time_to_minutes(seg["dep_time"])
                # Adjust schedule to next available occurrence relative to current_time
                day_offset = (curr_time // (24 * 60)) * (24 * 60)
                cand_sched_dep = day_offset + seg_sched_dep

                # Required buffer from previous segment
                if path:
                    prev_seg = path[-1]
                    min_buffer = get_min_transfer_buffer(prev_seg["mode"], seg["mode"])
                    earliest_allowable_dep = curr_time + min_buffer
                else:
                    earliest_allowable_dep = curr_time

                # If scheduled departure is earlier than allowable, move to next day
                while (cand_sched_dep + total_delay) < earliest_allowable_dep:
                    cand_sched_dep += 24 * 60

                effective_dep = cand_sched_dep + total_delay
                effective_arr = effective_dep + seg["duration_min"]

                # Avoid cycle
                cities_in_path = [s["origin"] for s in path]
                if seg["destination"] in cities_in_path:
                    continue

                new_path = list(path)
                enriched_seg = dict(seg)
                enriched_seg["actual_dep_min"] = effective_dep
                enriched_seg["actual_arr_min"] = effective_arr
                enriched_seg["actual_delay_min"] = total_delay
                enriched_seg["formatted_dep"] = minutes_to_time_str(effective_dep)
                enriched_seg["formatted_arr"] = minutes_to_time_str(effective_arr)
                new_path.append(enriched_seg)

                new_fare = curr_fare + seg.get("base_fare", 0)
                duration_so_far = effective_arr - start_min
                transfers_count = len(new_path) - 1

                # Primary metric for priority queue
                if criteria == "cheapest":
                    metric = new_fare + (duration_so_far * 0.5)
                elif criteria == "fewest_transfers":
                    metric = (transfers_count * 500) + (duration_so_far * 0.8)
                else:  # fastest
                    metric = duration_so_far + (transfers_count * 60)

                heapq.heappush(pq, (metric, effective_arr, seg["destination"], new_path, new_fare))

        return valid_itineraries
