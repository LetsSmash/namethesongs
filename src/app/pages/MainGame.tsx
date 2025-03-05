"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import FormInput from "@/app/components/FormInput";
import Countdown, { CountdownApi } from "react-countdown";
import FormButton from "@/app/components/FormButton";
import { useRouter, useSearchParams } from "next/navigation";
import { TracklistRoot, Track } from "@/types/tracklist";
import { Release } from "@/types/release";
import { ArtistCredit, Group } from "@/types/releasegroup";
import { fetchAlbumInfos, normalizeString } from "../utils";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@nextui-org/react";
import {
  SignedOut,
  SignedIn,
  useAuth,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { createScore, getScoresByAlbum } from "../actions";

interface GameState {
  releaseMBID: string;
  albumName: string;
  artistName: string;
  songs: Track[];
  correctGuesses: string[];
  remainingMinutes: number;
  remainingSeconds: number;
  elapsedMinutes: number;
  elapsedSeconds: number;
  hasEnded: boolean;
  stopped: boolean;
}

interface ScoreSchema {
  id: number;
  user_id: string;
  mode: string;
  mbid: string;
  time: string;
  score: string;
}

const MainGame = (props: { album: string }) => {
  const [releaseMBID, setReleaseMBID] = useState<Release["id"]>("");
  const [albumName, setAlbumName] = useState<Group["title"]>("");
  const [artistName, setArtistName] = useState<ArtistCredit["name"]>("");
  const [songs, setSongs] = useState<Track[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [correctGuesses, setCorrectGuesses] = useState<string[]>([]);
  const [endTime] = useState(Date.now() + 5 * 60000);
  const [stopped, setStopped] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restoringState, setRestoringState] = useState(false);
  const [scores, setScores] = useState<ScoreSchema[]>([]);
  const [usernames, setUsernames] = useState<{ [key: string]: string }>({});
  const [scoreSaved, setScoreSaved] = useState(false);

  const {
    isOpen: isHighscoresOpen,
    onOpen: onHighscoresOpen,
    onOpenChange: onHighscoresOpenChange,
  } = useDisclosure();
  const {
    isOpen: isSaveScoreOpen,
    onOpen: onSaveScoreOpen,
    onOpenChange: onSaveScoreOpenChange,
  } = useDisclosure();

  const { isSignedIn } = useAuth();

  const router = useRouter();

  const countdownRef = useRef<Countdown>(null);

  // This is done to keep the game state, even when the user refreshes the page (or in this case, authenticates via google)
  const saveGameState = () => {
    const gameState: GameState = {
      releaseMBID,
      albumName,
      artistName,
      songs,
      correctGuesses,
      remainingMinutes,
      remainingSeconds,
      elapsedMinutes,
      elapsedSeconds,
      hasEnded,
      stopped,
    };

    localStorage.setItem("gameState", JSON.stringify(gameState));
    localStorage.setItem("gameStateTimestamp", Date.now().toString());
  };

  const restoreGameState = useCallback(() => {
    try {
      const savedState = localStorage.getItem("gameState");
      const timestamp = localStorage.getItem("gameStateTimestamp");

      if (savedState && timestamp) {
        const now = Date.now();
        const savedTime = parseInt(timestamp);

        if (now - savedTime < 10 * 60 * 1000) {
          const gameState: GameState = JSON.parse(savedState);

          setReleaseMBID(gameState.releaseMBID);
          setAlbumName(gameState.albumName);
          setArtistName(gameState.artistName);
          setSongs(gameState.songs);
          setCorrectGuesses(gameState.correctGuesses);
          setRemainingMinutes(gameState.remainingMinutes);
          setRemainingSeconds(gameState.remainingSeconds);
          setElapsedMinutes(gameState.elapsedMinutes);
          setElapsedSeconds(gameState.elapsedSeconds);
          setHasEnded(gameState.hasEnded);
          setStopped(gameState.stopped);
          setLoaded(true);
          setRestoringState(true);

          localStorage.removeItem("gameState");
          localStorage.removeItem("gameStateTimestamp");

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error restoring game state:", error);
      return false;
    }
  }, []);

  const fetchTracklist = useCallback(async () => {
    const { data } = await axios.get<TracklistRoot>(
      `https://musicbrainz.org/ws/2/release/${releaseMBID}`,
      {
        params: {
          fmt: "json",
          inc: "recordings+release-groups",
        },
        headers: {
          "User-Agent": "GuessTheSongs/0.1",
        },
      }
    );
    setLoaded(true);
    const albumInfos = await fetchAlbumInfos(data["release-group"].id);
    setAlbumName(albumInfos.title);
    setArtistName(albumInfos["artist-credit"][0].name);
    const tracklist: Track[] = data.media.flatMap((medium) => {
      return medium.tracks;
    });
    const fetchedSongs = tracklist.map((track: Track, index: number) => ({
      position: index + 1,
      title: track.title,
    }));
    setSongs(fetchedSongs);
  }, [releaseMBID]);

  const inputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const guess = e.target.value;
    setCurrentGuess(guess);

    const correctGuess = songs.find(
      (song) => normalizeString(song.title) === normalizeString(guess)
    );
    if (correctGuess && !correctGuesses.includes(correctGuess.title)) {
      setCorrectGuesses([...correctGuesses, correctGuess.title]);
      setCurrentGuess("");
    }
  };

  const gameEnd = () => {
    setHasEnded(true);
  };

  const stopCountdown = () => {
    if (countdownRef.current) {
      countdownRef.current.pause();
      const remainingMinutes = countdownRef.current.getRenderProps().minutes;
      const remainingSeconds = countdownRef.current.getRenderProps().seconds;
      setRemainingMinutes(remainingMinutes);
      setRemainingSeconds(remainingSeconds);
      setElapsedMinutes(4 - remainingMinutes);
      setElapsedSeconds(
        remainingMinutes === 0 ? 60 - remainingSeconds : 59 - remainingSeconds
      );
    }
    setStopped(true);
    setHasEnded(true);
  };

  const getUsernameById = (userId: string) => {
    if (usernames[userId]) {
      return usernames[userId];
    }
    return "Loading...";
  };

  const fetchUsernames = useCallback(async () => {
    if (scores.length === 0) return;

    try {
      const promises = scores.map(async (score) => {
        try {
          const response = await axios.get(
            `/api/getUsernameById/${score.user_id}`
          );
          return { userId: score.user_id, username: response.data };
        } catch (error) {
          console.error(`Error fetching username for ${score.user_id}:`, error);
          return { userId: score.user_id, username: "Unknown User" };
        }
      });

      const results = await Promise.all(promises);
      const newUsernames = results.reduce(
        (acc, { userId, username }) => {
          acc[userId] = username;
          return acc;
        },
        {} as { [key: string]: string }
      );

      setUsernames((prev) => ({ ...prev, ...newUsernames }));
    } catch (error) {
      console.error("Error processing usernames:", error);
    }
  }, [scores]);

  useEffect(() => {
    const restored = restoreGameState();

    if (!restored && props.album) {
      setReleaseMBID(props.album);
    }
  }, [props.album, restoreGameState]);

  useEffect(() => {
    if (releaseMBID && !restoringState) {
      fetchTracklist();
    }
  }, [releaseMBID, fetchTracklist, restoringState]);

  useEffect(() => {
    if (correctGuesses.length === songs.length && songs.length > 0) {
      stopCountdown();
    }
  }, [correctGuesses, songs]);

  useEffect(() => {
    if (releaseMBID) {
      getScoresByAlbum(releaseMBID)
        .then((result) => {
          setScores(result);
        })
        .catch((error) => {
          console.error("Error fetching scores:", error);
        });
    }
  }, [releaseMBID, scoreSaved]);

  useEffect(() => {
    if (scores.length > 0) {
      fetchUsernames();
    }
  }, [scores, fetchUsernames]);

  return (
    <>
      {hasEnded && (
        <p className="text-center">
          {correctGuesses.length} / {songs.length}
        </p>
      )}
      {stopped && (
        <p className="text-center">
          {remainingMinutes < 10 ? `0${remainingMinutes}` : remainingMinutes}:
          {remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}
        </p>
      )}
      {loaded && !hasEnded && (
        <>
          <p className="mb-4">
            Selected Album: {albumName} by {artistName}
          </p>
          <div className="flex justify-between items-center w-full">
            <label htmlFor="song" className="text-left">
              Enter a Song
            </label>
            <Countdown
              date={endTime}
              ref={countdownRef}
              renderer={(props) => (
                <p className="text-right">
                  {props.minutes < 10 ? `0${props.minutes}` : props.minutes}:
                  {props.seconds < 10 ? `0${props.seconds}` : props.seconds}
                </p>
              )}
              onComplete={gameEnd}
            />
          </div>
        </>
      )}

      {!hasEnded && loaded && !stopped && (
        <>
          <FormInput
            id="song"
            name="song"
            type="text"
            value={currentGuess}
            onChange={inputChange}
          />
          <button
            onClick={stopCountdown}
            className="hover:underline hover:cursor-pointer text-left"
          >
            Give Up
          </button>
        </>
      )}
      <div>
        {songs.length > 0 && (
          <ul className={hasEnded ? "" : "mt-6"}>
            {songs.map((song: Track) => (
              <li key={song.position} className="mt-3">
                {song.position}.{" "}
                {correctGuesses.includes(song.title) && !hasEnded && (
                  <span>{song.title}</span>
                )}
                {hasEnded && (
                  <span
                    className={
                      correctGuesses.includes(song.title)
                        ? "text-green-500"
                        : "text-red-600"
                    }
                  >
                    {song.title}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasEnded && (
        <div className="flex flex-col mt-6">
          <FormButton onClick={() => router.push("/")}>Restart</FormButton>
          <FormButton onPress={() => onHighscoresOpen()}>Highscores</FormButton>
          <Modal
            isOpen={isHighscoresOpen}
            onOpenChange={onHighscoresOpenChange}
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            className="bg-white rounded-lg shadow-xl"
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalBody className="p-6">
                    {scores.length > 0 ? (
                      <Table
                        aria-label="Highscores table"
                        className="min-w-full"
                      >
                        <TableHeader>
                          <TableColumn>Rank</TableColumn>
                          <TableColumn>User</TableColumn>
                          <TableColumn>Score</TableColumn>
                          <TableColumn>Time</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {scores.map((score, index) => (
                            <TableRow
                              key={index}
                              className={index === 0 ? "bg-yellow-100" : ""}
                            >
                              <TableCell className="font-bold">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                {getUsernameById(score.user_id)}
                              </TableCell>
                              <TableCell className="text-green-600">
                                {score.score}
                              </TableCell>
                              <TableCell className="text-blue-600">
                                {score.time}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-gray-600 italic">
                        No one has played this album yet. Be the first to save
                        your score!
                      </p>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    <Button onClick={onClose} color="primary">
                      Close
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
          <Button
            onPress={() => {
              if (isSignedIn && !scoreSaved) {
                createScore({
                  mode: "album",
                  mbid: releaseMBID,
                  time: `0${elapsedMinutes}:${elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds}`,
                  score: `${correctGuesses.length} / ${songs.length}`,
                });
                setScoreSaved(true);
              } else {
                saveGameState();
              }
              onSaveScoreOpen();
            }}
            className="bg-green-500 hover:bg-green-600 text-white my-2"
          >
            Save Score
          </Button>
          <Modal
            isOpen={isSaveScoreOpen}
            onOpenChange={onSaveScoreOpenChange}
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            className="bg-white rounded-lg shadow-xl"
          >
            <ModalContent>
              <ModalBody className="p-6">
                <SignedOut>
                  <SignInButton />
                  <SignUpButton />
                </SignedOut>
                <SignedIn>
                  {scoreSaved ? (
                    <p className="text-lg font-semibold text-green-600">
                      Score successfully saved!
                    </p>
                  ) : (
                    <p className="text-lg font-semibold text-red-600">
                      You already saved your score!
                    </p>
                  )}
                </SignedIn>
              </ModalBody>
              <ModalFooter>
                <Button
                  onClick={() => router.push("/")}
                  color="primary"
                  className="w-full"
                >
                  Return to Main Menu
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      )}
    </>
  );
};

export default MainGame;
