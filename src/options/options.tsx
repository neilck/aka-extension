import "./options.css";

import browser from "webextension-polyfill";
import React, { useState, useCallback, useEffect } from "react";
import { render } from "react-dom";
import { generatePrivateKey, getPublicKey, nip19 } from "nostr-tools";
import QRCode from "react-qr-code";

import {
  getPermissionsString,
  readPermissions,
  removePermissions,
} from "../common/common";
import Panel from "../common/components/Panel";
import { Form } from "react-router-dom";
import Relays from "./components/Relays";
import Permissions from "./components/Permissions";
import AppBar from "./components/Appbar";

const Options = () => {
  return (
    <div className="w-[400px] mt-4 mx-auto border-2">
      <AppBar></AppBar>
      <div className="flex flex-col space-y-4 p-4 bg-gray-100">
        <Panel>
          <h1 className="font-semibold text-lg text-aka-blue pt-1">
            Preferred Relays
          </h1>
          <Relays />
        </Panel>
        <Panel>
          <h1 className="font-semibold text-lg text-aka-blue pt-1">
            App Permissions
          </h1>
          <Permissions />
        </Panel>
      </div>
    </div>
  );
};

type Relay = Record<string, { read: boolean; write: boolean }>;
type Permission = Record<
  string,
  { level: number; condition: string; created_a: number }
>;

type LoaderResult = {
  value: string;
};

type ActionResult = {
  value: string;
};

export const loader = async (): Promise<LoaderResult | void> => {
  return { value: "" };
};

export async function action({
  request,
  params,
}): Promise<LoaderResult | void> {
  return { value: "" };
}

export default Options;
