"use client";

import React, { useCallback } from "react";
import { useState } from "react";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@nextui-org/react";
import { useFormik } from "formik";
import { useEffect } from "react";
import { useAsyncList } from "@react-stately/data";
import axios from "axios";

import { Artist, ArtistRoot } from "@/types/artist";
import { Release, ReleaseReleaseGroup, ReleaseRoot } from "@/types/release";


const validationSchema = Yup.object({
  album: Yup.string().required("Album or EP name is required"),
  artist: Yup.string().required("Artist name is required"),
});

const FormAlbum = () => {
  const [submitted, setSubmitted] = useState(false);
  const [artistId, setArtistId] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<Release["id"]>("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      album: "",
      artist: "",
    },
    validationSchema,
    onSubmit: (values, { resetForm }) => {
      setSubmitted(true);
      resetForm();
    },
  });

  useEffect(() => {
    if (submitted && selectedRelease) {
      router.push(`/game/album/${selectedRelease}`);
    }
  }, [submitted, selectedRelease, router, artistId]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  let albumList = useAsyncList<ReleaseReleaseGroup>({
    async load({ signal }) {
      if (!artistId) {
        return { items: [] };
      }
      await sleep(1000);

      const { data } = await axios.get<ReleaseRoot>(
        "https://musicbrainz.org/ws/2/release",
        {
          params: {
            query: `arid:${artistId}`,
            fmt: "json",
          },
          headers: {
            "User-Agent": "GuessTheSongs/0.1",
          },
          signal: signal,
        }
      );

      return {
        items: data.releases.map((release) => release["release-group"]),
      };
    },
  });

  return <div>FormAlbum</div>;
};

export default FormAlbum;
