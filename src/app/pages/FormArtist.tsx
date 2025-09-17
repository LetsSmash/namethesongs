"use client";

import { ArtistRoot, Artist } from "@/types/artist";
import { Group } from "@/types/releasegroup";
import { useDisclosure } from "@nextui-org/react";
import { useAsyncList } from "@react-stately/data";
import axios from "axios";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import * as Yup from "yup";
import { filterAndSortReleases, sleep } from "../utils";
import { ReleaseRoot, Release, ReleaseReleaseGroup } from "@/types/release";

const validationSchema = Yup.object({
  artist: Yup.string().required("Artist is required"),
});

const FormArtist = () => {
  const [submitted, setSubmitted] = useState(false);
  const [artistId, setArtistId] = useState("");
  const [releaseGroupsReleases, setReleaseGroupsReleases] = useState<Group[]>(
    []
  );
  const [selectedReleases, setSelectedReleases] = useState<string[]>([]);
  const [selectedReleaseGroups, setSelectedReleaseGroups] = useState<
    Group["id"][]
  >([]);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const router = useRouter();

  const formik = useFormik({
    initialValues: { artist: "" },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSubmitted(true);
      resetForm();
    },
  });

  useEffect(() => {
    if (submitted) {
      router.push(`/game/artist/${artistId}`);
    }
  }, [submitted, artistId, router]);

  let list = useAsyncList<Artist>({
    async load({ signal, filterText }) {
      if (!filterText) {
        return { items: [] };
      }

      await sleep(1000);
      const { data } = await axios.get<ArtistRoot>(
        "https://musicbrainz.org/ws/2/artist",
        {
          params: {
            query: `${filterText}`,
            fmt: "json",
          },
          headers: {
            "User-Agent": "GuessTheSongs/0.1",
          },
          signal: signal,
        }
      );
      return {
        items: data.artists,
      };
    },
  });

  const fetchReleaseGroups = useCallback(async () => {
    if (!artistId) {
      return;
    }

    try {
      let allReleases: Release[] = [];
      let offset = 0;
      const limit = 100; // MusicBrainz API limit
      let noMoreData = false;

      do {
        const { data } = await axios.get<ReleaseRoot>(
          "api/getReleases/" + artistId,
          {
            params: {
              limit: limit,
              offset: offset,
            },
          }
        );

        allReleases = [...allReleases, ...data.releases];

        if (data.releases.length < limit) {
          noMoreData = true;
        } else {
          offset += limit;
          await sleep(600);
        }
      } while (!noMoreData);

      // Filter duplicate release-groups
      const uniqueReleaseGroups = Array.from(
        new Map(
          allReleases.map((release) => [
            release["release-group"].id,
            release["release-group"],
          ])
        ).values()
      );

      // Group ReleaseGroups by Releases
      const releaseGroupsWithReleases: Group[] = uniqueReleaseGroups.map(
        (rg) => {
          const releasesForGroup = allReleases.filter(
            (release) => release["release-group"].id === rg.id
          );
          return { ...rg, releases: releasesForGroup };
        }
      );
      setReleaseGroupsReleases(releaseGroupsWithReleases);
    } catch (error) {
      console.error("Error fetching release groups:", error);
    }
  }, [artistId]);

  useEffect(() => {
    if (artistId) {
      fetchReleaseGroups();
    }
  }, [artistId, fetchReleaseGroups]);

  useEffect(() => {
    // Filter and sort the releases inside ReleaseGroupReleases and return the release groups with the filtered and sorted releases
    const filteredSorted: Group[] = releaseGroupsReleases
      .map((rg) => {
        return { ...rg, releases: filterAndSortReleases(rg.releases) };
      }).flat();

    setReleaseGroupsReleases(filteredSorted);
  }, [releaseGroupsReleases]);

  return <p></p>;
};

export default FormArtist;
