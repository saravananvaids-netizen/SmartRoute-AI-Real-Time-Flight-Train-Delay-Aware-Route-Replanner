# SmartRoute AI – Real-Time Flight & Train Delay-Aware Route Replanner

> **College Project & Production-Grade Travel Assistant**  
> Discovers multimodal flight and train alternative journeys, detects missed connections, simulates cascading delays with ripple analysis, and replans itineraries in real time.

---

## 🌟 Key Features

1. **Multimodal Route Search:** Combines Indian Railways and commercial flight schedules.
2. **Bidirectional Breadth-First Search (BFS):** Explores transit network from source and destination concurrently, meeting at an optimal intersection hub and reducing search space from $O(b^d)$ to $O(2 \cdot b^{d/2})$.
3. **Time-Dependent Dijkstra:** Optimizes arrival time taking into account scheduled departure slots, live/simulated delays, and minimum transfer safety buffers (35m for rail, 60m for air, 90m for multimodal transfer).
4. **AI Delay Prediction (Scikit-Learn):** Predicts delay severity and risk probability using historical transit features (hour of day, weather severity, corridor congestion).
5. **What-If Delay Simulator:** Test 15, 30, 45, or 60-minute delay injections to observe how tight connections collapse.
6. **Delay Ripple Waterfall Analysis:** Calculates how an initial delay cascades through subsequent legs.
7. **Missed-Connection Early Warning:** Flags tight layovers and broken connection thresholds before departure.
8. **Explainable AI (XAI):** Natural language justifications for why an alternative route is chosen.
9. **Interactive Visualizations:** Interactive route map with Leaflet/Folium and Plotly comparison charts.
10. **Journey History Database:** SQLite database (`database/smartroute_history.db`) for tracking past queries.
11. **Demonstration Mode:** Verified offline sample datasets that run seamlessly without requiring paid API keys.

---

## 📂 Project Directory Structure

```text
smartroute-ai/
├── app.py                      # Main Streamlit web application
├── requirements.txt            # Python dependencies (Streamlit, Pandas, Sklearn, Plotly, Folium)
├── .env.example                # API key template and demo configuration
├── README.md                   # Complete documentation and setup guide
│
├── algorithms/                 # Graph search and optimization algorithms
│   ├── graph_builder.py        # Directed multimodal transit network builder
│   ├── standard_bfs.py         # Baseline unidirectional BFS algorithm
│   ├── bidirectional_bfs.py    # Bidirectional BFS with meeting point detection
│   └── dijkstra_time_dependent.py # Time-dependent Dijkstra routing engine
│
├── services/                   # Business logic and AI services
│   ├── delay_predictor.py      # Scikit-learn Random Forest delay risk estimator
│   ├── connection_validator.py # Connection feasibility & layover buffer checks
│   ├── ripple_analyzer.py      # Delay ripple cascade waterfall analyzer
│   └── route_replanner.py      # Master replanner service orchestrator
│
├── api_clients/                # External transit API integrations
│   ├── base.py                 # Abstract base transit client with caching & timestamps
│   ├── amadeus_client.py       # Amadeus Flight API client with demo fallback
│   └── rail_radar_client.py    # RailRadar / IRCTC train status client
│
├── visualizations/             # Interactive plotting and mapping
│   ├── map_visualizer.py       # Folium / Leaflet route mapping
│   ├── graph_visualizer.py     # BFS exploration comparison
│   └── metrics_charts.py       # Plotly duration/cost & delay waterfall charts
│
├── database/                   # Persistent local storage
│   ├── schema.sql              # SQLite schema for journey searches
│   └── history_db.py           # SQLite connection and query helper
│
├── sample_data/                # Verified offline demonstration datasets
│   ├── routes.json             # Cities, rail services, flight schedules, fares
│   ├── delays_historical.csv   # Historical delay records for Scikit-learn training
│   └── demo_scenarios.json     # Curated showcase scenarios (e.g. Chennai to Delhi)
│
└── tests/                      # Automated test suite
    ├── test_algorithms.py      # Unit tests for BFS, Bidirectional BFS, and Dijkstra
    ├── test_replanner.py       # Unit tests for replanning & connection validation
    └── test_predictor.py       # Unit tests for AI delay prediction
```

---

## 🖥️ Running on Windows in Visual Studio Code

### Step 1: Open Project in VS Code
1. Open Visual Studio Code.
2. Select **File > Open Folder...** and select the `smartroute-ai` folder.
3. Open the integrated terminal (`Ctrl + ~` or **Terminal > New Terminal**).

