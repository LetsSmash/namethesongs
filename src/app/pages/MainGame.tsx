"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import FormInput from "@/app/components/FormInput";
import Countdown from "react-countdown";
import FormButton from "@/app/components/FormButton";
import { useRouter } from "next/navigation";
import { Track } from "@/types/tracklist";
import { Release } from "@/types/release";
import { ArtistCredit, Group } from "@/types/releasegroup";
import { fetchAlbumInfos, fetchReleaseInfos, normalizeString, saveGameState as saveGameStateUtil, restoreGameState as restoreGameStateUtil } from "../utils";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
  useDisclosure,
} from "@nextui-org/react";
import {
  SignedOut,
  SignedIn,
  useAuth,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { createScore } from "../actions";
import Scoreboard from "../components/Scoreboard";
import { useReward } from "react-rewards";

interface GameState {
  releaseMBID: string;
  albumName: string;
  artistName?: string;
  songs: Track[];
  correctGuesses: string[];
  remainingMinutes: number;
  remainingSeconds: number;
  elapsedMinutes: number;
  elapsedSeconds: number;
  hasEnded: boolean;
  stopped: boolean;
}

const MainGame = (props: { album: string }) => {
  const [releaseMBID, setReleaseMBID] = useState<Release["id"]>("");
  const [releaseGroupMBID, setReleaseGroupMBID] = useState<Group["id"]>("");
  const [albumName, setAlbumName] = useState<Group["title"]>("");
  const [artistName, setArtistName] = useState<
    ArtistCredit["name"] | undefined
  >("");
  const [songs, setSongs] = useState<Track[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [correctGuesses, setCorrectGuesses] = useState<string[]>([]);
  const [endTime, setEndTime] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restoringState, setRestoringState] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [calculatedMinutes, setCalculatedMinutes] = useState(0);
  const [selectedMode, setSelectedMode] = useState<"default" | "user">(
    "default"
  );

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

  const { reward } = useReward("rewardId", "confetti");

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

    saveGameStateUtil("gameState", gameState);
  };

  const restoreGameState = useCallback(() => {
    const gameState = restoreGameStateUtil<GameState>("gameState");

    if (gameState) {
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
      return true;
    }

    return false;
  }, []);

  const fetchTracklist = useCallback(async () => {
    const data = await fetchReleaseInfos(releaseMBID);
    setLoaded(true);
    const albumInfos = await fetchAlbumInfos(data["release-group"].id);
    setReleaseGroupMBID(data["release-group"].id);
    setAlbumName(albumInfos.title);
    setArtistName(albumInfos["artist-credit"]?.[0]?.name);
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
    setElapsedMinutes(calculatedMinutes);
    setElapsedSeconds(0);
  };

  const stopCountdown = () => {
    if (countdownRef.current) {
      countdownRef.current.pause();
      const remainingMinutes = countdownRef.current.getRenderProps().minutes;
      const remainingSeconds = countdownRef.current.getRenderProps().seconds;
      setRemainingMinutes(remainingMinutes);
      setRemainingSeconds(remainingSeconds);
      setElapsedMinutes(calculatedMinutes - remainingMinutes);
      setElapsedSeconds(
        remainingMinutes === 0 ? 60 - remainingSeconds : 59 - remainingSeconds
      );
    }
    setStopped(true);
    setHasEnded(true);
  };

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
      reward();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctGuesses, songs]);

  useEffect(() => {
    if (releaseMBID && songs.length > 0) {
      const calculatedTime = Math.max(180, songs.length * 30);
      setEndTime(Date.now() + calculatedTime * 1000);
      setCalculatedMinutes(Math.floor(calculatedTime / 60));
    }
  }, [releaseMBID, songs.length]);

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
            {endTime > 0 && (
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
            )}
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
      <div className="flex">
        <span id="rewardId" className="left-1/2 relative self-center" style={{width: 2, height: 2, background: "red"}}/>
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
                    <div className="flex justify-center">
                      <RadioGroup
                        value={selectedMode}
                        onValueChange={(value) =>
                          setSelectedMode(value as "default" | "user")
                        }
                        orientation="horizontal"
                      >
                        <Radio value="default">Global</Radio>
                        <Radio value="user">Your Scores</Radio>
                      </RadioGroup>
                    </div>
                    <Tabs className="grid">
                      <Tab key="release" title="By Release">
                        {selectedMode === "default" ? (
                          <Scoreboard mbid={releaseMBID} />
                        ) : (
                          <Scoreboard mbid={releaseMBID} mode="user" />
                        )}
                      </Tab>
                      <Tab key="releasegroup" title="By Album">
                        {selectedMode === "default" ? (
                          <Scoreboard mbid={releaseGroupMBID} types="releasegroup" />
                        ) : (
                          <Scoreboard mbid={releaseGroupMBID} mode="user" types="releasegroup" />
                        )}
                      </Tab>
                    </Tabs>
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
                  rgmbid: releaseGroupMBID,
                  time: `${elapsedMinutes < 10 ? `0${elapsedMinutes}` : elapsedMinutes}:${elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds}`,
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
              {(onClose) => (
                <>
                  <ModalBody className="p-6">
                    <SignedOut>
                      <SignInButton />
                      <SignUpButton />
                    </SignedOut>
                    <SignedIn>
                      {!scoreSaved ? (
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
                      onClick={onClose}
                      color="primary"
                      className="w-full"
                    >
                      Close
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </div>
      )}
    </>
  );
};

export default MainGame;
