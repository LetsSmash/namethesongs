import { ConfigSchema } from "./config";

export interface ScoreSchema {
  id: number;
  user_id: string;
  mode: string;
  rgmbid: string | null;
  mbid: string;
  time: string;
  score: string;
  config?: ConfigSchema;
  created: string;
  deleted: string | null;
}