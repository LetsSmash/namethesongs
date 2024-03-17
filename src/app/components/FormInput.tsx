import {ChangeEventHandler, FocusEventHandler, HTMLInputTypeAttribute} from "react";

interface FormInputProps {
    id?: string | undefined;
    name?: string | undefined;
    type?: HTMLInputTypeAttribute | undefined;
    onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
    onBlur?: FocusEventHandler<HTMLInputElement> | undefined;
    value?: string | undefined;
    classes?: string | undefined
}

const FormInput = ({ id, name, type, onChange, onBlur, value, classes }: FormInputProps) => {
    return (
        <input
            className={`form-input block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6 ${classes}`}
            id={id}
            name={name}
            type={type}
            onChange={onChange}
            onBlur={onBlur}
            value={value}
        />
    );
};

export default FormInput;
