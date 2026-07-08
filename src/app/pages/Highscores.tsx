"use client";

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
  Tab,
  Tabs,
  useDisclosure,
} from "@heroui/react";
import { useAsyncList } from "@react-stately/data";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Artist, ArtistRoot } from "@/types/artist";
import { Release, ReleaseReleaseGroup } from "@/types/release";
import { ConfigSchema } from "@/types/config";
import {
  filterAndSortReleases,
  filterUniqueReleaseGroups,
  getAllReleases,
  parseConfig,
  sleep,
  sortAlbums,
} from "../utils";
import { getConfigurationsByArtist } from "../actions";
import Scoreboard from "../components/Scoreboard";
import { AlbumList } from "../components/AlbumList";

const useArtistSearch = () =>
  useAsyncList<Artist>({
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
          signal,
        },
      );
      return {
        items: data.artists,
      };
    },
  });

const ArtistHighscores = () => {
  const [artistId, setArtistId] = useState("");
  const [configs, setConfigs] = useState<ConfigSchema[]>([]);
  const [configSelection, setConfigSelection] = useState<string>("all");
  const [viewConfig, setViewConfig] = useState<ConfigSchema | null>(null);

  const list = useArtistSearch();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    setConfigSelection("all");
    if (!artistId) {
      setConfigs([]);
      return;
    }

    const loadConfigs = async () => {
      try {
        const data = await getConfigurationsByArtist(artistId);
        setConfigs(data);
      } catch (err) {
        console.error("Error fetching configurations:", err);
        setConfigs([]);
      }
    };
    loadConfigs();
  }, [artistId]);

  return (
    <div className="flex flex-col">
      <Autocomplete
        id="artist"
        name="artist"
        items={list.items}
        inputValue={list.filterText}
        onInputChange={(value: string) => {
          if (value === "") {
            setArtistId("");
          }
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
            {item.name} {item.disambiguation ? `(${item.disambiguation})` : ""}
          </AutocompleteItem>
        ))}
      </Autocomplete>

      {artistId && (
        <>
          <RadioGroup
            label="Which configuration?"
            value={configSelection}
            onValueChange={setConfigSelection}
            className="mb-4"
          >
            <Radio value="all">All configurations</Radio>
            {configs.map((cfg) => {
              const count = parseConfig(cfg.config).filter(
                (id) => id !== "",
              ).length;
              return (
                <Radio key={cfg.id} value={String(cfg.id)}>
                  {`Configuration #${cfg.id} (${count} ${count === 1 ? "album" : "albums"})`}
                </Radio>
              );
            })}
          </RadioGroup>

          {configSelection !== "all" && (
            <Button
              size="sm"
              variant="light"
              color="primary"
              className="mb-4 self-start"
              onPress={() => {
                const cfg = configs.find(
                  (c) => String(c.id) === configSelection,
                );
                if (cfg) {
                  setViewConfig(cfg);
                  onOpen();
                }
              }}
            >
              View albums in this configuration
            </Button>
          )}

          <div className="mt-2 flex justify-center">
            <Scoreboard
              key={artistId}
              mbid={artistId}
              types="artist"
              mode="default"
              configMode={configSelection === "all" ? "all" : "this"}
              configId={
                configSelection === "all" ? undefined : Number(configSelection)
              }
            />
          </div>
        </>
      )}

      {viewConfig && (
        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          size="2xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  <h2 className="text-2xl font-bold">Selected Albums</h2>
                </ModalHeader>
                <ModalBody>
                  <AlbumList config={viewConfig} />
                </ModalBody>
                <ModalFooter>
                  <Button color="primary" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

const AlbumHighscores = () => {
  const [artistId, setArtistId] = useState("");
  const [allReleases, setAllReleases] = useState<Release[]>([]);
  const [allReleaseGroups, setAllReleaseGroups] = useState<
    ReleaseReleaseGroup[]
  >([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["albumep"]);
  const [releaseGroupId, setReleaseGroupId] = useState("");
  const [releases, setReleases] = useState<Release[]>([]);
  const [scope, setScope] = useState<string>("releasegroup");

  const list = useArtistSearch();

  const fetchReleaseGroups = useCallback(async () => {
    if (!artistId) {
      return;
    }
    try {
      const fetched = await getAllReleases(artistId);
      setAllReleases(fetched);
      setAllReleaseGroups(filterUniqueReleaseGroups(fetched));
    } catch (error) {
      console.error("Error fetching release groups:", error);
    }
  }, [artistId]);

  useEffect(() => {
    if (artistId) {
      fetchReleaseGroups();
    } else {
      setAllReleases([]);
      setAllReleaseGroups([]);
    }
  }, [artistId, fetchReleaseGroups]);

  const releaseGroups = useMemo(() => {
    const groups: ReleaseReleaseGroup[] = [];
    if (selectedTypes.includes("albumep")) {
      groups.push(
        ...allReleaseGroups.filter(
          (item) =>
            (item["primary-type"] === "Album" ||
              item["primary-type"] === "EP") &&
            item["secondary-types"]?.length === 0,
        ),
      );
    }
    if (selectedTypes.includes("live")) {
      groups.push(
        ...allReleaseGroups.filter((item) =>
          item["secondary-types"]?.includes("Live"),
        ),
      );
    }
    if (selectedTypes.includes("compilation")) {
      groups.push(
        ...allReleaseGroups.filter((item) =>
          item["secondary-types"]?.includes("Compilation"),
        ),
      );
    }
    return Array.from(
      new Map(groups.map((item) => [item.id, item])).values(),
    );
  }, [selectedTypes, allReleaseGroups]);

  const sortedAlbums = sortAlbums(releaseGroups);

  useEffect(() => {
    setScope("releasegroup");
    if (releaseGroupId) {
      const filtered = allReleases.filter(
        (release) => release["release-group"].id === releaseGroupId,
      );
      setReleases(filterAndSortReleases(filtered));
    } else {
      setReleases([]);
    }
  }, [releaseGroupId, allReleases]);

  return (
    <div className="flex flex-col">
      <Autocomplete
        id="artist"
        name="artist"
        items={list.items}
        inputValue={list.filterText}
        onInputChange={(value: string) => {
          if (value === "") {
            setArtistId("");
            setReleaseGroupId("");
          }
          list.setFilterText(value);
        }}
        onKeyDown={(e: any) => e.continuePropagation()}
        isLoading={list.isLoading}
        className="mb-4"
        label="Enter an Artist"
        onSelectionChange={(key) => {
          if (key) {
            setArtistId(key.toString());
            setReleaseGroupId("");
          }
        }}
      >
        {list.items.map((item) => (
          <AutocompleteItem key={item.id} textValue={item.name}>
            {item.name} {item.disambiguation ? `(${item.disambiguation})` : ""}
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
        defaultItems={sortedAlbums}
        onInputChange={(value: string) => {
          if (value === "") {
            setReleaseGroupId("");
          }
        }}
        onKeyDown={(e: any) => e.continuePropagation()}
        className={`mb-4 ${artistId ? "" : "hidden"}`}
        label="Enter an Album or an EP by that Artist"
        onSelectionChange={(key) => {
          if (key) {
            setReleaseGroupId(key.toString());
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

      {releaseGroupId && (
        <>
          <RadioGroup
            label="Which scores?"
            value={scope}
            onValueChange={setScope}
            className="mb-4"
          >
            <Radio value="releasegroup">
              Whole Release Group (any release)
            </Radio>
            {releases.map((release) => (
              <Radio value={release.id} key={release.id}>
                {release.title}
                {release.disambiguation
                  ? ` (${release.disambiguation}, `
                  : " ("}
                {`${release.combinedTracks} Tracks, `}
                {release["release-events"]?.[0]?.date
                  ? `${release["release-events"][0].date})`
                  : "No Date available)"}
              </Radio>
            ))}
          </RadioGroup>

          <div className="mt-2 flex justify-center">
            <Scoreboard
              key={scope}
              mbid={scope === "releasegroup" ? releaseGroupId : scope}
              types={scope === "releasegroup" ? "releasegroup" : "release"}
              mode="default"
            />
          </div>
        </>
      )}
    </div>
  );
};

const Highscores = () => {
  return (
    <Tabs className="grid mb-3" aria-label="Highscores type">
      <Tab key="album" title="Album">
        <AlbumHighscores />
      </Tab>
      <Tab key="artist" title="Artist">
        <ArtistHighscores />
      </Tab>
    </Tabs>
  );
};

export default Highscores;
