export type TransportMode = 'train' | 'flight' | 'both';
export type TravelPreference = 'fastest' | 'cheapest' | 'fewest_transfers';

export interface CityInfo {
  name: string;
  code: string;
  lat: number;
  lng: number;
  region: string;
}

export interface TransitSegment {
  id: string;
  mode: 'train' | 'flight';
  carrier: string;
  service_number: string;
  origin: string;
  destination: string;
  dep_time: string;
  arr_time: string;
  duration_min: number;
  base_fare: number;
  distance_km: number;
  typical_delay_min: number;
  current_delay_min: number;
  status: 'On Time' | 'Delayed' | 'Cancelled';
  actual_dep_min?: number;
  actual_arr_min?: number;
  actual_delay_min?: number;
  formatted_dep?: string;
  formatted_arr?: string;
}

export interface ConnectionEvaluation {
  status: 'SAFE_CONNECTION' | 'TIGHT_CONNECTION' | 'MISSED_CONNECTION';
  severity: 'Normal' | 'Warning' | 'Critical';
  transfer_station: string;
  available_buffer_min: number;
  required_buffer_min: number;
  is_missed: boolean;
  is_tight: boolean;
  explanation: string;
}

export interface ItineraryValidation {
  has_missed_connection: boolean;
  has_tight_connection: boolean;
  connection_evaluations: ConnectionEvaluation[];
  overall_status: 'FEASIBLE' | 'RISK' | 'DISRUPTED';
}

export interface AIRiskPrediction {
  predicted_delay_min: number;
  risk_category: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  risk_color: string;
  risk_score_percent: number;
  confidence: number;
  factors: {
    weather_impact: string;
    corridor_congestion: string;
    departure_peak_time: string;
  };
}

export interface RippleStep {
  leg_index: number;
  segment_id: string;
  carrier: string;
  origin: string;
  destination: string;
  scheduled_dep: string;
  effective_dep: string;
  added_delay_min: number;
  status: string;
  impact: string;
}

export interface RippleAnalysis {
  ripple_steps: RippleStep[];
  initial_delay_min: number;
  final_cascaded_delay_min: number;
  itinerary_collapsed: boolean;
  bottleneck_location: string | null;
  summary: string;
}

export interface ItineraryRoute {
  rank: number;
  route_id: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  total_duration_min: number;
  total_duration_formatted: string;
  total_fare: number;
  transfers: number;
  segments: TransitSegment[];
  validation: ItineraryValidation;
  ai_risk: AIRiskPrediction;
  ripple_analysis: RippleAnalysis;
  explanation: string;
  is_recommended: boolean;
}

export interface BFSBenchmark {
  algorithm: string;
  found: boolean;
  path: string[];
  nodes_explored: number;
  explored_sequence: string[];
  execution_time_ms: number;
  meeting_point?: string | null;
  forward_nodes_explored?: number;
  backward_nodes_explored?: number;
  total_nodes_explored?: number;
  forward_explored?: string[];
  backward_explored?: string[];
}

export interface PlanResult {
  origin: string;
  destination: string;
  departure_time: string;
  preference: string;
  algorithm_comparison: {
    standard_bfs: BFSBenchmark;
    bidirectional_bfs: BFSBenchmark;
    speedup_ratio: number;
  };
  original_route: ItineraryRoute | null;
  recommended_route: ItineraryRoute | null;
  alternatives: ItineraryRoute[];
  all_routes: ItineraryRoute[];
  time_saved_min: number;
}

export interface HistoryRecord {
  id: number;
  search_timestamp: string;
  origin: string;
  destination: string;
  travel_date: string;
  departure_time: string;
  transport_type: string;
  preference: string;
  status: string;
  simulated_delay_min: number;
  original_duration_min: number;
  recommended_duration_min: number;
  recommended_route_summary: string;
  time_saved_min: number;
  notes?: string;
}
