"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import FormInput from "@/app/components/FormInput";
import Countdown, { CountdownApi } from "react-countdown";
import FormButton from "@/app/components/FormButton";
import { useRouter } from "next/navigation";
import { TracklistRoot, Track } from "@/types/tracklist";
import { Release } from "@/types/release";
import { ArtistCredit, Group } from "@/types/releasegroup";
import { fetchAlbumInfos } from "../utils";

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
  const [remainingMinutes, setRemainingMinutes] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const router = useRouter();

  const countdownRef = useRef<Countdown>(null);

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
    const albumInfos = await fetchAlbumInfos(data["release-group"].id)
    setAlbumName(albumInfos.title)
    setArtistName(albumInfos["artist-credit"][0].name)
    const tracklist: Track[] = data.media[0].tracks;
    const fetchedSongs = tracklist.map((track: Track) => ({
      position: track.position,
      title: track.title,
    }));
    setSongs(fetchedSongs);
  }, [releaseMBID]);

  const normalizeString = (str: string) => {
    return str
      .replace(/’/g, "'")
      .replace(/Ä/g, "A")
      .replace(/ä/g, "a")
      .replace(/Ö/g, "O")
      .replace(/ö/g, "o")
      .replace(/Ü/g, "U")
      .replace(/ü/g, "u")
      .replace(/&/g, "and")
      .replace(/and/g, "&")
      .replace(
        /[^a-zA-Z0-9\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{Script=Cyrillic}]/gu,
        ""
      )
      .toLowerCase();
  };

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
      setRemainingMinutes(countdownRef.current.getRenderProps().minutes)
      setRemainingSeconds(countdownRef.current.getRenderProps().seconds)
    }
    setStopped(true);
    setHasEnded(true);
  };

  useEffect(() => {
    if (props.album) {
      setReleaseMBID(props.album)
    }
  }, [props.album])

  useEffect(() => {
    if (releaseMBID) {
      fetchTracklist();
    }
  }, [releaseMBID, fetchTracklist]);

  useEffect(() => {
    if (correctGuesses.length === songs.length && songs.length > 0) {
      stopCountdown();
    }
  }, [correctGuesses, songs]);

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
        <FormButton onClick={() => router.push("/")}>Restart</FormButton>
      )}
    </>
  );
};

export default MainGame;
