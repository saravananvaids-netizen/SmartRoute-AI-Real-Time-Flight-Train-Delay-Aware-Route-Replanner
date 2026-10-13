"""
SmartRoute AI - Standard Breadth-First Search (BFS)
Baseline unweighted route discovery algorithm.
Used for academic comparison against Bidirectional BFS.
"""

from collections import deque
import time
from typing import List, Dict, Any, Optional

def standard_bfs(graph_adj: Dict[str, List[str]], start: str, target: str) -> Dict[str, Any]:
    """
    Executes standard unidirectional BFS from start to target.
    Returns path, visited nodes count, execution time in ms, and explored nodes sequence.
    """
    t0 = time.perf_counter()
    
    if start not in graph_adj or target not in graph_adj:
        return {
            "path": [],
            "found": False,
            "nodes_explored": 0,
            "explored_sequence": [],
            "execution_time_ms": 0.0,
            "algorithm": "Standard BFS"
        }
        
    if start == target:
        return {
            "path": [start],
            "found": True,
            "nodes_explored": 1,
            "explored_sequence": [start],
            "execution_time_ms": (time.perf_counter() - t0) * 1000,
            "algorithm": "Standard BFS"
        }

    visited = {start}
    parent = {start: None}
    queue = deque([start])
    explored_sequence = []

    found = False
    while queue:
        curr = queue.popleft()
        explored_sequence.append(curr)

        if curr == target:
            found = True
            break

        for neighbor in graph_adj.get(curr, []):
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = curr
                queue.append(neighbor)

    elapsed_ms = (time.perf_counter() - t0) * 1000

    path = []
    if found:
        curr = target
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
        path.reverse()

    return {
        "path": path,
        "found": found,
        "nodes_explored": len(explored_sequence),
        "explored_sequence": explored_sequence,
        "execution_time_ms": round(elapsed_ms, 3),
        "algorithm": "Standard BFS"
    }
