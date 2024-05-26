"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import FormInput from "@/app/components/FormInput";
import Countdown, { CountdownApi } from "react-countdown";
import FormButton from "@/app/components/FormButton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TracklistRoot, Track } from "@/types/tracklist";
import { Release } from "@/types/release";
import { ArtistCredit, Group } from "@/types/releasegroup";

const MainGame = (props: { album: string }) => {
  const [releaseGroupMBID, setReleaseGroupMBID] = useState<Group["id"]>("");
  const [releaseMBID, setReleaseMBID] = useState<Release["id"]>("");
  const [albumName, setAlbumName] = useState<Group["title"]>("");
  const [artistName, setArtistName] = useState<ArtistCredit["name"]>("");
  const [songs, setSongs] = useState<Track[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [correctGuesses, setCorrectGuesses] = useState<string[]>([]);
  const [endTime] = useState(Date.now() + 5 * 60000);
  const [stopped, setStopped] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const router = useRouter();

  const countdownRef = useRef<Countdown>(null);

  const fetchRelease = async () => {
    if (!props.album) return;

    const { data } = await axios.get(`https://musicbrainz.org/ws/2/release`, {
      params: {
        "release-group": props.album,
        fmt: "json",
        inc: "media",
        status: "official",
      },
      headers: {
        "User-Agent": "GuessTheSongs/0.1",
      },
    });

    const releases: Release[] = data.releases;

    if (releases && releases.length > 0) {
      const releasesWithTrackCounts = releases
        .map((release: Release) => ({
          id: release.id,
          trackCount: release.media.reduce(
            (acc, curr) => acc + curr["track-count"],
            0
          ),
        }))
        .sort(
          (a: { trackCount: number }, b: { trackCount: number }) =>
            a.trackCount - b.trackCount
        );

      // Logic to find the release with the lowest track count, but consider the second one if there's more than one media object
      let selectedRelease = releasesWithTrackCounts[0]; // Default to the one with the lowest track count
      if (
        data.releases.find(
          (release: Release) => release.id === selectedRelease.id
        ).media.length > 1 &&
        releasesWithTrackCounts.length > 1
      ) {
        // If the selected release has more than one media object, use the second least instead
        selectedRelease = releasesWithTrackCounts[1];
      }

      setReleaseMBID(selectedRelease.id);
    }
  };

  const fetchTracklist = async () => {
    const { data } = await axios.get<TracklistRoot>(
      `https://musicbrainz.org/ws/2/release/${releaseMBID}`,
      {
        params: {
          fmt: "json",
          inc: "recordings",
        },
        headers: {
          "User-Agent": "GuessTheSongs/0.1",
        },
      }
    );
    const tracklist: Track[] = data.media[0].tracks;
    const fetchedSongs = tracklist.map((track: Track) => ({
      position: track.position,
      title: track.title,
    }));
    setSongs(fetchedSongs);
  };

  const normalizeString = (str: string) => {
    return str
      .replace(/’/g, "'") // Replace curly apostrophes with straight ones
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
    }
    setStopped(true);
    setHasEnded(true);
  };

  // Fetch the tracklist once we have the release group MBID
  useEffect(() => {
    if (releaseGroupMBID) {
      fetchRelease();
    }
  }, [releaseGroupMBID]);

  useEffect(() => {
    if (releaseMBID) {
      fetchTracklist();
    }
  }, [releaseMBID]);

  useEffect(() => {
    if (correctGuesses.length === songs.length && songs.length > 0) {
      gameEnd();
    }
  }, [correctGuesses, songs]);

  return (
    <>
      {hasEnded && (
        <p>
          {correctGuesses.length} / {songs.length}
        </p>
      )}
      {!notFound && loaded && !stopped && (
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
      {!hasEnded && !notFound && loaded && !stopped && (
        <>
          <FormInput
            id="song"
            name="song"
            type="text"
            value={currentGuess}
            onChange={inputChange}
          />
          <a
            onClick={stopCountdown}
            className="hover:underline hover:cursor-pointer"
          >
            Give Up
          </a>
        </>
      )}
      <div>
        {songs.length > 0 && (
          <ul className={hasEnded ? "" : "mt-6"}>
            {songs.map((song: Track, index) => (
              <li key={index} className="mt-3">
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
      {notFound && (
        <div className="bg-red-200 text-black px-2 py-2">
          <p>
            {
              "You have made an invalid entry, or your Album wasn't found on MusicBrainz. "
            }{" "}
            <Link href={"/"} className="underline">
              Back to the Form
            </Link>
            .
          </p>
        </div>
      )}
      {hasEnded && (
        <FormButton onClick={() => router.push("/")}>Restart</FormButton>
      )}
    </>
  );
};

export default MainGame;
