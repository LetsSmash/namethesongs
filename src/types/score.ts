export interface ScoreSchema {
  id: number;
  user_id: string;
  mode: string;
  rgmbid: string | null;
  mbid: string;
  time: string;
  score: string;
}