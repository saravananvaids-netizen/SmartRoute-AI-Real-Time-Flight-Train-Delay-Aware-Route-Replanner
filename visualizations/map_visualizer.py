"""
SmartRoute AI - Map Visualizer
Builds interactive Folium maps for routing, connection nodes, and Bidirectional BFS meeting points.
"""

from typing import List, Dict, Any, Optional

def create_route_map_html(
    route: Dict[str, Any],
    city_coords: Dict[str, Dict[str, float]],
    meeting_point: Optional[str] = None
) -> str:
    """
    Returns HTML code or Folium Map representation for the journey.
    """
    try:
        import folium

        # Center map on midpoint of India
        m = folium.Map(location=[21.0, 78.5], zoom_start=5, tiles="CartoDB positron")

        segments = route.get("segments", [])
        if not segments:
            return m._repr_html_()

        # Track visited points
        points = []
        for seg in segments:
            u, v = seg["origin"], seg["destination"]
            if u in city_coords:
                points.append((u, city_coords[u]["lat"], city_coords[u]["lng"]))
            if v in city_coords:
                points.append((v, city_coords[v]["lat"], city_coords[v]["lng"]))

        # Draw markers
        for name, lat, lng in points:
            is_meet = (name == meeting_point)
            icon_color = "red" if is_meet else ("green" if name == route["origin"] else ("purple" if name == route["destination"] else "blue"))
            icon_symbol = "star" if is_meet else "info-sign"

            popup_text = f"<b>{name}</b>"
            if is_meet:
                popup_text += "<br><i>🎯 Bidirectional BFS Meeting Point</i>"

            folium.Marker(
                [lat, lng],
                popup=popup_text,
                tooltip=name,
                icon=folium.Icon(color=icon_color, icon=icon_symbol)
            ).add_to(m)

        # Draw segment polylines
        for seg in segments:
            u, v = seg["origin"], seg["destination"]
            if u in city_coords and v in city_coords:
                color = "#2563eb" if seg["mode"] == "flight" else "#059669"
                dash = "5, 5" if seg["mode"] == "flight" else None
                weight = 5 if seg.get("is_replanned") else 4
                
                coords = [
                    [city_coords[u]["lat"], city_coords[u]["lng"]],
                    [city_coords[v]["lat"], city_coords[v]["lng"]]
                ]
                folium.PolyLine(
                    coords,
                    color=color,
                    weight=weight,
                    opacity=0.8,
                    dash_array=dash,
                    tooltip=f"{seg['carrier']} ({seg['mode'].upper()}): {seg['dep_time']} ➔ {seg['arr_time']}"
                ).add_to(m)

        return m._repr_html_()
    except Exception:
        # Fallback raw SVG / HTML if folium is not installed
        return f"<div style='padding:20px; text-align:center;'>Map ready for route {route.get('origin')} ➔ {route.get('destination')}</div>"