### Step 2: Create and Activate a Python Virtual Environment
Run the following commands in the PowerShell / Command Prompt terminal:

```powershell
# Create a virtual environment named 'venv'
python -m venv venv

# Activate the virtual environment on Windows
.\venv\Scripts\Activate.ps1
# If PowerShell script execution is restricted, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
# OR in Command Prompt (cmd.exe):
# venv\Scripts\activate.bat
```

### Step 3: Install Required Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
copy .env.example .env
```
*Note: If you do not have Amadeus or RailRadar API keys, keep `ENABLE_DEMO_MODE=true`. The application will run 100% locally with high-fidelity realistic data.*

### Step 5: Run Automated Unit Tests
Verify all algorithms and services are operating correctly:
```bash
python -m unittest discover tests
```
*Expected output: `Ran 9 tests in 0.005s OK`*

### Step 6: Launch the Web Application
```bash
streamlit run app.py
```
Open your browser at **http://localhost:8501**.

---

## 🎯 College Presentation Showcase: The Chennai to Delhi Scenario

To demonstrate this during your viva or project presentation:
1. Select **Preset:** `Chennai to Delhi (Grand Trunk 30m Delay Collapse)`.
2. Notice the original scheduled itinerary:
   - Leg 1: *Grand Trunk Express (12615)* from **Chennai** to **Nagpur** (Arr 11:30).
   - Leg 2: *Telangana Express (12723)* from **Nagpur** to **Delhi** (Dep 12:15).
   - Layover buffer scheduled: 45 minutes.
3. Click **Simulate 30-Min Delay** on Leg 1.
4. **The Problem:** The arrival at Nagpur shifts to 12:00. The remaining 15-minute layover violates the minimum safety buffer (35 min), collapsing the connection.
5. **The SmartRoute AI Solution:**
   - **Alternative 1 (Multimodal Bypass):** Recommends taking *IndiGo 6E-671* from Nagpur to Delhi (Dep 14:40), saving **915 minutes** over waiting for the next day's train.
   - **Alternative 2 (Direct Morning Flight):** Early morning *IndiGo 6E-2041* direct to Delhi.
   - **Alternative 3 (Resilient Rail via Vijayawada):** Morning *Vande Bharat* connector with a stable 180m transfer window.
6. Point to the **Bidirectional BFS Exploration Metrics**:
   - Highlight the **Meeting Point** node (Nagpur / Central Hub).
   - Show how Bidirectional BFS cut down node visits compared to standard BFS.

---

## ⚙️ Algorithms Explained

### 1. Bidirectional Breadth-First Search (BFS)
- **Goal:** Topological path discovery in an unweighted transit graph.
- **Why it is faster:** Rather than expanding a single search frontier of depth $d$ with branching factor $b$ (costing $O(b^d)$), Bidirectional BFS launches two simultaneous searches of radius $d/2$, meeting at a central hub (costing $O(2 \cdot b^{d/2})$).
- **Academic honesty caveat:** Bidirectional BFS finds the shortest path by *number of transit hops*, not elapsed journey duration. It is paired with Time-Dependent Dijkstra to optimize actual travel time.

### 2. Time-Dependent Dijkstra
- Takes into account departure schedules, live delays, and layover buffers.
- Discards connections whose scheduled departures have already lapsed.
- Weights routes based on user preference:
  - **Fastest:** Minimizes total elapsed minutes (transit + layover).
  - **Cheapest:** Minimizes overall ticket price.
  - **Fewest Transfers:** Penalizes intermediate changeovers.

### 3. AI Delay Risk Model (Scikit-Learn Random Forest)
- Predicts expected delay minutes and assigns a risk tier (Low, Moderate, High).
- Factors: Hour of departure (peak vs off-peak), corridor congestion index, and weather severity.

---

## 🛠️ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `ModuleNotFoundError: No module named 'streamlit'` | Virtual environment not activated | Run `.\venv\Scripts\Activate.ps1` and `pip install -r requirements.txt` |
| `API credentials missing` warning | `.env` has placeholder keys | The app automatically runs in Demonstration Mode with full functionality |
| Map fails to display | Browser blocking inline iframe | Allow scripts or open app at `http://127.0.0.1:8501` |
| PowerShell script execution disabled | Windows security policy | Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` |

---

## 📜 License
Developed for academic demonstrations and open travel intelligence research.
Licensed under the Apache 2.0 License.
