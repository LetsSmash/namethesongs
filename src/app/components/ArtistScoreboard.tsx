"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import {
  getArtistScoresByMbid,
  getUserArtistScoresByMbid,
} from "@/app/actions";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { getArtistInfo } from "@/app/utils";
import { Artist } from "@/types/artist";
import FormButton from "./FormButton";
import { useRouter } from "next/navigation";
import { ScoreSchema } from "@/types/score";

interface ArtistScoreboardProps {
  mbid: string;
  mode?: "default" | "user";
}

const ArtistScoreboard = ({
  mbid,
  mode = "default",
}: ArtistScoreboardProps) => {
  const [scores, setScores] = useState<ScoreSchema[]>([]);
  const [artistData, setArtistData] = useState<Artist>();
  const [username, setUsername] = useState("");
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  const { userId } = useAuth();
  const router = useRouter();

  // Load current user's username in "user" mode
  useEffect(() => {
    if (mode !== "user" || !userId) return;
    const loadUsername = async () => {
      try {
        const { data } = await axios.get(`/api/getUsernameById/${userId}`);
        setUsername(data);
      } catch (err) {
        console.error("Error fetching username:", err);
        setUsername("No username available");
      }
    };
    loadUsername();
  }, [mode, userId]);

  // Load usernames for scoreboard rows in "default" mode
  useEffect(() => {
    if (mode !== "default" || scores.length === 0) return;

    const missingIds = Array.from(
      new Set(
        scores
          .map((s) => s.user_id)
          .filter((id): id is string => !!id && !usernames[id])
      )
    );

    if (missingIds.length === 0) return;

    const loadUsernames = async () => {
      try {
        const pairs = await Promise.all(
          missingIds.map(async (id) => {
            try {
              const { data } = await axios.get(`/api/getUsernameById/${id}`);
              return [id, data] as const;
            } catch {
              return [id, "Unknown"] as const;
            }
          })
        );
        setUsernames((prev) => {
          const next = { ...prev };
          for (const [id, name] of pairs) next[id] = name;
          return next;
        });
      } catch (err) {
        console.error("Error fetching usernames:", err);
      }
    };

    loadUsernames();
  }, [mode, scores, usernames]);

  // Fetch artist data and scores
  useEffect(() => {
    if (!mbid) return;

    const fetchArtistData = async () => {
      try {
        const response = await getArtistInfo(mbid);
        setArtistData(response);
      } catch (err) {
        console.error("Error fetching artist data:", err);
      }
    };

    const fetchScores = async () => {
      try {
        if (mode === "user") {
          const scoreData = await getUserArtistScoresByMbid(mbid);
          setScores(scoreData);
        } else {
          const scoreData = await getArtistScoresByMbid(mbid);
          setScores(scoreData);
        }
      } catch (err) {
        console.error("Error fetching scores:", err);
        setScores([]);
      }
    };

    fetchArtistData();
    fetchScores();
  }, [mbid, mode]);

  const getUsernameById = (id: string) => usernames[id] ?? "Loading...";

  const parseConfig = (config: string): string[] => {
    try {
      return JSON.parse(config);
    } catch {
      return [];
    }
  };

  return (
    <>
      {scores.length > 0 ? (
        <div className="flex flex-col items-center p-4 bg-white shadow-lg rounded-lg border-gray-200 border-small">
          <h2 className="text-3xl font-bold mb-2 text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary text-center mx-auto">
            {artistData?.name}
          </h2>
          <Table aria-label="Artist highscores table" className="w-full">
            <TableHeader className="text-left">
              <TableColumn>Rank</TableColumn>
              <TableColumn>User</TableColumn>
              <TableColumn>Score</TableColumn>
              <TableColumn>Time</TableColumn>
              <TableColumn>Albums</TableColumn>
            </TableHeader>
            <TableBody>
              {scores.map((score, index) => {
                const albumCount = score.config
                  ? parseConfig(score.config).length
                  : 0;
                return (
                  <TableRow
                    key={score.id ?? index}
                    className={`${
                      index === 0 ? "bg-yellow-100" : "bg-white"
                    } hover:bg-gray-100`}
                  >
                    <TableCell className="font-bold">{index + 1}</TableCell>
                    <TableCell>
                      {mode === "user"
                        ? username
                        : getUsernameById(score.user_id)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {score.score}
                    </TableCell>
                    <TableCell className="text-blue-600">{score.time}</TableCell>
                    <TableCell className="text-gray-600">
                      {albumCount} {albumCount === 1 ? "album" : "albums"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {mode === "user" && (
            <FormButton onPress={() => router.push(`/game/artist/${mbid}`)}>
              Play Again
            </FormButton>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-600 italic">
          No one played this artist yet. Be the first to save your score!
        </div>
      )}
    </>
  );
};

export default ArtistScoreboard;
