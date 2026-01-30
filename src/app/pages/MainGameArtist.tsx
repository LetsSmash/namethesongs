"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchReleaseInfos,
  normalizeString,
  saveGameState as saveGameStateUtil,
  restoreGameState as restoreGameStateUtil,
} from "../utils";
import { Track, TracklistRoot } from "@/types/tracklist";
import {
  Button,
  Card,
  CardHeader,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  useDisclosure,
} from "@heroui/react";
import FormInput from "@/app/components/FormInput";
import Image from "next/image";
import axios from "axios";
import Countdown from "react-countdown";
import { notFound, useRouter } from "next/navigation";
import {
  createArtistScore,
  createConfiguration,
  getConfigurationById,
  getConfigurationId,
  getLastConfigurationId,
} from "../actions";
import Scoreboard from "@/app/components/Scoreboard";
import {
  SignedOut,
  SignedIn,
  useAuth,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";

const MainGameArtist = (props: { artist: string, configId: number }) => {
  const [releaseIDs, setReleaseIDs] = useState<string[]>([]);
  const [releases, setReleases] = useState<TracklistRoot[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [correctGuesses, setCorrectGuesses] = useState<string[]>([]);
  const [songs, setSongs] = useState<string[]>([]);
  const [artistLogo, setArtistLogo] = useState<string>("");
  const [hasEnded, setHasEnded] = useState(false);
  const [endTime] = useState(Date.now() + 20 * 60000);
  const [hasReleases, setHasReleases] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"default" | "user">(
    "default"
  );
  const [selectedConfigMode, setSelectedConfigMode] = useState<"this" | "all">(
    "this"
  );
  const [scoreSaved, setScoreSaved] = useState(false);
  const [restoringState, setRestoringState] = useState(false);

  const countdownRef = useRef<Countdown>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isSaveScoreOpen,
    onOpen: onSaveScoreOpen,
    onOpenChange: onSaveScoreOpenChange,
  } = useDisclosure();

  const { isSignedIn } = useAuth();
  const router = useRouter();

  interface ArtistGameState {
    artistMBID: string;
    releaseIDs: string[];
    correctGuesses: string[];
    hasEnded: boolean;
    scoreSaved: boolean;
  }

  const saveGameState = () => {
    const gameState: ArtistGameState = {
      artistMBID: props.artist,
      releaseIDs,
      correctGuesses,
      hasEnded,
      scoreSaved,
    };

    saveGameStateUtil("artistGameState", gameState);
  };

  const restoreGameState = useCallback(() => {
    const gameState = restoreGameStateUtil<ArtistGameState>("artistGameState");

    if (gameState && gameState.artistMBID === props.artist) {
      setReleaseIDs(gameState.releaseIDs);
      setCorrectGuesses(gameState.correctGuesses);
      setHasEnded(gameState.hasEnded);
      setScoreSaved(gameState.scoreSaved);
      setHasReleases(true);
      setRestoringState(true);
      return true;
    }

    return false;
  }, [props.artist]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data } = await axios.get<string>(
          `/api/getArtistLogo/${props.artist}`
        );
        if (data) {
          setArtistLogo(data);
        } else {
          console.warn("No Artist Logo available");
          setArtistLogo("");
        }
      } catch (error) {
        console.error("Error fetching artist logo:", error);
        setArtistLogo("");
      }
    };
    fetchLogo();
  }, [props.artist]);

  useEffect(() => {
    const restored = restoreGameState();

    if (!restored) {
      const getConfig = async () => {
        try {
          const configResult = await getConfigurationById(props.configId);
          if (configResult && configResult[0]?.config) {
            const parsedReleases = JSON.parse(configResult[0].config);
            setHasReleases(true);
            setReleaseIDs(parsedReleases);
          } else {
            alert("Invalid configuration ID!");
            notFound();
          }
        } catch (error) {
          console.error("Error loading configuration:", error);
          alert("Failed to load configuration!");
          notFound();
        }
      };
      getConfig();
    }
  }, [restoreGameState, props.configId]);

  useEffect(() => {
    const fetchAllReleases = async () => {
      try {
        const fetchedReleases = await Promise.all(
          releaseIDs
            .map(async (id: string) => {
              const data = await fetchReleaseInfos(id);
              return data;
            })
        );
        setReleases(fetchedReleases);
      } catch (error) {
        console.error("Error fetching album info:", error);
      }
    };

    if (releaseIDs.length > 0 && releases.length === 0 && !restoringState) {
      fetchAllReleases();
    }
  }, [releaseIDs, releases.length, restoringState]);

  useEffect(() => {
    if (releases.length > 0) {
      const allSongs = releases.flatMap((release) =>
        release.media.flatMap((medium) => medium.tracks)
      );

      const normalizedTitles = allSongs.map((song) =>
        normalizeString(song.title)
      );
      const uniqueNormalizedTitles = Array.from(new Set(normalizedTitles));
      setSongs(uniqueNormalizedTitles);

      if (restoringState) {
        setRestoringState(false);
      }
    }
  }, [releases, restoringState]);

  const sortedAlbums = releases.sort((a, b) => {
    return (
      new Date(a["release-group"]["first-release-date"] ?? a.date).getTime() -
      new Date(b["release-group"]["first-release-date"] ?? a.date).getTime()
    );
  });

  const inputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const guess = e.target.value;
    setCurrentGuess(guess);

    const normalizedGuess = normalizeString(guess);
    if (
      songs.includes(normalizedGuess) &&
      !correctGuesses.includes(normalizedGuess)
    ) {
      setCorrectGuesses([...correctGuesses, normalizedGuess]);
      setCurrentGuess("");
    }
  };

  const stopCountdown = () => {
    if (countdownRef.current) {
      countdownRef.current.pause();
    }
    setHasEnded(true);
  };

  const saveScore = async () => {
    if (scoreSaved) return;

    const elapsedTime = 20 * 60000 - (endTime - Date.now());
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    const scoreString = `${correctGuesses.length}/${songs.length}`;

    try {
      // Save the score
      await createArtistScore({
        time: timeString,
        score: scoreString,
        mbid: props.artist,
        configId: props.configId,
      });

      setScoreSaved(true);
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  useEffect(() => {
    if (correctGuesses.length === songs.length && songs.length > 0) {
      stopCountdown();
    }
  }, [correctGuesses, songs]);

  return (
    <>
      {hasReleases && (
        <>
          {artistLogo && (
            <div className="flex justify-center">
              <Image
                src={artistLogo}
                alt="Artist Logo"
                width={300}
                height={300}
                className="h-min"
              />
            </div>
          )}
          <div className="flex justify-center sticky top-0 z-50 bg-white">
            <div className="w-full max-w-xs">
              <div className="flex justify-between">
                <h1 className="font-bold text-2xl text-left">
                  {correctGuesses.length} / {songs.length}
                </h1>
                {hasEnded && (
                  <h1 className="font-bold text-2xl">
                    {Math.floor((100 * correctGuesses.length) / songs.length)}%
                  </h1>
                )}
                <Countdown
                  date={endTime}
                  ref={countdownRef}
                  onComplete={() => {
                    setHasEnded(true);
                  }}
                  renderer={({ minutes, seconds }) => (
                    <p className="font-bold text-2xl text-right">
                      {minutes < 10 ? `0${minutes}` : minutes}:
                      {seconds < 10 ? `0${seconds}` : seconds}
                    </p>
                  )}
                />
              </div>
              {!hasEnded && (
                <>
                  <FormInput
                    id="song"
                    name="song"
                    value={currentGuess}
                    onChange={inputChange}
                    classes="mt-2"
                  />
                  <button
                    onClick={stopCountdown}
                    className="hover:underline hover:cursor-pointer text-left"
                  >
                    Give Up
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedAlbums.map((release) => (
              <Card key={release.id} className="p-3 h-min">
                <div>
                  <CardHeader className="justify-center">
                    <h1 className="text-center font-bold text-2xl">
                      {release["release-group"].title}
                    </h1>
                  </CardHeader>
                  <Divider />
                  <ul className="divide-y divide-gray-400">
                    {release.media
                      .flatMap((medium) => medium.tracks)
                      .map((track: Track) => {
                        const normalizedTitle = normalizeString(track.title);
                        const isGuessed =
                          correctGuesses.includes(normalizedTitle);
                        return (
                          <li key={track.id} className="p-2 text-center">
                            {!hasEnded && (
                              <span
                                className={isGuessed ? "visible" : "invisible"}
                              >
                                {track.title}
                              </span>
                            )}
                            {hasEnded && (
                              <span
                                className={
                                  isGuessed ? "text-green-500" : "text-red-600"
                                }
                              >
                                {track.title}
                              </span>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
          {hasEnded && (
            <div className="flex flex-col items-center mt-8 mb-8">
              <div className="flex flex-col gap-2 w-3/12 max-w-md px-4 mb-12">
                {!scoreSaved && (
                  <Button
                    onPress={async () => {
                      if (isSignedIn && !scoreSaved) {
                        onSaveScoreOpen();
                        await saveScore();
                      } else if (!isSignedIn) {
                        saveGameState();
                      }
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-6 shadow-md transition-all duration-200 hover:shadow-lg"
                    size="lg"
                  >
                    Save Score
                  </Button>
                )}
                <Button
                  color="secondary"
                  size="lg"
                  className="font-semibold py-6 shadow-md transition-all duration-200 hover:shadow-lg w-full"
                  onPress={onOpen}
                >
                  View Scoreboard
                </Button>
              </div>
              <div className="w-3/12 max-w-md px-4">
                <Button
                  color="primary"
                  size="lg"
                  className="font-semibold py-6 shadow-md transition-all duration-200 hover:shadow-lg w-full"
                  onPress={() => {
                    router.push("/");
                  }}
                >
                  Try Another Artist
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 items-center">
                Artist Scoreboard
              </ModalHeader>
              <ModalBody className="p-6 pt-0">
                <Divider />
                <div className="flex justify-center">
                  <RadioGroup
                    value={selectedMode}
                    onValueChange={(value) =>
                      setSelectedMode(value as "default" | "user")
                    }
                    orientation="horizontal"
                  >
                    <Radio value="default">Global</Radio>
                    <Radio value="user" className={!isSignedIn ? "hidden" : ""}>
                      Your Scores
                    </Radio>
                  </RadioGroup>
                </div>
                <Divider />
                <div className="flex justify-center">
                  <RadioGroup
                    value={selectedConfigMode}
                    onValueChange={(value) =>
                      setSelectedConfigMode(value as "this" | "all")
                    }
                    orientation="horizontal"
                  >
                    <Radio value="this">This Configuration</Radio>
                    <Radio value="all">All Configurations</Radio>
                  </RadioGroup>
                </div>
                {selectedMode === "default" ? (
                  <Scoreboard
                    mbid={props.artist}
                    types="artist"
                    configMode={selectedConfigMode}
                    configId={props.configId}
                  />
                ) : (
                  <Scoreboard
                    mbid={props.artist}
                    mode="user"
                    types="artist"
                    configMode={selectedConfigMode}
                    configId={props.configId}
                  />
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
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
                  <p className="text-lg font-semibold text-green-600">
                    Score successfully saved!
                  </p>
                </SignedIn>
              </ModalBody>
              <ModalFooter>
                <Button onPress={onClose} color="primary" className="w-full">
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default MainGameArtist;
