"use client";

import { useEffect, useState } from "react";

import { fetchReleaseInfos } from "../utils";
import { Track, TracklistRoot } from "@/types/tracklist";
import { Card, CardHeader, Divider } from "@nextui-org/react";

const MainGameArtist = (props: { artist: string }) => {
  const [releaseIDs, setReleaseIDs] = useState([]);
  const [releases, setReleases] = useState<TracklistRoot[]>([]);

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
          if (id) {
            const data = await fetchReleaseInfos(id); 
            setReleases((prevReleases) => [...prevReleases, data]);
          }
        } catch (error) {
          console.error("Error fetching album info:", error);
        }
      });
    }
  }, [releaseIDs]);
  const sortedAlbums = releases.sort((a, b) => {
    return (
      new Date(a.date).getTime() - 
      new Date(b.date).getTime()
    )
  })
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedAlbums.map((release) => (
          <Card key={release.id} className="p-3 h-min">
            <div>
              <CardHeader className="justify-center">
                <h1 className="text-center font-bold text-2xl">
                  {release.title}
                </h1>
              </CardHeader>
              <Divider />
              <ul className="divide-y divide-gray-400">
                {release.media[0].tracks.map((track: Track) => (
                  <li key={track.id} className="p-2 text-center">
                    <span className="invisible">{track.title}</span>
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
