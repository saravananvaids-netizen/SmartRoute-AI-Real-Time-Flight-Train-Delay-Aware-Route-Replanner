"""
SmartRoute AI – Real-Time Flight & Train Delay-Aware Route Replanner
Streamlit Main Web Application Entry Point
"""

import streamlit as st
import datetime
import os
import json
from dotenv import load_dotenv

# Load local environment
load_dotenv()

from algorithms.graph_builder import TransportGraph
from algorithms.standard_bfs import standard_bfs
from algorithms.bidirectional_bfs import bidirectional_bfs
from services.route_replanner import RouteReplannerService
from services.connection_validator import validate_full_itinerary
from services.ripple_analyzer import analyze_delay_ripple
from api_clients.amadeus_client import AmadeusFlightClient
from api_clients.rail_radar_client import RailRadarTrainClient
from database.history_db import save_journey_record, get_recent_searches
from visualizations.metrics_charts import create_comparison_bar_chart, create_ripple_waterfall_chart
from visualizations.map_visualizer import create_route_map_html

# Page configuration
st.set_page_config(
    page_title="SmartRoute AI – Your Journey, Replanned.",
    page_icon="🧭",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom clean CSS (White and light-blue modern theme)
st.markdown("""
<style>
    .main {
        background-color: #f8fafc;
    }
    .stApp {
        background: #f8fafc;
    }
    h1, h2, h3 {
        color: #0f172a;
        font-family: 'Inter', -apple-system, sans-serif;
    }
    .hero-container {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        padding: 2.2rem;
        border-radius: 1rem;
        border: 1px solid #bfdbfe;
        margin-bottom: 2rem;
    }
    .route-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        margin-bottom: 1.25rem;
    }
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .badge-on-time { background-color: #dcfce7; color: #166534; }
    .badge-delayed { background-color: #fee2e2; color: #991b1b; }
    .badge-replanned { background-color: #e0e7ff; color: #3730a3; }
</style>
""", unsafe_allow_html=True)

# Initialize services
@st.cache_resource
def get_services():
    replanner = RouteReplannerService()
    flight_client = AmadeusFlightClient()
    train_client = RailRadarTrainClient()
    return replanner, flight_client, train_client

replanner_service, flight_api, train_api = get_services()
graph = replanner_service.graph
available_cities = sorted(list(graph.cities.keys()))

# Sidebar: Configuration and Live API Status
with st.sidebar:
    st.subheader("📡 Live Transport Services")
    
    # Check API Key statuses
    amadeus_status = "Live" if flight_api.client_id else "Demo Mode (Sample Data)"
    rail_status = "Live" if train_api.api_key else "Demo Mode (Sample Data)"
    
    st.info(f"**Amadeus Flight API:**\n`{amadeus_status}`\n\n**RailRadar Train API:**\n`{rail_status}`")
    
    st.caption("ℹ️ Demo mode provides verified Indian transit schedules and realistic disruption scenarios when API credentials are unconfigured.")
    
    st.divider()
    st.subheader("🎓 College Showcase Presets")
    selected_preset = st.selectbox(
        "Load Demonstration Case:",
        ["Custom Query", "Chennai to Delhi (Grand Trunk 30m Delay Collapse)", "Chennai to Delhi (Direct Flight vs Rail)"]
    )
    
    st.divider()
    st.subheader("🕒 Recent Search History")
    history = get_recent_searches(limit=5)
    if history:
        for item in history:
            st.caption(f"📍 {item['origin']} ➔ {item['destination']} ({item['transport_type'].capitalize()})")
    else:
        st.caption("No recent searches yet.")

# Main Header
st.markdown("""
<div class="hero-container">
    <h1 style="margin-bottom: 0.5rem; color: #1e3a8a;">SmartRoute AI – Your Journey, Replanned.</h1>
    <p style="font-size: 1.15rem; color: #334155; margin-bottom: 0;">
        Travel disruptions happen. SmartRoute AI helps you discover alternative journeys and make better travel decisions.
    </p>
</div>
""", unsafe_allow_html=True)

# Preset autofill handling
default_origin = "Chennai"
default_dest = "Delhi"
default_delay = 0

if "Grand Trunk 30m Delay" in selected_preset:
    default_origin = "Chennai"
    default_dest = "Delhi"
    default_delay = 30
elif "Direct Flight" in selected_preset:
    default_origin = "Chennai"
    default_dest = "Delhi"
    default_delay = 0

# Search Form
with st.form("journey_search_form"):
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        origin_city = st.selectbox("Starting City / Station", available_cities, index=available_cities.index(default_origin) if default_origin in available_cities else 0)
    with col2:
        dest_city = st.selectbox("Destination City / Station", available_cities, index=available_cities.index(default_dest) if default_dest in available_cities else 1)
    with col3:
        travel_date = st.date_input("Travel Date", value=datetime.date.today())
    with col4:
        dep_time = st.time_input("Preferred Departure Time", value=datetime.time(6, 0))

    col5, col6, col7 = st.columns(3)
    with col5:
        transport_type = st.selectbox("Transport Mode", ["Both", "Train", "Flight"])
    with col6:
        preference = st.selectbox("Optimization Preference", ["Fastest", "Cheapest", "Fewest Transfers"])
    with col7:
        budget = st.number_input("Maximum Budget (₹ INR, 0 for unlimited)", min_value=0, value=0, step=500)

    st.write("---")
    sim_col1, sim_col2 = st.columns([1, 2])
    with sim_col1:
        simulate_delay = st.checkbox("Simulate a Delay on Connection", value=(default_delay > 0))
    with sim_col2:
        simulated_delay_mins = st.slider("Simulated Delay Duration (Minutes)", 0, 120, value=default_delay, step=15)

    btn_col1, btn_col2 = st.columns([1, 4])
    with btn_col1:
        submitted = st.form_submit_button("Find My Route", type="primary")
    with btn_col2:
        demo_btn = st.form_submit_button("Simulate 30-Min Delay")

if demo_btn:
    simulate_delay = True
    simulated_delay_mins = 30
    submitted = True

# Process Search
if submitted:
    if origin_city == dest_city:
        st.error("Starting city and destination cannot be identical. Please pick distinct hubs.")
    else:
        with st.spinner("Analyzing routes, executing Bidirectional BFS, and predicting connection risks..."):
            dep_time_str = dep_time.strftime("%H:%M")
            pref_key = preference.lower().replace(" ", "_")
            mode_key = transport_type.lower()

            active_delays = {}
            if simulate_delay and simulated_delay_mins > 0:
                active_delays["TR-101"] = simulated_delay_mins
                active_delays["FL-202"] = simulated_delay_mins

            results = replanner_service.plan_or_replan(
                origin=origin_city,
                destination=dest_city,
                dep_time=dep_time_str,
                transport_type=mode_key,
                preference=pref_key,
                max_budget=float(budget) if budget > 0 else None,
                simulated_delays=active_delays
            )

            # Persist search history
            rec_route = results.get("recommended_route")
            if rec_route:
                save_journey_record(
                    origin=origin_city,
                    destination=dest_city,
                    travel_date=str(travel_date),
                    departure_time=dep_time_str,
                    transport_type=mode_key,
                    preference=pref_key,
                    status=rec_route.get("validation", {}).get("overall_status", "FEASIBLE"),
                    simulated_delay_min=simulated_delay_mins if simulate_delay else 0,
                    original_duration_min=results.get("original_route", {}).get("total_duration_min", 0),
                    recommended_duration_min=rec_route.get("total_duration_min", 0),
                    recommended_route_summary=f"{len(rec_route['segments'])} legs via {[s['origin'] for s in rec_route['segments']]}",
                    time_saved_min=results.get("time_saved_min", 0)
                )

        # RESULTS SECTION
        st.subheader("🎯 Journey Results & Replanning Analysis")
        
        algo_comp = results["algorithm_comparison"]
        std_bfs = algo_comp["standard_bfs"]
        bi_bfs = algo_comp["bidirectional_bfs"]
        speedup = algo_comp["speedup_ratio"]

        # Metric banners
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Recommended Duration", rec_route["total_duration_formatted"] if rec_route else "N/A")
        m2.metric("Estimated Fare", f"₹{rec_route['total_fare']:,}" if rec_route else "N/A")
        m3.metric("Transfers", rec_route["transfers"] if rec_route else 0)
        m4.metric("Time Saved", f"{results['time_saved_min']} min" if results['time_saved_min'] > 0 else "Optimal Direct")

        st.write("---")

        # Explainable AI & Connection Validation
        val_status = rec_route.get("validation", {}) if rec_route else {}
        if val_status.get("has_missed_connection"):
            st.warning("⚠️ Original itinerary experienced connection collapse due to delay. Displaying rerouted alternative below.")
        
        st.success(f"**Explainable AI Recommendation:** {rec_route['explanation']}")

        # Primary Recommended Journey Card
        st.markdown(f"### 🚀 Selected Recommended Route: {rec_route['route_id']}")
        
        for idx, leg in enumerate(rec_route["segments"]):
            col_l1, col_l2, col_l3, col_l4 = st.columns([3, 2, 2, 2])
            with col_l1:
                st.write(f"**Leg {idx+1}: {leg['origin']} ➔ {leg['destination']}**")
                st.caption(f"Operator: {leg['carrier']} ({leg['mode'].upper()})")
            with col_l2:
                st.write(f"Departure: **{leg.get('formatted_dep', leg['dep_time'])}**")
                st.caption(f"Scheduled: {leg['dep_time']}")
            with col_l3:
                st.write(f"Arrival: **{leg.get('formatted_arr', leg['arr_time'])}**")
                st.caption(f"Duration: {leg['duration_min']//60}h {leg['duration_min']%60}m")
            with col_l4:
                status_color = "badge-delayed" if leg.get("actual_delay_min", 0) > 0 else "badge-on-time"
                delay_txt = f"+{leg['actual_delay_min']}m Delay" if leg.get("actual_delay_min", 0) > 0 else "On Time"
                st.markdown(f"<span class='status-badge {status_color}'>{delay_txt}</span>", unsafe_allow_html=True)
                st.caption(f"Fare: ₹{leg['base_fare']:,}")

        # Ripple analysis chart
        if rec_route.get("ripple_analysis"):
            st.subheader("🌊 Delay Ripple Analysis (Cascade Waterfall)")
            ripple_chart = create_ripple_waterfall_chart(rec_route["ripple_analysis"])
            if ripple_chart:
                st.plotly_chart(ripple_chart, use_container_width=True)
            st.info(rec_route["ripple_analysis"]["summary"])

        # Map Visualization
        st.subheader("🗺️ Interactive Route Map")
        map_html = create_route_map_html(rec_route, graph.cities, meeting_point=bi_bfs.get("meeting_point"))
        st.components.v1.html(map_html, height=450)

        # Algorithm Analysis Section
        st.subheader("🔬 Algorithm Benchmark: Bidirectional BFS vs Standard BFS")
        b1, b2, b3 = st.columns(3)
        b1.metric("Standard BFS Explored", f"{std_bfs['nodes_explored']} nodes")
        b2.metric("Bidirectional BFS Explored", f"{bi_bfs['total_nodes_explored']} nodes")
        b3.metric("Exploration Reduction", f"{algo_comp['speedup_ratio']}x fewer checks")

        st.caption(
            f"**Search Intersection Meeting Node:** `{bi_bfs.get('meeting_point')}`. "
            "Bidirectional BFS traverses simultaneously from origin and destination, meeting at the hub midpoint to eliminate combinatorial branching."
        )

        # Alternative routes comparison
        if results.get("alternatives"):
            st.subheader("⚖️ Smart Route Comparison")
            comp_chart = create_comparison_bar_chart([rec_route] + results["alternatives"])
            if comp_chart:
                st.plotly_chart(comp_chart, use_container_width=True)
