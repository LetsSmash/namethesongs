import React, { ReactNode } from "react";

const FormBackground = (props: { children: ReactNode, additionalClasses?: string }) => {
  return (
    <div className={`flex flex-col bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10 mt-8 ${props.additionalClasses}`}>
      {props.children}
    </div>
  );
};

export default FormBackground;
