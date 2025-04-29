"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import { useState, useEffect, useCallback } from "react";
import { getUserScoresByAlbum } from "@/app/actions";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { fetchReleaseGroupFromRelease } from "@/app/utils";
import { Release } from "../../types/release";
import FormButton from "./FormButton";
import { useRouter } from "next/navigation";

interface ScoreSchema {
  id: number;
  user_id: string;
  mode: string;
  mbid: string;
  time: string;
  score: string;
}

const Scoreboard = ({ mbid }: { mbid: string }) => {
  const [scores, setScores] = useState<ScoreSchema[]>([]);
  const [albumData, setAlbumData] = useState<Release>();
  const [username, setUsername] = useState("");
  const [trackCount, setTrackCount] = useState(0);

  const { userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    const loadUsername = async () => {
      try {
        const { data } = await axios.get(`/api/getUsernameById/${userId}`);
        setUsername(data);
      } catch (error) {
        console.error("Error fetching username:", error);
        setUsername("No username available");
      }
    };
    loadUsername();
  }, [userId]);

  useEffect(() => {
    if (!mbid) return;
    const fetchAlbumData = async () => {
      try {
        const response = await fetchReleaseGroupFromRelease(mbid);
        setAlbumData(response);
      } catch (error) {
        console.error("Error fetching album data:", error);
      }
    };
    const fetchScores = async () => {
      try {
        const scoreData = await getUserScoresByAlbum(mbid);
        setScores(scoreData);
      } catch (error) {
        console.error("Error fetching scores:", error);
      }
    };
    fetchAlbumData();
    fetchScores();
  }, [mbid]);

  useEffect(() => {
    if (albumData?.media) {
      const totalTracks = albumData.media.reduce(
        (acc, media) => acc + media["track-count"],
        0
      );
      setTrackCount(totalTracks);
    }
  }, [albumData?.media, trackCount]);

  return (
    <div className="flex flex-col items-center p-4 bg-white shadow-lg rounded-lg border-gray-200 border-small">
      <h2 className="text-3xl font-bold mb-2 text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary text-center mx-auto">
        {albumData?.title}
        {albumData?.disambiguation ? (
          <div className="text-xl text-gray-600 mt-1">
            ({albumData.disambiguation}, {trackCount} Tracks)
          </div>
        ) : (
          <div className="text-xl text-gray-600 mt-1">
            ({trackCount} Tracks)
          </div>
        )}
      </h2>
      <h3 className="text-xl font-medium mb-6 text-gray-700 flex items-center gap-2">
        by{" "}
        <span className="font-semibold text-primary">
          {albumData?.["artist-credit"][0].name}
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
              key={index}
              className={`${
                index === 0 ? "bg-yellow-100" : "bg-white"
              } hover:bg-gray-100`}
            >
              <TableCell className="font-bold">{index + 1}</TableCell>
              <TableCell>{username}</TableCell>
              <TableCell className="text-green-600">{score.score}</TableCell>
              <TableCell className="text-blue-600">{score.time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <FormButton onPress={() => router.push(`/game/album/${mbid}`)}>
        Play Album
      </FormButton>
    </div>
  );
};

export default Scoreboard;
