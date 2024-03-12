import React, { useState, useEffect } from "react";
import FormBackground from "@/app/components/FormBackground";
import axios from "axios";
import FormInput from "@/app/components/FormInput";
import Countdown, { CountdownApi } from 'react-countdown'
import FormButton from "@/app/components/FormButton";
import Form from "@/app/components/Form";

const MainGame = (props: { album: string }) => {
    const [releaseGroupMBID, setReleaseGroupMBID] = useState("");
    const [releaseMBID, setReleaseMBID] = useState("");
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentGuess, setCurrentGuess] = useState("")
    const [correctGuesses, setCorrectGuesses] = useState<string[]>([]);
    const [endTime] = useState(Date.now() + 5 * 60000)
    const [hasEnded, setHasEnded] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [buttonState, setButtonState] = useState(false)

    interface Song {
        title: string,
        position: number
    }

    const fetchReleaseGroup = async () => {
        const { data } = await axios.get("https://musicbrainz.org/ws/2/release-group", {
            params: {
                query: `${props.album} AND type:album AND status:official`,
                fmt: 'json',
                inc: 'releases',
            },
            headers: {
                "User-Agent": "GuessTheSongs/0.1"
            }
        });
        setLoaded(true)
        if (data['release-groups'] && data['release-groups'].length > 0) {
            const releaseGroup = data['release-groups'][0];
            setReleaseGroupMBID(releaseGroup.id);
        } else {
            setNotFound(true)
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
        console.log(fetchedSongs)
    }

    const normalizeString = (str: string) => {
        return str
            .replace(/’/g, "'") // Replace curly apostrophes with straight ones
            .replace(/Ä/g, 'A').replace(/ä/g, 'a')
            .replace(/Ö/g, 'O').replace(/ö/g, 'o')
            .replace(/Ü/g, 'U').replace(/ü/g, 'u')
            .toLowerCase();
    };

    const inputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const guess = e.target.value;
        setCurrentGuess(guess);

        const correctGuess = songs.find(song => normalizeString(song.title) === normalizeString(guess));
        if (correctGuess && !correctGuesses.includes(correctGuess.title)) {
            setCorrectGuesses([...correctGuesses, correctGuess.title]);
            setCurrentGuess('')
        }
    };

    const gameEnd = () => {
        setHasEnded(true)
    }

    const handleClick = () => {
      setButtonState(true)
    }

    if (buttonState) return <Form />

    // Trigger fetching the release group when the album prop changes
    useEffect(() => {
        fetchReleaseGroup();
    }, []);

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

    useEffect(() => {
        if (correctGuesses.length === songs.length && songs.length > 0) {
            gameEnd();
        }
    }, [correctGuesses, songs]); // Depend on both correctGuesses and songs

    return (
        <FormBackground>
            {!hasEnded && !notFound && loaded && (
                <>
                    <div className="flex justify-between items-center w-full">
                        <label htmlFor="song" className="text-left">Enter a Song</label>
                        <Countdown
                            date={endTime}
                            renderer={props => (
                                <p className="text-right">
                                    {props.minutes < 10 ? `0${props.minutes}` : props.minutes}:
                                    {props.seconds < 10 ? `0${props.seconds}` : props.seconds}
                                </p>
                            )}
                            onComplete={gameEnd}/>
                    </div>

                    <FormInput
                        id="song"
                        name="song"
                        type="text"
                        value={currentGuess}
                        onChange={inputChange}/>

                    <a onClick={gameEnd} className="hover:underline hover:cursor-pointer">Give Up</a>
                </>
                    )}
            <div>
                {songs.length > 0 && (
                    <ul className={(hasEnded ? '' : 'mt-6')}>
                        {songs.map((song: Song, index) => (
                            <li key={index} className="mt-3">
                                {song.position}. {correctGuesses.includes(song.title) && !hasEnded && <span>{song.title}</span>}
                                {hasEnded && <span className={(correctGuesses.includes(song.title) ? 'text-green-500' : 'text-red-600')}>{song.title}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {notFound && (
                <div className="bg-red-200 text-black px-2 py-2">
                    <p>You have made an invalid entry, or your Album wasn't found on MusicBrainz. Refresh the page to try again.</p>
                </div>
            )}
            {hasEnded && (
                <FormButton
                    onClick={handleClick}
                >
                    Restart
                </FormButton>
            )}
        </FormBackground>
    );
};

export default MainGame;
