"use client";

import { useEffect, useState } from "react";
import { combinedTracksRelease, fetchReleaseGroupFromRelease, parseConfig } from "@/app/utils";
import { ConfigSchema } from "@/types/config";
import { Release } from "@/types/release";

export const AlbumList = ({ config }: { config: ConfigSchema }) => {
  const [albums, setAlbums] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        const albumIds = parseConfig(config.config).filter((id) => id != "");
        const fetchedAlbums = await Promise.all(
          albumIds.map((albumMbid) => fetchReleaseGroupFromRelease(albumMbid))
        );
        setAlbums(fetchedAlbums);
      } catch (error) {
        console.error("Error fetching albums:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAlbums();
  }, [config.config]);

  if (loading) {
    return <p>Loading albums...</p>;
  }

  return (
    <ul className="divide-y">
      {albums.map((album) => (
        <li key={album.id} className="mb-2">
          <h3 className="text-xl font-bold">{album["release-group"].title}</h3>
          {album.title}
          {album.disambiguation ? ` (${album.disambiguation}, ` : " ("}
          {`${combinedTracksRelease(album).combinedTracks} Tracks)`}{" "}
        </li>
      ))}
    </ul>
  );
};
