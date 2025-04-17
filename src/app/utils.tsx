import { Artist, ArtistRoot } from "@/types/artist";
import { AudioDBArtist } from "@/types/audioDB";
import { availableSecondaryTypes } from "@/types/consts";
import { Release, ReleaseRoot } from "@/types/release";
import { Group, ReleaseGroupRoot } from "@/types/releasegroup";
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
          inc: "release-groups",
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
