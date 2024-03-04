import { useState, useEffect } from "react";
import FormBackground from "@/app/components/FormBackground";
import axios from "axios";
import FormInput from "@/app/components/FormInput";

const MainGame = (props: { album: string }) => {
    const [releaseGroupMBID, setReleaseGroupMBID] = useState("");
    const [releaseMBID, setReleaseMBID] = useState("");
    const [songs, setSongs] = useState({ position: 0, title: "" });

    const fetchReleaseGroup = async () => {
        const { data } = await axios.get("https://musicbrainz.org/ws/2/release-group", {
            params: {
                query: `release-group:"${props.album}"`,
                fmt: 'json',
                inc: 'releases',
            },
            headers: {
                "User-Agent": "GuessTheSongs/0.1"
            }
        });
        if (data['release-groups'] && data['release-groups'].length > 0) {
            const releaseGroup = data['release-groups'][0]; // Assuming the first result is the desired one
            setReleaseGroupMBID(releaseGroup.id);
        }
        console.log(data)
    };

    const fetchRelease = async () => {
        if (!releaseGroupMBID) return;

        const { data } = await axios.get(`https://musicbrainz.org/ws/2/release`, {
            params: {
                'release-group': releaseGroupMBID,
                fmt: 'json',
                inc: 'media',
            },
            headers: {
                "User-Agent": "GuessTheSongs/0.1"
            }
        });

        if (data.releases && data.releases.length > 0) {
            const releasesWithTrackCounts = data.releases.map((release: { id: any; media: any[]; }) => ({
                id: release.id,
                trackCount: release.media.reduce((acc, curr) => acc + curr.trackCount, 0),
            })).sort((a: { trackCount: number; }, b: { trackCount: number; }) => a.trackCount - b.trackCount);

            // Logic to find the release with the lowest track count, but consider the second one if there's more than one media object
            let selectedRelease = releasesWithTrackCounts[0]; // Default to the one with the lowest track count
            if (data.releases.find((release: { id: any; }) => release.id === selectedRelease.id).media.length > 1 && releasesWithTrackCounts.length > 1) {
                // If the selected release has more than one media object, use the second least instead
                selectedRelease = releasesWithTrackCounts[1];
            }

            setReleaseMBID(selectedRelease.id);
        }
        console.log(data)
    };

    const fetchTracklist = async () => {
        const { data } = await axios.get(`https://musicbrainz.org/ws/2/release/${releaseMBID}`, {
            params: {
                fmt: 'json',
                inc: 'recordings',
            },
            headers: {
                "User-Agent": "GuessTheSongs/0.1"
            }
        });
        const tracklist = data.media[0].tracks
        const fetchedSongs = tracklist.map((track: { position: number; title: string; }) => ({
            position: track.position,
            title: track.title
        }))
        setSongs(fetchedSongs)
    }

    // Trigger fetching the release group when the album prop changes
    useEffect(() => {
        fetchReleaseGroup();
    }, [props.album]);

    // Fetch the tracklist once we have the release group MBID
    useEffect(() => {
        if (releaseGroupMBID) {
            fetchRelease();
        }
    }, [releaseGroupMBID]);

    useEffect(() => {
        if (releaseMBID){
            fetchTracklist()
        }
    }, [releaseMBID]);

    return (
        <FormBackground>
            <label htmlFor="song">Enter a Song</label>
            <FormInput
                id="song"
                name="song"
                type="text"
            />
        </FormBackground>
    );
};

export default MainGame;
