"use client";

import { ArtistRoot, Artist } from "@/types/artist";
import { Group } from "@/types/releasegroup";
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
  Progress,
  Radio,
  RadioGroup,
  useDisclosure,
} from "@nextui-org/react";
import { useAsyncList } from "@react-stately/data";
import axios from "axios";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import * as Yup from "yup";
import { filterAndSortReleases, sleep, sortAlbums } from "../utils";
import { ReleaseRoot, Release, ReleaseReleaseGroup } from "@/types/release";
import FormButton from "../components/FormButton";

const validationSchema = Yup.object({
  artist: Yup.string().required("Artist is required"),
});

const FormArtist = () => {
  const [submitted, setSubmitted] = useState(false);
  const [artistId, setArtistId] = useState("");
  const [releaseGroupsReleases, setReleaseGroupsReleases] = useState<Group[]>(
    []
  );
  const [selectedReleases, setSelectedReleases] = useState<Release["id"][]>([]);
  const [selectedReleaseGroups, setSelectedReleaseGroups] = useState<
    Group["id"][]
  >([]);
  const [sortedReleaseGroups, setSortedReleaseGroups] = useState<Group[]>([]);

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
      const releaseGroupsWithReleases: Group[] = sortAlbums(uniqueReleaseGroups).map(
        (rg) => {
          const releasesForGroup = allReleases.filter(
            (release) => release["release-group"].id === rg.id
          );
          return { ...rg, releases: releasesForGroup };
        }
      );
      setReleaseGroupsReleases(releaseGroupsWithReleases);
      setSelectedReleaseGroups(
        releaseGroupsWithReleases.flatMap((rg) => {
          return rg.id;
        })
      );
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
    if (releaseGroupsReleases.length > 0) {
      const filteredSorted: Group[] = releaseGroupsReleases
        .map((rg) => {
          return { ...rg, releases: filterAndSortReleases(rg.releases) };
        })
        .flat();

      setSortedReleaseGroups(filteredSorted)
    }
  }, [releaseGroupsReleases]);

  useEffect(() => {
    const initialSelectedReleases = sortedReleaseGroups.map(
      (releaseGroup) => {
        // If there is only one release, automatically select it
        return releaseGroup.releases.length === 1
          ? releaseGroup.releases[0].id
          : "";
      }
    );
    setSelectedReleases(initialSelectedReleases);
  }, [sortedReleaseGroups]);

  useEffect(() => {
    if (selectedReleases) {
      window.localStorage.setItem("releases", JSON.stringify(selectedReleases));
    }
  }, [selectedReleases]);

  useEffect(() => {
    if (!artistId) {
      setReleaseGroupsReleases([]);
    }
  }, [artistId]);

  const handleRadioChange = (index: number, value: string) => {
    const newSelectedReleases = [...selectedReleases]; // Create a copy of the state array
    newSelectedReleases[index] = value; // Update the selected value for the specific RadioGroup
    setSelectedReleases(newSelectedReleases); // Update the state with the new array
  };

  const handleCheckboxChange = (selectedGroupIds: Group["id"][]) => {
    setSelectedReleaseGroups(selectedGroupIds);

    const newSelectedReleases = selectedReleases.map((releaseId, index) => {
      const releaseGroupId = releaseGroupsReleases[index].id;
      return selectedGroupIds.includes(releaseGroupId) ? releaseId : "";
    });
    setSelectedReleases(newSelectedReleases);
  };

  return (
    <>
      {!submitted ? (
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
            <FormButton
              onPress={() => {
                if (formik.values.artist) {
                  onOpen();
                }
                formik.unregisterField("album");
              }}
            >
              Go!
            </FormButton>
            <Modal
              isOpen={isOpen}
              placement="top-center"
              onOpenChange={onOpenChange}
              isDismissable={false}
              isKeyboardDismissDisabled={true}
              size="xl"
            >
              <ModalContent style={{ maxHeight: "80vh", overflowY: "auto" }}>
                {(onClose: any) => (
                  <>
                    <ModalHeader
                      className="flex flex-col gap-1"
                      style={{ marginBottom: "10px", padding: "10px" }}
                    ></ModalHeader>
                    <ModalBody style={{ padding: "10px" }}>
                      {sortedReleaseGroups.length === 0 && (
                        <p>Loading release groups...</p>
                      )}
                      <CheckboxGroup
                        value={selectedReleaseGroups}
                        onValueChange={handleCheckboxChange}
                      >
                        {sortedReleaseGroups.map((releaseGroup, index) => (
                          <div
                            key={releaseGroup.title}
                            style={{ marginBottom: "20px" }}
                          >
                            <hr />
                            <h1 style={{ fontSize: "30px" }}>
                              {releaseGroup.title}
                              {" ("}
                              {releaseGroup["secondary-types"]?.[0]
                                ? releaseGroup["secondary-types"][0] + "-"
                                : ""}
                              {releaseGroup["primary-type"]}
                              {", "}
                              {releaseGroup["first-release-date"]
                                ? releaseGroup["first-release-date"].substring(
                                    0,
                                    4
                                  )
                                : "No Year available"}
                              {")"}
                              <Checkbox
                                value={releaseGroup.id}
                                style={{ marginLeft: 5 }}
                              />
                            </h1>
                            <hr />
                            {selectedReleaseGroups.includes(
                              releaseGroup.id
                            ) && (
                              <RadioGroup
                                value={selectedReleases[index]}
                                onValueChange={(value) =>
                                  handleRadioChange(index, value)
                                }
                                key={releaseGroup.id}
                                style={{ padding: "10px 0" }}
                              >
                                {releaseGroup.releases.map((release) => (
                                  <Radio value={release.id} key={release.id}>
                                    {release.title}
                                    {release.disambiguation
                                      ? ` (${release.disambiguation}, `
                                      : " ("}
                                    {`${release.combinedTracks} Tracks)`}
                                  </Radio>
                                ))}
                              </RadioGroup>
                            )}
                          </div>
                        ))}
                      </CheckboxGroup>
                    </ModalBody>
                    <ModalFooter>
                      <Button color="danger" variant="light" onPress={onClose}>
                        Return to Form
                      </Button>
                      {sortedReleaseGroups.length !== 0 && (
                        <Button
                          color="primary"
                          type="submit"
                          onPress={() => setSubmitted(true)}
                        >
                          Start!
                        </Button>
                      )}
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>
          </form>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </>
  );
};

export default FormArtist;
