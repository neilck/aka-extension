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

const Options = () => {
  return (
    <div className="flex flex-col space-y-2 p-4">
      <Panel>
        <Relays />
        <Form method="post">
          <input name="form-id" hidden defaultValue="form 1" />
          <input
            type="text"
            id="input1"
            name="input1"
            placeholder="placeholder"
            defaultValue="default value"
            className="w-full bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
          />
        </Form>
      </Panel>
      <Panel>
        <Form method="post">
          <input name="form-id" hidden defaultValue="form 2" />
          <input
            type="text"
            id="input1"
            name="input1"
            placeholder="placeholder"
            defaultValue="default value"
            className="w-full bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
          />
        </Form>
      </Panel>
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
