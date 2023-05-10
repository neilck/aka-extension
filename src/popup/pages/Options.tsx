import React, { useEffect, useState } from "react";
import { redirect, useRouteLoaderData } from "react-router-dom";
import Panel from "../../common/components/Panel";
import Relays from "../components/Relays";
import Permissions from "../components/Permissions";
import AppBar from "../components/Appbar";
import * as storage from "../../common/storage";
import { KeyPair } from "../../common/model/KeyPair";

const Options = () => {
  const [public_key, setPublicKey] = useState("");
  const onKeyChange = onKeyChangeHandler.bind(this);

  let keys = useRouteLoaderData("root") as KeyPair[];
  useEffect(() => {
    if (keys && keys.length > 0) {
      notEmpty = true;
      let curPublicKey = keys.find((key) => key.isCurrent).public_key;
      setPublicKey(curPublicKey);
    }
  }, []);

  let notEmpty = public_key != "";

  function onKeyChangeHandler(key: string) {
    console.log(`Options onKeyChange(${key})`);
    setPublicKey(key);
  }

  return (
    <div className="w-[600px] mt-4 mx-auto border-2">
      <div className="z-40 relative">
        <AppBar onKeyChange={onKeyChange}></AppBar>
      </div>
      {!notEmpty && (
        <div>
          <Panel>
            <p className="italic">
              Add a private key first before setting options.
            </p>
          </Panel>
        </div>
      )}
      {notEmpty && (
        <div className="z-10 relative flex flex-col space-y-4 p-4 bg-gray-100">
          <Panel>
            <h1 className="font-semibold text-lg text-aka-blue pt-1">
              App Permissions
            </h1>
            <Permissions currentPublicKey={public_key} />
          </Panel>
          <Panel>
            <h1 className="font-semibold text-lg text-aka-blue pt-1">
              Preferred Relays
            </h1>
            <Relays currentPublicKey={public_key} />
          </Panel>
        </div>
      )}
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
  const keypairs = await storage.getKeys();
  // console.log("Root loader() returning " + JSON.stringify(keypairs));
  return keypairs;
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const selectedPubkey = updates.selectedPubkey;

  await storage.setCurrentPubkey(selectedPubkey);
  return redirect("/options");
}

export default Options;
