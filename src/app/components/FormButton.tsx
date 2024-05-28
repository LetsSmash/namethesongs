import React, { ButtonHTMLAttributes, ReactNode } from "react";
import {Button, ButtonProps} from "@nextui-org/react"

interface HtmlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

type CombinedButtonProps = HtmlButtonProps & ButtonProps;

const FormButton: React.FC<CombinedButtonProps> = ({ type, children, onClick, onPress }) => {
  return (
    <Button
      onPress={onPress}
      onClick={onClick}
      className="flex justify-center rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full bg-sky-500 hover:bg-sky-600 focus-visible:outline-sky-600 my-5"
      type={type}
    >
      {children}
    </Button>
  );
};

export default FormButton;
