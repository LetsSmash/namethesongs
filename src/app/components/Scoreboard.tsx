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

const Scoreboard = ({ mbid }: { mbid: string }) => {
  const [scores, setScores] = useState<ScoreSchema[]>([]);
  const [username, setUsername] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [artistName, setArtistName] = useState("");

  const { userId } = useAuth();

  interface ScoreSchema {
    id: number;
    user_id: string;
    mode: string;
    mbid: string;
    time: string;
    score: string;
  }

  useEffect(() => {
    if (mbid) {
      getUserScoresByAlbum(mbid)
        .then((result) => {
          setScores(result);
        })
        .catch((error) => {
          console.error("Error fetching scores:", error);
        });
    }
  }, [mbid]);

  const fetchUsername = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`/api/getUsernameById/${userId}`);
      setUsername(response.data);
    } catch (error) {
      console.error("Error fetching username:", error);
      setUsername("Unknown User");
    }
  }, [userId]);

  useEffect(() => {
    fetchUsername();
  }, [fetchUsername]);

  const fetchAlbumInfos = useCallback(async () => {
    if (!mbid) return;
    try {
      const response = await fetchReleaseGroupFromRelease(mbid);
      setAlbumName(response.title);
    } catch (error) {
      console.error("Error fetching album info:", error);
      setAlbumName("Unknown Album");
    }
  }, [mbid]);

  useEffect(() => {
    fetchAlbumInfos();
  }, [fetchAlbumInfos]);

  const fetchArtistName = useCallback(async () => {
    if (!mbid) return;
    try {
      const response = await fetchReleaseGroupFromRelease(mbid);
      setArtistName(response["artist-credit"][0].name);
    } catch (error) {
      console.error("Error fetching artist name:", error);
      setArtistName("Unknown Artist");
    }
  }, [mbid]);

  useEffect(() => {
    fetchArtistName();
  }, [fetchArtistName]);

  return (
    <div className="flex flex-col items-center p-4 bg-white shadow-lg rounded-lg border-gray-200 border-small">
      <h2 className="text-2xl font-bold mb-2">{albumName}</h2>
      <h3 className="text-xl font-semibold mb-4 text-gray-700">by {artistName}</h3>
      <Table aria-label="Highscores table" className="w-full">
        <TableHeader>
          <TableColumn className="text-left">Rank</TableColumn>
          <TableColumn className="text-left">User</TableColumn>
          <TableColumn className="text-left">Score</TableColumn>
          <TableColumn className="text-left">Time</TableColumn>
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
    </div>
  );
};

export default Scoreboard;
