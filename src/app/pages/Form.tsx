"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import {
  Autocomplete,
  AutocompleteItem,
  RadioGroup,
  Radio,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { useAsyncList } from "@react-stately/data";
import axios from "axios";

import FormBackground from "@/app/components/FormBackground";
import FormButton from "@/app/components/FormButton";
import { Artist } from "@/types/artist";
import { Group } from "@/types/releasegroup";
import { availableSecondaryTypes } from "@/types/consts";
import { fetchReleases } from "../utils";
import { Release } from "@/types/release";

const validationSchema = Yup.object({
  album: Yup.string().required("Album or EP name is required"),
  artist: Yup.string().required("Artist name is required"),
});

const Form = () => {
  const [submitted, setSubmitted] = useState(false);
  const [artistId, setArtistId] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<Release["id"]>("");

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
      router.push(`/game/${selectedRelease}`);
    }
  }, [submitted, selectedRelease, router]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  let list = useAsyncList<Artist>({
    async load({ signal, filterText }) {
      if (!filterText) {
        return { items: [] };
      }

      await sleep(1000);
      const { data } = await axios.get("https://musicbrainz.org/ws/2/artist", {
        params: {
          query: `${filterText}`,
          fmt: "json",
        },
        headers: {
          "User-Agent": "GuessTheSongs/0.1",
        },
        signal: signal,
      });
      return {
        items: data.artists,
      };
    },
  });

  const loadAlbums = useCallback(
    async ({ signal }: { signal: AbortSignal }) => {
      if (!artistId) {
        return { items: [] };
      }
      await sleep(1000);
      const response = await axios.get(
        "https://musicbrainz.org/ws/2/release-group",
        {
          params: {
            query: `arid:${artistId} AND (primarytype:album OR primarytype:ep) AND status:official NOT (${availableSecondaryTypes.join(" OR ")})`,
            limit: 100,
            fmt: "json",
          },
          headers: {
            "User-Agent": "GuessTheSongs/0.1",
          },
          signal: signal,
        }
      );

      return {
        items: response.data["release-groups"],
      };
    },
    [artistId]
  );

  let albumList = useAsyncList<Group>({
    async load({ signal }) {
      return loadAlbums({ signal });
    },
  });

  useEffect(() => {
    albumList.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  useEffect(() => {
    async function getReleases() {
      const fetchedReleases = await fetchReleases(albumId);
      setReleases(fetchedReleases.releases);
    }
    if (albumId) {
      getReleases();
    }
  }, [albumId]);

  const sortedAlbums = albumList.items.sort((a, b) => {
    return (
      new Date(a["first-release-date"]).getTime() -
      new Date(b["first-release-date"]).getTime()
    );
  });

  const uniqueTrackCountReleases = releases.filter(
    (release, index, self) =>
      self.findIndex(
        (r) => r.media[0]["track-count"] === release.media[0]["track-count"]
      ) === index
  );

  const sortedTrackCountReleases = uniqueTrackCountReleases.sort(
    (a, b) => a.media[0]["track-count"] - b.media[0]["track-count"]
  );

  return (
    <FormBackground>
      {!submitted && (
        <>
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
              onInputChange={(value) => {
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
            <Autocomplete
              id="album"
              name="album"
              defaultItems={albumList.items}
              value={formik.values.album}
              inputValue={albumList.filterText}
              onInputChange={(value) => {
                formik.setFieldValue("album", value);
                albumList.setFilterText(value);
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
                  {item["secondary-types"]
                    ? item["secondary-types"][0]
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
                if (uniqueTrackCountReleases.length == 1) {
                  setSelectedRelease(uniqueTrackCountReleases[0].id);
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
              placement={"center"}
            >
              <ModalContent>
                {(onClose) => (
                  <>
                    <ModalHeader className="flex flex-col gap-1">
                      Select a Release
                    </ModalHeader>
                    <ModalBody>
                      <RadioGroup
                        value={selectedRelease}
                        onValueChange={setSelectedRelease}
                      >
                        {Array.isArray(sortedTrackCountReleases) &&
                        sortedTrackCountReleases.length > 0 ? (
                          sortedTrackCountReleases.map((release) => (
                            <Radio value={release.id} key={release.id}>
                              {release.title}
                              {release.disambiguation
                                ? ` (${release.disambiguation}, `
                                : " ("}
                              {`${release.media[0]["track-count"]} Tracks`}
                              {`, ${release["release-events"][0]?.date})` ||
                                ", No date available)"}
                            </Radio>
                          ))
                        ) : (
                          <p>No releases available</p>
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
        </>
      )}
      {submitted && <p>Loading...</p>}
    </FormBackground>
  );
};

export default Form;
