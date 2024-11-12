"use client";

import { useEffect, useState } from "react";

import {
  fetchReleaseInfos,
  getArtistInfo,
  getArtistLogo,
  normalizeString,
} from "../utils";
import { Track, TracklistRoot } from "@/types/tracklist";
import { Card, CardHeader, Divider } from "@nextui-org/react";
import FormInput from "../components/FormInput";
import Image from "next/image";

const MainGameArtist = (props: { artist: string }) => {
  const [releaseIDs, setReleaseIDs] = useState([]);
  const [releases, setReleases] = useState<TracklistRoot[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [correctGuesses, setCorrectGuesses] = useState<string[]>([]);
  const [songs, setSongs] = useState<Track[]>([]);
  const [artistLogo, setArtistLogo] = useState<string>("");

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const logo = await getArtistLogo(props.artist);
        if (logo) {
          setArtistLogo(logo);
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
      setReleaseIDs(JSON.parse(storedReleases));
    }
  }, []);

  useEffect(() => {
    if (releaseIDs.length > 0 && releases.length === 0) {
      releaseIDs.map(async (id: string) => {
        try {
          if (id !== "") {
            const data = await fetchReleaseInfos(id);
            setReleases((prevReleases) => [...prevReleases, data]);
          }
        } catch (error) {
          console.error("Error fetching album info:", error);
        }
      });
    }
  }, [releaseIDs]);

  useEffect(() => {
    if (releases.length > 0 && releaseIDs.length > 0) {
      const allSongs = releases.flatMap((release) => {
        return release.media.flatMap((medium) => {
          return medium.tracks;
        });
      });
      setSongs(allSongs);
    }
  }, [releases, releaseIDs.length]);

  const sortedAlbums = releases.sort((a, b) => {
    return (
      new Date(a["release-group"]["first-release-date"] ?? a.date).getTime() -
      new Date(b["release-group"]["first-release-date"] ?? a.date).getTime()
    );
  });

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

  return (
    <>
      {artistLogo !== "" && (
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
          <h1 className="font-bold text-2xl text-center">
            {correctGuesses.length} / {songs.length}
          </h1>
          <FormInput
            id="song"
            name="song"
            value={currentGuess}
            onChange={inputChange}
            classes="mt-2"
          />
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
                  .map((track: Track) => (
                    <li key={track.id} className="p-2 text-center">
                      <span
                        className={
                          correctGuesses.includes(track.title)
                            ? "visible"
                            : "invisible"
                        }
                      >
                        {track.title}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};

export default MainGameArtist;
