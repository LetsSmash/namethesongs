"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  useDisclosure,
  Modal,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalContent,
  Tooltip,
} from "@heroui/react";
import { useEffect, useState } from "react";
import {
  getScoresByAlbum,
  getScoresByReleaseGroup,
  getUserScoresByAlbum,
  getUserScoresByReleaseGroup,
  getArtistScoresByMbid,
  getUserArtistScoresByMbid,
} from "@/app/actions";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import {
  fetchAlbumInfos,
  fetchReleaseGroupFromRelease,
  getArtistInfo,
  parseConfig,
} from "@/app/utils";
import { Release } from "../../types/release";
import { Group } from "../../types/releasegroup";
import { Artist } from "@/types/artist";
import FormButton from "./FormButton";
import { useRouter } from "next/navigation";
import { ScoreSchema } from "@/types/score";
import { ConfigSchema } from "@/types/config";
import { AlbumList } from "./AlbumList";
import { format, formatDistanceToNow } from "date-fns";
import { config } from "dotenv";

interface ScoreboardProps {
  mbid: string;
  mode?: "default" | "user";
  types?: "release" | "releasegroup" | "artist";
  configMode?: "this" | "all";
  currentConfig?: string;
  showPlayButton?: boolean;
}

const Scoreboard = ({
  mbid,
  mode = "default",
  types = "release",
  configMode = "this",
  currentConfig,
  showPlayButton = false,
}: ScoreboardProps) => {
  const [scores, setScores] = useState<ScoreSchema[]>([]);
  const [allScores, setAllScores] = useState<ScoreSchema[]>([]);
  const [entityData, setEntityData] = useState<Release | Group | Artist>();
  const [username, setUsername] = useState("");
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [trackCount, setTrackCount] = useState(0);
  const [selectedConfig, setSelectedConfig] = useState<ConfigSchema | null>(
    null
  );

  const { userId } = useAuth();
  const router = useRouter();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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

  // Fetch entity data and scores
  useEffect(() => {
    if (!mbid) return;

    const fetchEntityData = async () => {
      try {
        if (types === "release") {
          const response = await fetchReleaseGroupFromRelease(mbid);
          setEntityData(response);
        } else if (types === "releasegroup") {
          const response = await fetchAlbumInfos(mbid);
          setEntityData(response);
        } else if (types === "artist") {
          const response = await getArtistInfo(mbid);
          setEntityData(response);
        }
      } catch (err) {
        console.error("Error fetching entity data:", err);
      }
    };

    const fetchScores = async () => {
      try {
        if (mode === "user") {
          if (types === "release") {
            const scoreData = await getUserScoresByAlbum(mbid);
            setAllScores(scoreData);
          } else if (types === "releasegroup") {
            const scoreData = await getUserScoresByReleaseGroup(mbid);
            setAllScores(scoreData);
          } else if (types === "artist") {
            const scoreData = await getUserArtistScoresByMbid(mbid);
            setAllScores(scoreData);
          }
        } else {
          if (types === "release") {
            const scoreData = await getScoresByAlbum(mbid);
            setAllScores(scoreData);
          } else if (types === "releasegroup") {
            const scoreData = await getScoresByReleaseGroup(mbid);
            setAllScores(scoreData);
          } else if (types === "artist") {
            const scoreData = await getArtistScoresByMbid(mbid);
            setAllScores(scoreData);
          }
        }
      } catch (err) {
        console.error("Error fetching scores:", err);
        setAllScores([]);
      }
    };

    fetchEntityData();
    fetchScores();
  }, [mbid, types, mode]);

  // Filter scores based on configMode
  useEffect(() => {
    if (types === "artist" && configMode === "this" && currentConfig) {
      // Filter scores to only show those with the current configuration
      const filtered = allScores.filter(
        (score) => score.config && score.config.config === currentConfig
      );
      setScores(filtered);
    } else {
      // Show all scores
      setScores(allScores);
    }
  }, [allScores, configMode, currentConfig, types]);

  // Compute track count for releases
  useEffect(() => {
    if (!entityData || types === "artist") return;

    if ("media" in entityData && Array.isArray(entityData.media)) {
      const totalTracks = entityData.media.reduce((acc, media: any) => {
        const n = Number(media?.["track-count"] ?? 0);
        return acc + (Number.isFinite(n) ? n : 0);
      }, 0 as number);
      setTrackCount(totalTracks);
    } else {
      setTrackCount(0);
    }
  }, [entityData, types]);

  const getUsernameById = (id: string) => usernames[id] ?? "Loading...";

  const renderTableColumns = () => {
    const baseColumns = [
      <TableColumn key="rank">Rank</TableColumn>,
      <TableColumn key="user">User</TableColumn>,
      <TableColumn key="score">Score</TableColumn>,
      <TableColumn key="time">Time</TableColumn>,
    ];

    if (types === "artist" && configMode !== "this") {
      baseColumns.push(<TableColumn key="albums">Albums</TableColumn>);
    }

    return baseColumns;
  };

  const renderTableRow = (score: ScoreSchema, index: number) => {
    const albumCount = score.config
      ? parseConfig(score.config.config).filter((id) => id != "").length
      : 0;

    const baseCells = [
      <TableCell key="rank" className="font-bold">
        {index + 1}
      </TableCell>,
      <TableCell key="user">
        {mode === "user" ? username : getUsernameById(score.user_id)}
        <Tooltip content={format(new Date(score.created), "PPPpp")}>
          <span className="text-gray-500 text-xs">{` (${formatDistanceToNow(new Date(score.created), { addSuffix: true })})`}</span>
        </Tooltip>
      </TableCell>,
      <TableCell key="score" className="text-green-600">
        {score.score}
      </TableCell>,
      <TableCell key="time" className="text-blue-600">
        {score.time}
      </TableCell>,
    ];

    if (types === "artist" && configMode !== "this") {
      baseCells.push(
        <TableCell key="albums" className="text-gray-600">
          <button
            onClick={() => {
              if (score.config) {
                setSelectedConfig(score.config);
                onOpen();
              }
            }}
            className="hover:underline hover:text-blue-600 cursor-pointer"
          >
            {albumCount} {albumCount === 1 ? "album" : "albums"}
          </button>
        </TableCell>
      );
    }

    return (
      <TableRow
        key={score.id ?? index}
        className={`${index === 0 ? "bg-yellow-100" : "bg-white"} hover:bg-gray-100`}
      >
        {baseCells}
      </TableRow>
    );
  };

  // Build details line: show disambiguation and track count (only if > 0)
  const details: string[] = [];
  if (types !== "artist") {
    const disambiguation = (entityData as any)?.disambiguation;
    if (disambiguation) details.push(disambiguation);
    if (trackCount > 0) details.push(`${trackCount} Tracks`);
  }

  // Determine title and artist name
  const title =
    types === "artist"
      ? (entityData as Artist)?.name
      : (entityData as Release | Group)?.title;

  const artistName =
    types !== "artist" && entityData && "artist-credit" in (entityData as any)
      ? (entityData as any)["artist-credit"]?.[0]?.name
      : undefined;

  // Determine play button route
  const getPlayRoute = () => {
    if (types === "release") return `/game/album/${mbid}`;
    if (types === "artist") return `/game/artist/${mbid}`;
    return null;
  };

  const playRoute = getPlayRoute();

  return (
    <>
      {scores.length > 0 ? (
        <div className="flex flex-col items-center p-4 bg-white shadow-lg rounded-lg border-gray-200 border-small">
          <h2 className="text-3xl font-bold mb-2 text-gradient bg-clip-text text-transparent bg-linear-to-r from-primary to-secondary text-center mx-auto">
            {title}
            {details.length > 0 && (
              <div className="text-xl text-gray-600 mt-1">
                ({details.join(", ")})
              </div>
            )}
          </h2>
          {artistName && (
            <h3 className="text-xl font-medium mb-6 text-gray-700 flex items-center gap-2">
              by{" "}
              <span className="font-semibold text-primary">{artistName}</span>
            </h3>
          )}
          <Table aria-label="Highscores table" className="w-full">
            <TableHeader className="text-left">
              {renderTableColumns()}
            </TableHeader>
            <TableBody>
              {scores.map((score, index) => renderTableRow(score, index))}
            </TableBody>
          </Table>
          {mode === "user" && playRoute && showPlayButton && (
            <FormButton onPress={() => router.push(playRoute)}>
              {types === "artist" ? "Play Again" : "Play Album"}
            </FormButton>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-600 italic">
          No one played this {types === "artist" ? "artist" : "album"} yet. Be
          the first to save your score!
        </div>
      )}
      {selectedConfig && (
        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          size="2xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  <h2 className="text-2xl font-bold">Selected Albums</h2>
                </ModalHeader>
                <ModalBody>
                  <AlbumList config={selectedConfig} />
                </ModalBody>
                <ModalFooter>
                  <Button color="primary" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default Scoreboard;
