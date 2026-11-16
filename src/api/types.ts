export type Outcome = "HomeWin" | "Draw" | "AwayWin" | "Pending";

export type MatchDayType = "Liga" | "CopaDelRey" | "Champions";

export type Trust =
  | "MuyBaja"
  | "Baja"
  | "MediaBaja"
  | "Media"
  | "MediaAlta"
  | "Alta"
  | "MuyAlta";

export interface Match {
  id: string;
  home: string;
  away: string;
  date: string;
  result: Outcome | null;
  matchType: MatchDayType;
  matchTrust: Trust;
  createdAt: string;
}

export interface NewMatch { home: string; away: string; date: string | null }
export interface PlayedDates { date: Date }

// Check the request records of AddPrediction and SetResult in your backend:
export interface NewPrediction { /* e.g. predictorId: string; pick: string */ }
export interface SetResultBody { result: Outcome | null }

// Check what each stats handler returns:
export interface MatchStats { /* ... */ }
export interface DayStats { /* ... */ }
export interface PredictorStats { /* ... */ }

export type Prediction = {
  id: string;
  matchId: string;
  predictorId: string;
  picked: Outcome;
};

export interface MatchPrediction {
  match: Match;
  prediction: Prediction | null;
  predictorName: string | null;
}

export type PositionBet = { id: string; name: string; isAuto: boolean };

export type MatchBet = {
  id: string;
  matchId: string;
  positionBetId: string;
  picked: Outcome;
  homeScore: number | null;
  awayScore: number | null;
};

export type MatchWithBets = {
  match: Match;
  bets: { positionBet: PositionBet; bet: MatchBet }[];
};

export type NewPredictor = { name: string };