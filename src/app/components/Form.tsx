'use client'

import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from 'yup';
import FormBackground from "@/app/components/FormBackground";
import MainGame from "@/app/components/MainGame";
import FormInput from "@/app/components/FormInput";
import FormButton from "@/app/components/FormButton";

const validationSchema = Yup.object({
    album: Yup.string()
        .required('Album name is required'),
});

const Form = () => {
    const [submitted, setSubmitted] = useState(false);
    const [album, setAlbum] = useState("");

    const formik = useFormik({
        initialValues: {
            album: "",
        },
        validationSchema, // Use the validation schema in Formik
        onSubmit: (values, { resetForm }) => {
            setAlbum(values.album);
            setSubmitted(true);
            resetForm();
        },
    });

    if (submitted) return <MainGame album={album} />;

    return (
        <FormBackground>
            <form
                className="block text-sm font-medium leading-6 text-gray-900"
                onSubmit={formik.handleSubmit}
            >
                <label htmlFor="album">Enter an Album</label>
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
