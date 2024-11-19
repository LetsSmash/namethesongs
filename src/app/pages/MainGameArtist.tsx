"use client";

import { useEffect, useRef, useState } from "react";
import { fetchReleaseInfos, normalizeString } from "../utils";
import { Track, TracklistRoot } from "@/types/tracklist";
import { Card, CardHeader, Divider } from "@nextui-org/react";
import FormInput from "../components/FormInput";
import Image from "next/image";
import axios from "axios";
import Countdown from "react-countdown";

const MainGameArtist = (props: { artist: string }) => {
  const [releaseIDs, setReleaseIDs] = useState<string[]>([]);
  const [releases, setReleases] = useState<TracklistRoot[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [correctGuesses, setCorrectGuesses] = useState<string[]>([]);
  const [songs, setSongs] = useState<Track[]>([]);
  const [artistLogo, setArtistLogo] = useState<string>("");
  const [hasEnded, setHasEnded] = useState(false);
  const [endTime] = useState(Date.now() + 15 * 60000);

  const countdownRef = useRef<Countdown>(null);

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
    const storedReleases = localStorage.getItem("releases");
    if (storedReleases) {
      const parsedReleases = JSON.parse(storedReleases);
      setReleaseIDs(parsedReleases);
    } else {
      console.warn("No releases found in localStorage.");
    }
  }, []);

  useEffect(() => {
    const fetchAllReleases = async () => {
      try {
        const fetchedReleases = await Promise.all(
          releaseIDs
            .filter((id: string) => id !== "")
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

    if (releaseIDs.length > 0 && releases.length === 0) {
      fetchAllReleases();
    }
  }, [releaseIDs, releases.length]);

  useEffect(() => {
    if (releases.length > 0) {
      const allSongs = releases.flatMap((release) =>
        release.media.flatMap((medium) => medium.tracks)
      );

      const uniqueSongsMap = new Map<string, Track>();
      allSongs.forEach((song) => {
        const normalizedTitle = normalizeString(song.title);
        if (!uniqueSongsMap.has(normalizedTitle)) {
          uniqueSongsMap.set(normalizedTitle, song);
        }
      });

      const uniqueSongs = Array.from(uniqueSongsMap.values());
      setSongs(uniqueSongs);
    }
  }, [releases]);

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
    const matchedSongs = songs.filter(
      (song) => normalizeString(song.title) === normalizedGuess
    );

    if (matchedSongs.length > 0) {
      const newGuesses = matchedSongs
        .map((song) => song.title)
        .filter((title) => !correctGuesses.includes(title));

      if (newGuesses.length > 0) {
        setCorrectGuesses([...correctGuesses, ...newGuesses]);
        setCurrentGuess("");
      }
    }
  };

  const stopCountdown = () => {
    if (countdownRef.current) {
      countdownRef.current.pause();
    }
    setHasEnded(true);
  };

  return (
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
                    const isGuessed = correctGuesses.includes(
                      track.title
                    );
                    return (
                      <li key={track.id} className="p-2 text-center">
                        {!hasEnded && (
                          <span className={isGuessed ? "visible" : "invisible"}>
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
    </>
  );
};

export default MainGameArtist;
