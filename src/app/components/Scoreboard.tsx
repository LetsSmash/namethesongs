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
  getScoresByAlbum,
  getScoresByReleaseGroup,
  getUserScoresByAlbum,
  getUserScoresByReleaseGroup,
} from "@/app/actions";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { fetchAlbumInfos, fetchReleaseGroupFromRelease } from "@/app/utils";
import { Release } from "../../types/release";
import { Group } from "../../types/releasegroup";
import { useRouter } from "next/navigation";
import FormButton from "./FormButton";
import { ScoreSchema } from "@/types/score";

interface ScoreboardProps {
  mbid: string;
  mode?: "default" | "user";
  types?: "release" | "releasegroup";
  showPlayButton?: boolean;
}

const Scoreboard = ({
  mbid,
  mode = "default",
  types = "release",
  showPlayButton = false,
}: ScoreboardProps) => {
  const [scores, setScores] = useState<ScoreSchema[]>([]);
  const [albumData, setAlbumData] = useState<Release | Group>();
  const [username, setUsername] = useState("");
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [trackCount, setTrackCount] = useState(0);

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

  // Fetch album/group data and scores
  useEffect(() => {
    if (!mbid) return;

    const fetchAlbumData = async () => {
      try {
        if (types === "release") {
          const response = await fetchReleaseGroupFromRelease(mbid);
          setAlbumData(response);
        } else {
          const response = await fetchAlbumInfos(mbid);
          setAlbumData(response);
        }
      } catch (err) {
        console.error("Error fetching album data:", err);
      }
    };

    const fetchScores = async () => {
      try {
        if (mode === "user") {
          if (types === "release") {
            const scoreData = await getUserScoresByAlbum(mbid);
            setScores(scoreData);
          } else {
            const scoreData = await getUserScoresByReleaseGroup(mbid);
            setScores(scoreData);
          }
        } else {
          if (types === "release") {
            const scoreData = await getScoresByAlbum(mbid);
            setScores(scoreData);
          } else {
            const scoreData = await getScoresByReleaseGroup(mbid);
            setScores(scoreData);
          }
        }
      } catch (err) {
        console.error("Error fetching scores:", err);
        setScores([]);
      }
    };

    fetchAlbumData();
    fetchScores();
  }, [mbid, types, mode]);

  // Compute track count
  useEffect(() => {
    if (!albumData) return;

    if ("media" in albumData && Array.isArray(albumData.media)) {
      const totalTracks = albumData.media.reduce((acc, media: any) => {
        const n = Number(media?.["track-count"] ?? 0);
        return acc + (Number.isFinite(n) ? n : 0);
      }, 0 as number);
      setTrackCount(totalTracks);
    } else {
      // For release groups or if media is not present, don't show track count
      setTrackCount(0);
    }
  }, [albumData]);

  const getUsernameById = (id: string) => usernames[id] ?? "Loading...";

  // Build details line: show disambiguation and track count (only if > 0)
  const details: string[] = [];
  const disambiguation = (albumData as any)?.disambiguation;
  if (disambiguation) details.push(disambiguation);
  if (trackCount > 0) details.push(`${trackCount} Tracks`);

  return (
    <>
      {scores.length > 0 ? (
        <div className="flex flex-col items-center p-4 bg-white shadow-lg rounded-lg border-gray-200 border-small">
          <h2 className="text-3xl font-bold mb-2 text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary text-center mx-auto">
            {albumData && (albumData as any).title}
            {details.length > 0 && (
              <div className="text-xl text-gray-600 mt-1">
                ({details.join(", ")})
              </div>
            )}
          </h2>
          <h3 className="text-xl font-medium mb-6 text-gray-700 flex items-center gap-2">
            by{" "}
            <span className="font-semibold text-primary">
              {albumData &&
                "artist-credit" in (albumData as any) &&
                Array.isArray((albumData as any)["artist-credit"]) &&
                (albumData as any)["artist-credit"][0]?.name}
            </span>
          </h3>
          <Table aria-label="Highscores table" className="w-full">
            <TableHeader className="text-left">
              <TableColumn>Rank</TableColumn>
              <TableColumn>User</TableColumn>
              <TableColumn>Score</TableColumn>
              <TableColumn>Time</TableColumn>
            </TableHeader>
            <TableBody>
              {scores.map((score, index) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {showPlayButton && mode === "user" && types === "release" && (
            <FormButton onPress={() => router.push(`/game/album/${mbid}`)}>
              Play Album
            </FormButton>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-600 italic">
          No one played this album yet. Be the first to save your score!
        </div>
      )}
    </>
  );
};

export default Scoreboard;
