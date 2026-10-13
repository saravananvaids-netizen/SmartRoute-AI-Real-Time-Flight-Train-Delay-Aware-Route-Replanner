"""
SmartRoute AI - Delay Ripple Analysis Service
Models how an initial delay at segment 0 cascades down connecting flights and trains,
causing schedule pushes, lost connection slots, or catastrophic missed journeys.
"""

from typing import List, Dict, Any
from algorithms.dijkstra_time_dependent import parse_time_to_minutes, minutes_to_time_str, get_min_transfer_buffer

def analyze_delay_ripple(
    segments: List[Dict[str, Any]],
    initial_delay_min: int,
    disrupted_segment_index: int = 0
) -> Dict[str, Any]:
    """
    Simulates a waterfall ripple effect when a delay occurs at a specific segment.
    """
    if not segments:
        return {"ripple_steps": [], "cascaded_delay_total": 0, "itinerary_collapsed": False}

    ripple_steps = []
    cumulative_delay = initial_delay_min
    itinerary_collapsed = False
    bottleneck_location = None

    for idx, seg in enumerate(segments):
        if idx < disrupted_segment_index:
            # Segment already happened unaffected
            ripple_steps.append({
                "leg_index": idx,
                "segment_id": seg["id"],
                "carrier": seg["carrier"],
                "origin": seg["origin"],
                "destination": seg["destination"],
                "scheduled_dep": seg["dep_time"],
                "effective_dep": seg["dep_time"],
                "added_delay_min": 0,
                "status": "Completed Normally",
                "impact": "None"
            })
            continue

        if idx == disrupted_segment_index:
            sched_dep = parse_time_to_minutes(seg["dep_time"])
            effective_dep = sched_dep + cumulative_delay
            effective_arr = effective_dep + seg["duration_min"]
            
            ripple_steps.append({
                "leg_index": idx,
                "segment_id": seg["id"],
                "carrier": seg["carrier"],
                "origin": seg["origin"],
                "destination": seg["destination"],
                "scheduled_dep": seg["dep_time"],
                "effective_dep": minutes_to_time_str(effective_dep),
                "added_delay_min": cumulative_delay,
                "status": f"+{cumulative_delay} min delay introduced",
                "impact": "Origin disruption"
            })
            prev_effective_arr = effective_arr
            continue

        # Downstream segment idx > disrupted_segment_index
        prev_seg = segments[idx - 1]
        req_buffer = get_min_transfer_buffer(prev_seg["mode"], seg["mode"])
        sched_dep = parse_time_to_minutes(seg["dep_time"])

        earliest_possible_dep = prev_effective_arr + req_buffer

        # Check if scheduled departure has already passed or violates buffer
        if sched_dep < earliest_possible_dep:
            # Missed departure of scheduled slot!
            delay_on_this_leg = earliest_possible_dep - sched_dep
            itinerary_collapsed = True
            if bottleneck_location is None:
                bottleneck_location = seg["origin"]

            # Passenger missed this specific service, must catch next available or replan
            effective_dep = earliest_possible_dep
            effective_arr = effective_dep + seg["duration_min"]
            cumulative_delay = delay_on_this_leg

            ripple_steps.append({
                "leg_index": idx,
                "segment_id": seg["id"],
                "carrier": seg["carrier"],
                "origin": seg["origin"],
                "destination": seg["destination"],
                "scheduled_dep": seg["dep_time"],
                "effective_dep": minutes_to_time_str(effective_dep),
                "added_delay_min": cumulative_delay,
                "status": f"MISSED CONNECTION: Delayed by +{cumulative_delay} min",
                "impact": f"Cascade breach at {seg['origin']} (needed {req_buffer}m buffer)"
            })
        else:
            # Buffer absorbs delay partially or fully!
            buffer_slack = sched_dep - (prev_effective_arr + req_buffer)
            absorbed_delay = max(0, cumulative_delay - buffer_slack)
            cumulative_delay = absorbed_delay
            effective_dep = sched_dep
            effective_arr = effective_dep + seg["duration_min"]

            ripple_steps.append({
                "leg_index": idx,
                "segment_id": seg["id"],
                "carrier": seg["carrier"],
                "origin": seg["origin"],
                "destination": seg["destination"],
                "scheduled_dep": seg["dep_time"],
                "effective_dep": minutes_to_time_str(effective_dep),
                "added_delay_min": cumulative_delay,
                "status": "Absorbed by scheduled layover",
                "impact": f"Slack absorbed delay; departs on schedule {seg['dep_time']}"
            })

        prev_effective_arr = effective_arr

    return {
        "ripple_steps": ripple_steps,
        "initial_delay_min": initial_delay_min,
        "final_cascaded_delay_min": cumulative_delay,
        "itinerary_collapsed": itinerary_collapsed,
        "bottleneck_location": bottleneck_location,
        "summary": (
            f"The initial {initial_delay_min}-minute delay caused a cascade collapse at {bottleneck_location}."
            if itinerary_collapsed
            else f"Schedule buffers absorbed the {initial_delay_min}-minute disruption; destination arrival delayed by only {cumulative_delay} min."
        )
    }
