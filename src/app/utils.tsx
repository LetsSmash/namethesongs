import { Group, ReleaseGroupRoot } from "@/types/releasegroup";
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
    console.error('Error fetching album info:', error);
    throw error;
  }
};
