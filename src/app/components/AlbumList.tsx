"use client";

import { useEffect, useState } from "react";
import { fetchAlbumInfos, parseConfig } from "@/app/utils";
import { Group } from "../../types/releasegroup";
import { ConfigSchema } from "@/types/config";

export const AlbumList = ({ config }: { config: ConfigSchema }) => {
  const [albums, setAlbums] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        const albumIds = parseConfig(config.config);
        const fetchedAlbums = await Promise.all(
          albumIds.map((albumMbid) => fetchAlbumInfos(albumMbid))
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
    <ul className="list-disc list-inside">
      {albums.map((album) => (
        <li key={album.id} className="mb-2">
          {album.title} (
          {album["first-release-date"]?.substring(0, 4) || "Unknown"})
        </li>
      ))}
    </ul>
  );
};
