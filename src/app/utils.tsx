import { Artist } from "@/types/artist";
import { availableSecondaryTypes } from "@/types/consts";
import { Release, ReleaseReleaseGroup, ReleaseRoot } from "@/types/release";
import { Group, ReleaseGroupRoot } from "@/types/releasegroup";
import { ScoreSchema } from "@/types/score";
import { TracklistRoot } from "@/types/tracklist";
import axios from "axios";

export const fetchAlbumInfos = async (id: string) => {
  try {
    const { data } = await axios.get<Group>(
      `https://musicbrainz.org/ws/2/release-group/${id}`,
      {
        params: {
          inc: "artist-credits",
          fmt: "json",
        },
      }
    );
    return data;
  } catch (error) {
    console.error("Error fetching album info:", error);
    throw error;
  }
};

export const fetchReleaseGroupFromRelease = async (id: string) => {
  try {
    const { data } = await axios.get<Release>(
      `https://musicbrainz.org/ws/2/release/${id}`,
      {
        params: {
          inc: "release-groups+artists+media",
          fmt: "json",
        },
      }
    );
    return data;
  } catch (error) {
    console.error("Error fetching album info:", error);
    throw error;
  }
};

export const fetchArtistReleaseGroups = async (id: string) => {
  try {
    const { data } = await axios.get<ReleaseGroupRoot>(
      "https://musicbrainz.org/ws/2/release-group",
      {
        params: {
          query: `arid:${id} AND (primarytype:album OR primarytype:ep) AND status:official NOT (${availableSecondaryTypes.join(" OR ")})`,
          fmt: "json",
          limit: 100,
        },
      }
    );
    return data["release-groups"];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchReleaseInfos = async (id: string) => {
  try {
    const { data } = await axios.get<TracklistRoot>(
      `https://musicbrainz.org/ws/2/release/${id}`,
      {
        params: {
          inc: "recordings+release-groups",
          fmt: "json",
        },
      }
    );
    return data;
  } catch (error) {
    console.error("Error fetching release info:", error);
    throw error;
  }
};

export const normalizeString = (str: string) => {
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
    .replace(/\s*\([^)]*\)/gu, "")
    .replace(
      /[^a-zA-Z0-9\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{Script=Cyrillic}]/gu,
      ""
    )
    .toLowerCase();
};

export const getArtistInfo = async (id: string) => {
  try {
    const { data } = await axios.get<Artist>(
      `https://musicbrainz.org/ws/2/artist/${id}`,
      {
        params: {
          fmt: "json",
        },
      }
    );
    return data;
  } catch (error) {
    console.error("Error fetching artist info:", error);
    throw error;
  }
};

export const sortAlbums = (albums: any[]) =>
  albums.sort(
    (a, b) =>
      new Date(a["first-release-date"]).getTime() -
      new Date(b["first-release-date"]).getTime()
  );

export const combineTracksReleases = (releases: Release[]) =>
  releases.map((release) => {
    const combinedTracks = release.media.reduce((acc, media) => {
      return acc + media["track-count"];
    }, 0);
    return {
      ...release,
      combinedTracks,
    };
  });

export const filterUniqueTrackCountReleases = (releases: Release[]) =>
  releases.filter(
    (release, index, self) =>
      index ===
      self.findIndex((r) => r.combinedTracks === release.combinedTracks)
  );

export const sortReleasesByTrackCount = (releases: Release[]) =>
  releases.sort((a, b) => (a.combinedTracks ?? 0) - (b.combinedTracks ?? 0));

export const filterAndSortReleases = (releases: any[]) => {
  const withCombinedTracks = combineTracksReleases(releases);
  const uniqueTrackCountReleases =
    filterUniqueTrackCountReleases(withCombinedTracks);
  return sortReleasesByTrackCount(uniqueTrackCountReleases);
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const sortResultsNumerically = (results: ScoreSchema[]) => {
  const timeToSeconds = (t: string) => {
    if (!t) return Number.MAX_SAFE_INTEGER;
    const parts = t.split(":").map((p) => parseInt(p, 10));
    if (parts.some((n) => Number.isNaN(n))) return Number.MAX_SAFE_INTEGER;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    return Number.MAX_SAFE_INTEGER;
  };

  return [...results].sort((a, b) => {
    const scoreA = parseInt(a.score.split("/")[0]);
    const scoreB = parseInt(b.score.split("/")[0]);
    if (scoreB !== scoreA) return scoreB - scoreA; // higher score first

    const timeA = timeToSeconds(a.time);
    const timeB = timeToSeconds(b.time);
    return timeA - timeB; // lower time first on tie
  });
};

export const saveGameState = <T extends Record<string, any>>(
  key: string,
  state: T
) => {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem(`${key}Timestamp`, Date.now().toString());
  } catch (error) {
    console.error("Error saving game state:", error);
  }
};

export const restoreGameState = <T extends Record<string, any>>(
  key: string,
  maxAgeMs: number = 10 * 60 * 1000
): T | null => {
  try {
    const savedState = localStorage.getItem(key);
    const timestamp = localStorage.getItem(`${key}Timestamp`);

    if (savedState && timestamp) {
      const now = Date.now();
      const savedTime = parseInt(timestamp);

      if (now - savedTime < maxAgeMs) {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}Timestamp`);
        return JSON.parse(savedState) as T;
      }
    }

    return null;
  } catch (error) {
    console.error("Error restoring game state:", error);
    return null;
  }
};

export const parseConfig = (config: string): string[] => {
  try {
    return JSON.parse(config);
  } catch {
    return [];
  }
};
