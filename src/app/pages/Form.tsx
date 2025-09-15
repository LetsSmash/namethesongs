"use client";

import React, {  } from "react";
import {
  Tab,
  Tabs,
} from "@nextui-org/react";

import FormBackground from "@/app/components/FormBackground";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import FormAlbum from "./FormAlbum";

const Form = () => {
  const ProfileIcon = () => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path d="M399 384.2C376.9 345.8 335.4 320 288 320l-64 0c-47.4 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z" />
      </svg>
    );
  };


  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <FormBackground>
        <SignedOut>
          <div className="grid grid-cols-2 gap-x-4">
            <SignInButton mode="modal" />
            <SignUpButton mode="modal" />
          </div>
        </SignedOut>
        <SignedIn>
          <div className="flex justify-end pb-4">
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link
                  href="/user/profile"
                  label="Your Profile"
                  labelIcon={<ProfileIcon />}
                />
                <UserButton.Action label="manageAccount" />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </SignedIn>
          <>
              <Tabs
                className="grid mb-3"
              >
                <Tab key="album" title="Album">
                  <FormAlbum />
                </Tab>
                <Tab key="artist" title="Artist">
                </Tab>
              </Tabs>
          </>
      </FormBackground>
    </div>
  );
};

export default Form;
