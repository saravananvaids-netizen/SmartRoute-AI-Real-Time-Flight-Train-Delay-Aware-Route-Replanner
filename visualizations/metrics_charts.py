"""
SmartRoute AI - Metrics and Charts Generator
Creates Plotly figures for route comparisons, algorithm speedups, and delay waterfall ripple effects.
"""

from typing import List, Dict, Any, Optional

def create_comparison_bar_chart(routes: List[Dict[str, Any]]):
    try:
        import plotly.graph_objects as go

        labels = [f"Route #{r['rank']} ({r['segments'][0]['mode'].capitalize()})" for r in routes]
        durations = [r["total_duration_min"] / 60 for r in routes]
        fares = [r["total_fare"] for r in routes]

        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=labels,
            y=durations,
            name="Duration (Hours)",
            marker_color="#2563eb"
        ))
        fig.add_trace(go.Bar(
            x=labels,
            y=[f / 200 for f in fares],  # Normalized scale for dual comparison
            name="Cost Index (Fare / 200)",
            marker_color="#10b981"
        ))

        fig.update_layout(
            title="Alternative Routes: Travel Duration vs Cost Index",
            barmode="group",
            template="plotly_white",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)"
        )
        return fig
    except Exception:
        return None

def create_ripple_waterfall_chart(ripple_data: Dict[str, Any]):
    try:
        import plotly.graph_objects as go

        steps = ripple_data.get("ripple_steps", [])
        if not steps:
            return None

        x_labels = [f"{s['origin']} ➔ {s['destination']}" for s in steps]
        y_delays = [s["added_delay_min"] for s in steps]

        fig = go.Figure(go.Waterfall(
            name="Delay Ripple",
            orientation="v",
            measure=["relative"] * len(steps),
            x=x_labels,
            textposition="outside",
            text=[f"+{d}m" if d > 0 else "0m" for d in y_delays],
            y=y_delays,
            connector={"line": {"color": "rgb(63, 63, 63)"}},
            decreasing={"marker": {"color": "#10b981"}},
            increasing={"marker": {"color": "#ef4444"}},
            totals={"marker": {"color": "#6366f1"}}
        ))

        fig.update_layout(
            title="Delay Ripple Analysis: Delay Waterfall across Journey Legs",
            template="plotly_white",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)"
        )
        return fig
    except Exception:
        return None
