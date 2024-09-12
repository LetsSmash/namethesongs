import { availableSecondaryTypes } from "@/types/consts";
import {Release, ReleaseRoot} from "@/types/release";
import {Group, ReleaseGroupRoot} from "@/types/releasegroup";
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

export const fetchReleases = async (id: string) => {
  try {
    const { data } = await axios.get<ReleaseRoot>(
      "https://musicbrainz.org/ws/2/release",
      {
        params: {
          "release-group": id,
          fmt: "json",
          limit: 100,
          inc: "media",
        },
        headers: {
          "User-Agent": "GuessTheSongs/1.0.0 ( http://namethesongs.vercel.app )",
        },
      }
    );
    return data
  } catch (error) {
    console.error(error);
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
        headers: {
          "User-Agent": "GuessTheSongs/0.1",
        },
      }
    );
    return data["release-groups"];
  } catch (error) {
    console.error(error);
    throw error;
  }
};
