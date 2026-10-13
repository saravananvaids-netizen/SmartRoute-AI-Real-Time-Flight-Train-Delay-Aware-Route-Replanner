-- SmartRoute AI SQLite Database Schema
CREATE TABLE IF NOT EXISTS journey_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    travel_date TEXT,
    departure_time TEXT,
    transport_type TEXT,
    preference TEXT,
    status TEXT,
    simulated_delay_min INTEGER DEFAULT 0,
    original_duration_min INTEGER,
    recommended_duration_min INTEGER,
    recommended_route_summary TEXT,
    time_saved_min INTEGER,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_origin_dest ON journey_searches (origin, destination);
