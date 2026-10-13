"""
SmartRoute AI - SQLite Journey History Manager
Stores user queries, simulated delays, and replanning outcomes.
"""

import sqlite3
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "smartroute_history.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    try:
        if os.path.exists(SCHEMA_PATH):
            with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
                conn.executescript(f.read())
        conn.commit()
    finally:
        conn.close()

def save_journey_record(
    origin: str,
    destination: str,
    travel_date: str,
    departure_time: str,
    transport_type: str,
    preference: str,
    status: str,
    simulated_delay_min: int,
    original_duration_min: int,
    recommended_duration_min: int,
    recommended_route_summary: str,
    time_saved_min: int,
    notes: str = ""
) -> int:
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO journey_searches (
                origin, destination, travel_date, departure_time,
                transport_type, preference, status, simulated_delay_min,
                original_duration_min, recommended_duration_min,
                recommended_route_summary, time_saved_min, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                origin, destination, travel_date, departure_time,
                transport_type, preference, status, simulated_delay_min,
                original_duration_min, recommended_duration_min,
                recommended_route_summary, time_saved_min, notes
            )
        )
        conn.commit()
        return cursor.lastrowid or 0
    finally:
        conn.close()

def get_recent_searches(limit: int = 10) -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM journey_searches 
            ORDER BY search_timestamp DESC 
            LIMIT ?
            """,
            (limit,)
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def clear_history():
    init_db()
    conn = get_connection()
    try:
        conn.execute("DELETE FROM journey_searches")
        conn.commit()
    finally:
        conn.close()
