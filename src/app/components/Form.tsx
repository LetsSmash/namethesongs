'use client'

import React, {useCallback, useState} from "react";
import { useFormik } from "formik";
import * as Yup from 'yup';
import {useRouter, useSearchParams} from 'next/navigation'

import FormBackground from "@/app/components/FormBackground";
import FormInput from "@/app/components/FormInput";
import FormButton from "@/app/components/FormButton";

const validationSchema = Yup.object({
    album: Yup.string()
        .required('Album or EP name is required'),
    artist: Yup.string()
        .required('Artist name is required'),
});

const Form = () => {
    const [submitted, setSubmitted] = useState(false);
    const [album, setAlbum] = useState("");
    const [artist, setArtist] = useState("")

    const router = useRouter()
    const searchParams = useSearchParams()

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set(name, value)
            return params.toString()
        },
        [searchParams]
    )

    const formik = useFormik({
        initialValues: {
            album: "",
            artist: "",
        },
        validationSchema,
        onSubmit: (values, { resetForm }) => {
            setAlbum(values.album);
            setArtist(values.artist)
            setSubmitted(true);
            resetForm();
        },
    });

    if (submitted) return router.push('/game?' + createQueryString('album', `${album}`) + "&" + createQueryString('artist', `${artist}`));

    return (
        <FormBackground>
            <form
                className="block text-sm font-medium leading-6 text-gray-900"
                onSubmit={formik.handleSubmit}
            >
                <label htmlFor={"artist"}>Enter an Artist</label>
                <FormInput
                    id="artist"
                    name="artist"
                    type="text"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.artist}
                    classes="mb-4"
                />
                <label htmlFor="album">Enter an Album or an EP by that Artist</label>
                <FormInput
                    id="album"
                    name="album"
                    type="text"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.album}
                />
                <FormButton
                    type="submit"
                >
                    Go!
                </FormButton>
            </form>
        </FormBackground>
    );
};

export default Form;
