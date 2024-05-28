import { Release, ReleaseRoot } from "@/types/release";
import { Group } from "@/types/releasegroup";
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
    const album = data;

    return album;
  } catch (error) {
    console.error("Error fetching album info:", error);
    throw error;
  }
};

export const fetchReleases = async (id: string) => {
  try {
    const { data } = await axios.get<ReleaseRoot>(
      `https://musicbrainz.org/ws/2/release`,
      {
        params: {
          "release-group": id,
          fmt: "json",
          limit: 100,
          inc: "media",
        },
      }
    );
    const releases = data;

    return releases
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
    const album = data;

    return album;
  } catch (error) {
    console.error("Error fetching album info:", error);
    throw error;
  }
};
