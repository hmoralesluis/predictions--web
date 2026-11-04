export interface Match { id: string; home: string; away: string; date: string; result: string | null }
export interface NewMatch { home: string; away: string; date: string | null }
export interface PlayedDates { date: Date }

// Check the request records of AddPrediction and SetResult in your backend:
export interface NewPrediction { /* e.g. predictorId: string; pick: string */ }
export interface SetResultBody { /* e.g. result: string */ }

// Check what each stats handler returns:
export interface MatchStats { /* ... */ }
export interface DayStats { /* ... */ }
export interface PredictorStats { /* ... */ }