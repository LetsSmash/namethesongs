'use client'

import React, {useEffect, useState} from "react";
import { useFormik } from "formik";
import * as Yup from 'yup';
import {useRouter} from 'next/navigation'
import {Autocomplete, AutocompleteItem} from "@nextui-org/react";
import {useAsyncList} from "@react-stately/data";
import axios from 'axios'

import FormBackground from "@/app/components/FormBackground";
import FormButton from "@/app/components/FormButton";
import { Artist } from "@/types/artist";
import { Group } from "@/types/releasegroup";

const validationSchema = Yup.object({
    album: Yup.string()
        .required('Album or EP name is required'),
    artist: Yup.string()
        .required('Artist name is required'),
});

const Form = () => {
    const [submitted, setSubmitted] = useState(false);
    const [artist, setArtist] = useState("")
    const [album, setAlbum] = useState("")
    const [artistId, setArtistId] = useState("")

    const router = useRouter()

    const formik = useFormik({
        initialValues: {
            album: "",
            artist: "",
        },
        validationSchema,
        onSubmit: (values, { resetForm }) => {
            setArtist(values.artist)
            setAlbum(values.album)
            setSubmitted(true);
            resetForm();
        },
    });

    useEffect(() => {
        if (submitted) {
            router.push(`/game/${artist}/${album}`);
        }
    }, [submitted, album, artist, router]);

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    let list = useAsyncList<Artist>({
        async load({signal, filterText}) {

            if (!filterText) {
                return { items: [] };
            }

            await sleep(1000)
            const { data } = await axios.get("https://musicbrainz.org/ws/2/artist", {
                params: {
                    query: `${filterText}`,
                    fmt: 'json'
                },
                headers: {
                    "User-Agent": "GuessTheSongs/0.1"
                },
                signal: signal
            })
            return {
                items: data.artists
            }
        }
    })

    let albumList = useAsyncList<Group>({
        async load({signal, filterText}) {
            if (!formik.values.artist) {
                return { items: [] };
            }

            await sleep(1000)
            const { data } = await axios.get("https://musicbrainz.org/ws/2/release-group", {
                params: {
                    query: `arid:${artistId} AND (primarytype:album OR primarytype:ep) AND status:official NOT (secondarytype:Spokenword OR secondarytype:Interview OR secondarytype:Audiobook OR secondarytype:audiodrama OR secondarytype:Live OR secondarytype:Remix OR secondarytype:DJ-mix OR secondarytype:Demo OR secondarytype:Fieldrecording)`,
                    limit: 100,
                    fmt: 'json',
                },
                headers: {
                    "User-Agent": "GuessTheSongs/0.1"
                },
                signal: signal
            })
            return {
                items: data["release-groups"]
            }
        }
    })

    useEffect(() => {
        albumList.reload();
    }, [artistId]);

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
                        formik.setFieldValue('artist',value);
                        list.setFilterText(value)
                    }}
                    onKeyDown={(e: any) => e.continuePropagation()}
                    isLoading={list.isLoading}
                    className="mb-4"
                    label="Enter an Artist"
                    onSelectionChange={(key) => {
                        setArtistId(key.toString())
                    }}
                >
                    {list.items.map((item) => (
                        <AutocompleteItem key={item.id} textValue={item.name}>
                            {item.name} {item.disambiguation ? `(${item.disambiguation})`: ""}
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
                        formik.setFieldValue('album',value);
                        albumList.setFilterText(value)
                    }}
                    onKeyDown={(e: any) => e.continuePropagation()}
                    label="Enter an Album or an EP by that Artist"
                >
                    {albumList.items.map((item) => (
                        <AutocompleteItem key={item.id} textValue={item.title}>
                            {item.title}
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
                    type="submit"
                >
                    Go!
                </FormButton>
            </form>
                </>
                )}
            {submitted && (
                <p>Loading...</p>
                )}
        </FormBackground>
    );
};

export default Form;
