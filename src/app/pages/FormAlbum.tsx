"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Checkbox,
  CheckboxGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  useDisclosure,
} from "@nextui-org/react";
import { useFormik } from "formik";
import { useAsyncList } from "@react-stately/data";
import axios from "axios";

import { Artist, ArtistRoot } from "@/types/artist";
import { Release, ReleaseReleaseGroup, ReleaseRoot } from "@/types/release";
import { filterAndSortReleases, sortAlbums } from "../utils";
import FormButton from "../components/FormButton";

const validationSchema = Yup.object({
  album: Yup.string().required("Album or EP name is required"),
  artist: Yup.string().required("Artist name is required"),
});

const FormAlbum = () => {
  const [submitted, setSubmitted] = useState(false);
  const [artistId, setArtistId] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [allReleases, setAllReleases] = useState<Release[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [sortedReleases, setSortedReleases] = useState<Release[]>([]);
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
            signal: signal,
          }
        );

        allReleases = [...allReleases, ...data.releases];

        if (data.releases.length < limit) {
          noMoreData = true;
        } else {
          offset += limit;
          await sleep(600);
        }
      } while (!noMoreData)
      setAllReleases(allReleases);
      // Filter duplicate release-groups
      const uniqueReleaseGroups = Array.from(
        new Map(
          allReleases.map((release) => [
            release["release-group"].id,
            release["release-group"],
          ])
        ).values()
      );

      return {
        items: uniqueReleaseGroups,
      };
    },
  });

  useEffect(() => {
    if (artistId) {
      albumList.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId, selectedTypes]);

  useEffect(() => {
    const rgs = albumList.items;
    
  }, [selectedTypes]);

  useEffect(() => {
    if (albumId) {
      const filteredReleases = allReleases.filter(
        (release) => release["release-group"].id === albumId
      );
      setReleases(filteredReleases);
    }
  }, [albumId, allReleases]);

  const sortedAlbums = sortAlbums(albumList.items);

  useEffect(() => {
    setSortedReleases(filterAndSortReleases(releases));
  }, [releases]);

  return (
    <>
      {!submitted && (
        <form
          className="block text-sm font-medium leading-6 text-gray-900"
          onSubmit={formik.handleSubmit}
        >
          <Autocomplete
            id="artist"
            name="artist"
            items={list.items}
            value={formik.values.artist}
            inputValue={list.filterText}
            onInputChange={(value: string) => {
              if (value === "") {
                setArtistId("");
              }
              formik.setFieldValue("artist", value);
              list.setFilterText(value);
            }}
            onKeyDown={(e: any) => e.continuePropagation()}
            isLoading={list.isLoading}
            className="mb-4"
            label="Enter an Artist"
            onSelectionChange={(key) => {
              if (key) {
                setArtistId(key.toString());
              }
            }}
          >
            {list.items.map((item) => (
              <AutocompleteItem key={item.id} textValue={item.name}>
                {item.name}{" "}
                {item.disambiguation ? `(${item.disambiguation})` : ""}
              </AutocompleteItem>
            ))}
          </Autocomplete>
          <CheckboxGroup
            value={selectedTypes}
            onValueChange={setSelectedTypes}
            orientation="horizontal"
            className={`mb-4 ${artistId ? "" : "hidden"}`}
          >
            <Checkbox value="albumep">Album/EP</Checkbox>
            <Checkbox value="live">Live</Checkbox>
            <Checkbox value="compilation">Compilation</Checkbox>
          </CheckboxGroup>
          <Autocomplete
            id="album"
            name="album"
            defaultItems={albumList.items}
            value={formik.values.album}
            onInputChange={(value: string) => {
              if (value == "") {
                setArtistId("");
              }
              formik.setFieldValue("album", value);
            }}
            onKeyDown={(e: any) => e.continuePropagation()}
            label="Enter an Album or an EP by that Artist"
            onSelectionChange={(key) => {
              if (key) {
                setAlbumId(key.toString());
              }
            }}
          >
            {sortedAlbums.map((item) => (
              <AutocompleteItem key={item.id} textValue={item.title}>
                {item.title} (
                {Array.isArray(item["secondary-types"]) &&
                item["secondary-types"].length > 0
                  ? `${item["secondary-types"].join("-")}-${item["primary-type"]}`
                  : item["primary-type"]}
                ,{" "}
                {item["first-release-date"]
                  ? item["first-release-date"].substring(0, 4)
                  : "Date unavailable"}
                )
              </AutocompleteItem>
            ))}
          </Autocomplete>
          {formik.touched.album && formik.errors.album ? (
            <div className="text-red-500 text-xs">{formik.errors.album}</div>
          ) : null}
          {formik.touched.artist && formik.errors.artist ? (
            <div className="text-red-500 text-xs">{formik.errors.artist}</div>
          ) : null}
          <FormButton
            onPress={() => {
              if (formik.values.album && formik.values.artist) {
                onOpen();
              }
              if (sortedReleases.length === 1) {
                setSelectedRelease(sortedReleases[0].id);
                setSubmitted(true);
              }
            }}
          >
            Go!
          </FormButton>
          <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isDismissable={false}
            isKeyboardDismissDisabled={true}
          >
            <ModalContent>
              {(onClose: any) => (
                <>
                  <ModalHeader className="flex flex-col gap-1">
                    Select a Release
                  </ModalHeader>
                  <ModalBody>
                    <RadioGroup
                      value={selectedRelease}
                      onValueChange={setSelectedRelease}
                    >
                      {Array.isArray(sortedReleases) &&
                      sortedReleases.length > 0 ? (
                        sortedReleases.map((release) => (
                          <Radio value={release.id} key={release.id}>
                            {release.title}
                            {release.disambiguation
                              ? ` (${release.disambiguation}, `
                              : " ("}
                            {`${release.combinedTracks} Tracks, `}
                            {release["release-events"]
                              ? `${release["release-events"][0].date})`
                              : "No Date available)"}
                          </Radio>
                        ))
                      ) : (
                        <p>Loading...</p>
                      )}
                    </RadioGroup>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Return to Form
                    </Button>
                    <Button
                      color="primary"
                      type="submit"
                      onPress={() => setSubmitted(true)}
                    >
                      Select this Release
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </form>
      )}
      {submitted && <p>Loading...</p>}
    </>
  );
};

export default FormAlbum;
