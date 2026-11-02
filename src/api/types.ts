export interface Match { id: string; home: string; away: string; date: string; result: string | null }
export interface Prediction { id: string; matchId: string; predictorId: string; pick: string }
export interface Predictor { id: string; name: string }
export interface Snapshot {
  matches: Match[];
  predictions: Prediction[];
  predictors: Record<string, Predictor>; // IReadOnlyDictionary<Guid, Predictor> -> JSON object
}
export interface NewMatch { home: string; away: string; date: string | null }