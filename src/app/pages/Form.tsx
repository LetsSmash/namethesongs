"use client";

import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
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
import FormArtist from "./FormArtist";

import { Icon } from "@iconify-icon/react";

const Form = () => {
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <FormBackground>
        <SignedOut>
          <div className="flex justify-end pb-4">
            <Dropdown>
              <DropdownTrigger>
                <Icon icon="fa7-solid:user-circle" width="35" height="35" />
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="signin">
                  <div className="flex items-center gap-4">
                    <Icon icon="fa7-solid:sign-in" width="20" height="20" />
                    <SignInButton mode="modal">
                      <span>Sign In</span>
                    </SignInButton>
                  </div>
                </DropdownItem>
                <DropdownItem key="signup">
                  <div className="flex items-center gap-4">
                    <Icon icon="fa7-solid:user-plus" width="20" height="20" />
                    <SignUpButton mode="modal">
                      <span>Sign Up</span>
                    </SignUpButton>
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </SignedOut>
        <SignedIn>
          <div className="flex justify-end pb-4">
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link
                  href="/user/profile"
                  label="Your Profile"
                  labelIcon={<Icon icon="fa7-solid:user-circle" width="20" height="20" />}
                />
                <UserButton.Action label="manageAccount" />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </SignedIn>
        <>
          <Tabs className="grid mb-3">
            <Tab key="album" title="Album">
              <FormAlbum />
            </Tab>
            <Tab key="artist" title="Artist">
              <FormArtist />
            </Tab>
          </Tabs>
        </>
      </FormBackground>
    </div>
  );
};

export default Form;
