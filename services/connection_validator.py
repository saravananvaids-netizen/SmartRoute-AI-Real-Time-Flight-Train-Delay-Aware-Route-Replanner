"""
SmartRoute AI - Connection Validator Service
Evaluates multi-leg itineraries for layover feasibility, tight connections, and missed connections.
"""

from typing import Dict, Any, List
from algorithms.dijkstra_time_dependent import parse_time_to_minutes, get_min_transfer_buffer

def validate_connection(
    incoming_seg: Dict[str, Any],
    outgoing_seg: Dict[str, Any],
    incoming_delay_min: int = 0,
    outgoing_delay_min: int = 0
) -> Dict[str, Any]:
    """
    Checks if a connection between two legs is valid after delays.
    """
    inc_sched_arr = parse_time_to_minutes(incoming_seg["arr_time"])
    out_sched_dep = parse_time_to_minutes(outgoing_seg["dep_time"])

    # If outgoing is scheduled on the next day or earlier in raw clock
    if out_sched_dep < inc_sched_arr:
        out_sched_dep += 24 * 60

    effective_arr = inc_sched_arr + incoming_delay_min
    effective_dep = out_sched_dep + outgoing_delay_min

    available_buffer = effective_dep - effective_arr
    required_buffer = get_min_transfer_buffer(incoming_seg["mode"], outgoing_seg["mode"])

    is_missed = available_buffer < required_buffer
    is_tight = not is_missed and available_buffer < (required_buffer + 25)

    if is_missed:
        status = "MISSED_CONNECTION"
        severity = "Critical"
        message = (
            f"Missed Connection: Layover window is only {available_buffer} min "
            f"(requires minimum {required_buffer} min for {incoming_seg['mode']} ➔ {outgoing_seg['mode']})."
        )
    elif is_tight:
        status = "TIGHT_CONNECTION"
        severity = "Warning"
        message = (
            f"Tight Connection Risk: {available_buffer} min layover available "
            f"(close to minimum buffer of {required_buffer} min)."
        )
    else:
        status = "SAFE_CONNECTION"
        severity = "Normal"
        message = f"Comfortable Layover: {available_buffer} min buffer available (min required: {required_buffer} min)."

    return {
        "status": status,
        "severity": severity,
        "transfer_station": incoming_seg["destination"],
        "available_buffer_min": available_buffer,
        "required_buffer_min": required_buffer,
        "is_missed": is_missed,
        "is_tight": is_tight,
        "explanation": message
    }

def validate_full_itinerary(segments: List[Dict[str, Any]], simulated_delays: Dict[str, int] = None) -> Dict[str, Any]:
    simulated_delays = simulated_delays or {}
    if len(segments) <= 1:
        return {
            "has_missed_connection": False,
            "has_tight_connection": False,
            "connection_evaluations": [],
            "overall_status": "Valid Single Leg"
        }

    evaluations = []
    has_missed = False
    has_tight = False

    for i in range(len(segments) - 1):
        s1 = segments[i]
        s2 = segments[i + 1]
        d1 = s1.get("current_delay_min", 0) + simulated_delays.get(s1["id"], 0)
        d2 = s2.get("current_delay_min", 0) + simulated_delays.get(s2["id"], 0)
        res = validate_connection(s1, s2, d1, d2)
        evaluations.append(res)
        if res["is_missed"]:
            has_missed = True
        if res["is_tight"]:
            has_tight = True

    return {
        "has_missed_connection": has_missed,
        "has_tight_connection": has_tight,
        "connection_evaluations": evaluations,
        "overall_status": "DISRUPTED" if has_missed else ("RISK" if has_tight else "FEASIBLE")
    }
