"use client";

import React, { useEffect, useState, useCallback, Key } from "react";
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
  Tab,
  Tabs,
} from "@nextui-org/react";
import { useAsyncList } from "@react-stately/data";
import axios from "axios";

import FormBackground from "@/app/components/FormBackground";
import FormButton from "@/app/components/FormButton";
import { Artist, ArtistRoot } from "@/types/artist";
import { Group, ReleaseGroupRoot } from "@/types/releasegroup";
import { availableSecondaryTypes } from "@/types/consts";
import { fetchArtistReleaseGroups, fetchReleases } from "../utils";
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
  const [releaseGroups, setReleaseGroups] = useState<Group[]>([]);
  const [releaseGroupsReleases, setReleaseGroupsReleases] = useState<ReleaseGroup[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<Release["id"]>("");
  const [selectedTab, setSelectedTab] = useState<Key>("album");

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const router = useRouter();

  interface ReleaseGroup {
    name: string;
    releases: Release[];
  }

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
    if (selectedTab === "album") {
      if (submitted && selectedRelease) {
        router.push(`/game/album/${selectedRelease}`);
      }
    } else if (selectedTab === "artist") {
      if (submitted) {
      }
    }
  }, [submitted, selectedRelease, router, selectedTab]);

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

  const loadAlbums = useCallback(
    async ({ signal }: { signal: AbortSignal }) => {
      if (!artistId) {
        return { items: [] };
      }
      await sleep(1000);
      const response = await axios.get<ReleaseGroupRoot>(
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
    const getReleaseGroups = async () => {
      await sleep(1000);
      const fetchedReleaseGroups = await fetchArtistReleaseGroups(artistId);
      setReleaseGroups(fetchedReleaseGroups);

      // Fetch releases for each release group and populate releaseGroupsReleases array
      const releasesData = await Promise.all(
        fetchedReleaseGroups.map(async (group) => {
          await sleep(1000);
          const fetchedReleases = await fetchReleases(group.id);
          return {
            name: group.title,
            releases: fetchedReleases.releases,
          };
        })
      );

      setReleaseGroupsReleases(releasesData);
    };

    if (selectedTab === "artist" && artistId) {
      getReleaseGroups();
    }
  }, [artistId, selectedTab]);

  useEffect(() => {
    const getReleaseGroups = async () => {
      const fetchedReleaseGroups = await fetchArtistReleaseGroups(artistId);
      setReleaseGroups(fetchedReleaseGroups);
    }

    if (selectedTab === "artist" && artistId) {
      getReleaseGroups();
    }
  }, [artistId, selectedTab]);

  if (releaseGroups) {
    releaseGroups.forEach(async (group) => {
      const fetchedReleases = await fetchReleases(group.id);
    });
  }

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
            <Tabs
              className="grid mb-3"
              onSelectionChange={(key) => setSelectedTab(key)}
            >
              <Tab key="album" title="Album">
                <Autocomplete
                  id="artist"
                  name="artist"
                  items={list.items}
                  value={formik.values.artist}
                  inputValue={list.filterText}
                  onInputChange={(value: string) => {
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
                  onInputChange={(value: string) => {
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
                  <div className="text-red-500 text-xs">
                    {formik.errors.album}
                  </div>
                ) : null}
                {formik.touched.artist && formik.errors.artist ? (
                  <div className="text-red-500 text-xs">
                    {formik.errors.artist}
                  </div>
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
                          <Button
                            color="danger"
                            variant="light"
                            onPress={onClose}
                          >
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
              </Tab>
              <Tab key="artist" title="Artist">
                <Autocomplete
                  id="artist"
                  name="artist"
                  items={list.items}
                  value={formik.values.artist}
                  inputValue={list.filterText}
                  onInputChange={(value: string) => {
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
                <FormButton onPress={() => formik.unregisterField("album")}>
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
                          Select the Releases
                        </ModalHeader>
                        <ModalBody></ModalBody>
                      </>
                    )}
                  </ModalContent>
                </Modal>
              </Tab>
            </Tabs>
          </form>
        </>
      )}
      {submitted && <p>Loading...</p>}
    </FormBackground>
  );
};

export default Form;
