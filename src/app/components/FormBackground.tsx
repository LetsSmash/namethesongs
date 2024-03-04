import React, {ReactNode} from "react";

const FormBackground = (props: { children: ReactNode }) => {
    return (
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10 mt-8">
            {props.children}
        </div>
    );
};

export default FormBackground;
