"""
SmartRoute AI - Graph Visualizer
Visualizes Bidirectional BFS vs Standard BFS search spaces and meeting points.
"""

from typing import Dict, Any, List

def format_bfs_comparison_summary(std_bfs: Dict[str, Any], bi_bfs: Dict[str, Any]) -> Dict[str, Any]:
    nodes_std = std_bfs.get("nodes_explored", 0)
    nodes_bi = bi_bfs.get("total_nodes_explored", 0)
    
    time_std = std_bfs.get("execution_time_ms", 0.0)
    time_bi = bi_bfs.get("execution_time_ms", 0.0)
    
    reduction_pct = 0.0
    if nodes_std > 0:
        reduction_pct = round(((nodes_std - nodes_bi) / nodes_std) * 100, 1)

    return {
        "standard_nodes": nodes_std,
        "bidirectional_nodes": nodes_bi,
        "node_reduction_percent": max(0.0, reduction_pct),
        "meeting_point": bi_bfs.get("meeting_point"),
        "forward_explored": bi_bfs.get("forward_explored", []),
        "backward_explored": bi_bfs.get("backward_explored", []),
        "theoretical_explanation": (
            "Bidirectional BFS expands two smaller search frontiers of radius d/2, "
            "reducing worst-case branching exploration from O(b^d) to O(2 * b^(d/2)). "
            "In this network, the search waves met at "
            f"'{bi_bfs.get('meeting_point')}', avoiding exploring unneeded branches beyond the midpoint."
        )
    }
