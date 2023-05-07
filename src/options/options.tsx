import "./options.css";

import React, { useEffect, useState } from "react";
import { redirect, useLoaderData } from "react-router-dom";
import Panel from "../common/components/Panel";
import Relays from "./components/Relays";
import Permissions from "./components/Permissions";
import AppBar from "./components/Appbar";
import Storage from "../common/Storage";
import { KeyPair } from "../common/model/KeyPair";

const Options = () => {
  let keys = useLoaderData() as KeyPair[];
  let curPublicKey = keys.find((key) => key.isCurrent).public_key;
  const [public_key, setPublicKey] = useState(curPublicKey);
  const onKeyChange = onKeyChangeHandler.bind(this);

  function onKeyChangeHandler(key: string) {
    console.log(`Options onKeyChange(${key})`);
    setPublicKey(key);
  }

  return (
    <div className="w-[400px] mt-4 mx-auto border-2">
      <div className="z-40 relative">
        <AppBar onKeyChange={onKeyChange}></AppBar>
      </div>
      <div className="z-10 relative flex flex-col space-y-4 p-4 bg-gray-100">
        <Panel>
          <h1 className="font-semibold text-lg text-aka-blue pt-1">
            Preferred Relays
          </h1>
          <Relays currentPublicKey={public_key} />
        </Panel>
        <Panel>
          <h1 className="font-semibold text-lg text-aka-blue pt-1">
            App Permissions
          </h1>
          <Permissions currentPublicKey={public_key} />
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

export const loader = async (): Promise<KeyPair[]> => {
  const storage = Storage.getInstance();
  const keypairs = await storage.getKeys();
  // console.log("Root loader() returning " + JSON.stringify(keypairs));
  return keypairs;
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const selectedPubkey = updates.selectedPubkey;

  const storage = Storage.getInstance();
  await storage.setCurrentPubkey(selectedPubkey);
  return redirect("/");
}

export default Options;
