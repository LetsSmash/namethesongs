'use client'

import React, {useCallback, useEffect, useState} from "react";
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

    const router = useRouter()

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
        if (submitted) {
            // Construct query string
            const queryString = new URLSearchParams({
                album: formik.values.album,
                artist: formik.values.artist,
            }).toString();
            // Redirect
            router.push(`/game?${queryString}`);
        }
    }, [submitted, formik.values.album, formik.values.artist, router]);

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
        </FormBackground>
    );
};

export default Form;