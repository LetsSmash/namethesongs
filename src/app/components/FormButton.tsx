import React, {ButtonHTMLAttributes, ReactNode} from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}

const FormButton: React.FC<ButtonProps> = ({ type, children, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex justify-center rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full bg-sky-500 hover:bg-sky-600 focus-visible:outline-sky-600 my-5"
            type={type}
        >
            {children}
        </button>
    );
};

export default FormButton;
