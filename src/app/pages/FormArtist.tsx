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
  Radio,
  RadioGroup,
  useDisclosure,
} from "@heroui/react";
import { useAsyncList } from "@react-stately/data";
import axios from "axios";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import * as Yup from "yup";
import {
  filterAndSortReleases,
  filterUniqueReleaseGroups,
  getAllReleases,
  sleep,
  sortAlbums,
} from "../utils";
import { Release } from "@/types/release";
import FormButton from "../components/FormButton";
import { getConfigurationId, createConfiguration, getLastConfigurationId } from "../actions";

const validationSchema = Yup.object({
  artist: Yup.string().required("Artist is required"),
});

const FormArtist = () => {
  const [submitted, setSubmitted] = useState(false);
  const [artistId, setArtistId] = useState("");
  const [releaseGroupsReleases, setReleaseGroupsReleases] = useState<Group[]>(
    [],
  );
  const [selectedReleases, setSelectedReleases] = useState<Release["id"][]>([]);
  const [selectedReleaseGroups, setSelectedReleaseGroups] = useState<
    Group["id"][]
  >([]);
  const [sortedReleaseGroups, setSortedReleaseGroups] = useState<Group[]>([]);
  const [filteredReleaseGroups, setFilteredReleaseGroups] = useState<Group[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "albumep",
    "mixtapestreet",
    "soundtrack",
    "remix",
    "demo",
  ]);
  const [loaded, setLoaded] = useState(false);
  const [configId, setConfigId] = useState<number | null>(null);

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
      router.push(`/game/artist/${artistId}/${configId}`);
    }
  }, [submitted, artistId, configId, router]);

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
        },
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
      const allReleases = await getAllReleases(artistId);
      // Filter duplicate release-groups
      const uniqueReleaseGroups = filterUniqueReleaseGroups(allReleases);

      // Group ReleaseGroups by Releases
      const releaseGroupsWithReleases: Group[] = sortAlbums(
        uniqueReleaseGroups,
      ).map((rg) => {
        const releasesForGroup = allReleases.filter(
          (release) => release["release-group"].id === rg.id,
        );
        return { ...rg, releases: releasesForGroup };
      });
      setReleaseGroupsReleases(releaseGroupsWithReleases);
      setSelectedReleaseGroups(
        releaseGroupsWithReleases.flatMap((rg) => {
          return rg.id;
        }),
      );
      setLoaded(true);
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

      setSortedReleaseGroups(filteredSorted);
    }
  }, [releaseGroupsReleases]);

  useEffect(() => {
    const initialSelectedReleases: Release["id"][] = [];
    filteredReleaseGroups.forEach((releaseGroup) => {
      // If there is only one release, automatically select it
      if (releaseGroup.releases.length === 1) {
        initialSelectedReleases.push(releaseGroup.releases[0].id);
      }
    });
    setSelectedReleases(initialSelectedReleases);
  }, [filteredReleaseGroups]);

  useEffect(() => {
    if (!artistId) {
      setReleaseGroupsReleases([]);
    }
  }, [artistId]);

  useEffect(() => {
    const releaseGroups: Group[] = [];

    if (selectedTypes.includes("albumep")) {
      releaseGroups.push(...sortedReleaseGroups.filter(item => (item["primary-type"] === "Album" || item["primary-type"] === "EP") && item["secondary-types"]?.length === 0));
    }
    if (selectedTypes.includes("mixtapestreet")) {
      releaseGroups.push(...sortedReleaseGroups.filter(item => item["secondary-types"]?.includes("Mixtape/Street")));
    }
    if (selectedTypes.includes("soundtrack")) {
      releaseGroups.push(...sortedReleaseGroups.filter(item => item["secondary-types"]?.includes("Soundtrack")));
    }
    if (selectedTypes.includes("remix")) {
      releaseGroups.push(...sortedReleaseGroups.filter(item => item["secondary-types"]?.includes("Remix")));
    }
    if (selectedTypes.includes("demo")) {
      releaseGroups.push(...sortedReleaseGroups.filter(item => item["secondary-types"]?.includes("Demo")));
    }
    if (selectedTypes.includes("live")) {
      releaseGroups.push(...sortedReleaseGroups.filter(item => item["secondary-types"]?.includes("Live")));
    }
    if (selectedTypes.includes("compilation")) {
      releaseGroups.push(...sortedReleaseGroups.filter(item => item["secondary-types"]?.includes("Compilation")));
    }
    // Just in case an album fits multiple criteria, filter duplicates
    const unique = Array.from(
      new Map(
        releaseGroups.map((item) => [item.id, item])
      ).values()
    );
    setFilteredReleaseGroups(unique);
  }, [selectedTypes, sortedReleaseGroups]);

  const handleRadioChange = (releaseGroup: Group, releaseId: string) => {
    setSelectedReleases(prev => {
      // Remove any existing selection from this release group
      const filtered = prev.filter(id => 
        !releaseGroup.releases.some(r => r.id === id)
      );
      // Add the new selection
      return [...filtered, releaseId];
    });
  };

  const handleCheckboxChange = (selectedGroupIds: Group["id"][]) => {
    setSelectedReleaseGroups(selectedGroupIds);

    setSelectedReleases(prev => {
      // Only keep releases that belong to still-selected release groups
      return prev.filter(releaseId => {
        const releaseGroup = releaseGroupsReleases.find(rg => 
          rg.releases.some(r => r.id === releaseId)
        );
        return releaseGroup && selectedGroupIds.includes(releaseGroup.id);
      });
    });
  };

  const handleStartButton = async () => {
    const configString = JSON.stringify(selectedReleases);

    // Check if configuration already exists
    const existingConfig = await getConfigurationId(configString);
    let configId: number;

    if (existingConfig.length > 0) {
      configId = existingConfig[0].id;
    } else {
      // Create new configuration
      await createConfiguration({
        mbid: artistId,
        config: configString,
      });
      const newConfig = await getLastConfigurationId();
      configId = newConfig[0].id;
    }
    setConfigId(configId);
    setSubmitted(true);
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
                  setFilteredReleaseGroups([]);
                  setLoaded(false);
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
              <ModalContent style={{ maxHeight: "80vh", overflowY: "auto"}}>
                {(onClose: any) => (
                  <>
                    <ModalHeader
                      style={{ marginBottom: "10px", padding: "10px" }}
                    >
                      {loaded && (
                        <CheckboxGroup
                          orientation="horizontal"
                          classNames={{
                            wrapper: "gap-4",
                          }}
                          value={selectedTypes}
                          onValueChange={setSelectedTypes}
                        >
                          <Checkbox value="albumep">Album/EP</Checkbox>
                          <Checkbox value="mixtapestreet">Mixtape</Checkbox>
                          <Checkbox value="soundtrack">Soundtrack</Checkbox>
                          <Checkbox value="remix">Remix</Checkbox>
                          <Checkbox value="demo">Demo</Checkbox>
                          <Checkbox value="live">Live</Checkbox>
                          <Checkbox value="compilation">Compilation</Checkbox>
                        </CheckboxGroup>
                      )}
                    </ModalHeader>
                    <ModalBody style={{ padding: "10px" }}>
                      {!loaded && (
                        <p>Loading release groups...</p>
                      )}
                      {loaded && filteredReleaseGroups.length === 0 && (
                        <p className="italic text-gray-600">No albums.</p>
                      )}
                      <CheckboxGroup
                        value={selectedReleaseGroups}
                        onValueChange={handleCheckboxChange}
                      >
                        {filteredReleaseGroups.map((releaseGroup, index) => (
                          <div
                            key={releaseGroup.id}
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
                                    4,
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
                              releaseGroup.id,
                            ) && (
                              <RadioGroup
                                value={releaseGroup.releases.find(r => selectedReleases.includes(r.id))?.id || ""}
                                onValueChange={(value) =>
                                  handleRadioChange(releaseGroup, value)
                                }
                                key={releaseGroup.id}
                                style={{ padding: "10px 0" }}
                              >
                                {releaseGroup.releases.map((release) => (
                                  <Radio value={release.id} key={release.id}>
                                    {release.title}
                                    {` (${release.combinedTracks} Tracks`}
                                    {release.disambiguation
                                      ? `, ${release.disambiguation}`
                                      : ""}
                                    {release.date
                                      ? `, ${release.date})`
                                      : ", No Date available)"}
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
                      {filteredReleaseGroups.length !== 0 && (
                        <Button
                          color="primary"
                          type="submit"
                          onPress={handleStartButton}
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
