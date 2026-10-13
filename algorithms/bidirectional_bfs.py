"""
SmartRoute AI - Bidirectional Breadth-First Search (Bidirectional BFS)
Discovers connection topologies by expanding frontiers simultaneously from origin and destination.
Meets at a midpoint intersection, drastically cutting branching factor search space (O(2 * b^(d/2)) vs O(b^d)).

Academic note:
Bidirectional BFS finds the path with the fewest hops in unweighted graphs.
For scheduling networks with varying travel times, departure delays, and transfer buffers,
time-dependent Dijkstra is used downstream for travel-time optimization.
"""

from collections import deque
import time
from typing import List, Dict, Any, Optional

def bidirectional_bfs(
    forward_adj: Dict[str, List[str]], 
    reverse_adj: Dict[str, List[str]], 
    start: str, 
    target: str
) -> Dict[str, Any]:
    """
    Simultaneously runs BFS forward from 'start' and backward from 'target'.
    Identifies the meeting node where the two search waves collide.
    """
    t0 = time.perf_counter()

    if start not in forward_adj or target not in reverse_adj:
        return {
            "path": [],
            "found": False,
            "meeting_point": None,
            "forward_nodes_explored": 0,
            "backward_nodes_explored": 0,
            "total_nodes_explored": 0,
            "forward_explored": [],
            "backward_explored": [],
            "execution_time_ms": 0.0,
            "algorithm": "Bidirectional BFS"
        }

    if start == target:
        return {
            "path": [start],
            "found": True,
            "meeting_point": start,
            "forward_nodes_explored": 1,
            "backward_nodes_explored": 1,
            "total_nodes_explored": 1,
            "forward_explored": [start],
            "backward_explored": [target],
            "execution_time_ms": (time.perf_counter() - t0) * 1000,
            "algorithm": "Bidirectional BFS"
        }

    q_forward = deque([start])
    visited_forward = {start: None}  # node -> parent
    forward_explored = []

    q_backward = deque([target])
    visited_backward = {target: None}  # node -> child
    backward_explored = []

    meeting_node = None

    while q_forward and q_backward:
        # Step 1: Expand forward level
        if q_forward:
            curr_f = q_forward.popleft()
            forward_explored.append(curr_f)

            if curr_f in visited_backward:
                meeting_node = curr_f
                break

            for nbr in forward_adj.get(curr_f, []):
                if nbr not in visited_forward:
                    visited_forward[nbr] = curr_f
                    q_forward.append(nbr)
                    if nbr in visited_backward:
                        meeting_node = nbr
                        break

            if meeting_node is not None:
                break

        # Step 2: Expand backward level
        if q_backward:
            curr_b = q_backward.popleft()
            backward_explored.append(curr_b)

            if curr_b in visited_forward:
                meeting_node = curr_b
                break

            for nbr in reverse_adj.get(curr_b, []):
                if nbr not in visited_backward:
                    visited_backward[nbr] = curr_b
                    q_backward.append(nbr)
                    if nbr in visited_forward:
                        meeting_node = nbr
                        break

            if meeting_node is not None:
                break

    elapsed_ms = (time.perf_counter() - t0) * 1000

    path = []
    if meeting_node:
        # Reconstruct from start to meeting node
        curr = meeting_node
        path_f = []
        while curr is not None:
            path_f.append(curr)
            curr = visited_forward[curr]
        path_f.reverse()

        # Reconstruct from meeting node child to target
        curr = visited_backward[meeting_node]
        path_b = []
        while curr is not None:
            path_b.append(curr)
            curr = visited_backward[curr]

        path = path_f + path_b

    total_nodes = len(forward_explored) + len(backward_explored)

    return {
        "path": path,
        "found": meeting_node is not None,
        "meeting_point": meeting_node,
        "forward_nodes_explored": len(forward_explored),
        "backward_nodes_explored": len(backward_explored),
        "total_nodes_explored": total_nodes,
        "forward_explored": forward_explored,
        "backward_explored": backward_explored,
        "execution_time_ms": round(elapsed_ms, 3),
        "algorithm": "Bidirectional BFS"
    }
