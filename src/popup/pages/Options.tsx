import React, { useEffect, useState } from "react";
import { redirect, useLoaderData, useRevalidator } from "react-router-dom";
import Panel from "../../common/components/Panel";
import Relays from "../components/Relays";
import Permissions from "../components/Permissions";
import AppBar from "../components/Appbar";
import browser from "webextension-polyfill";
import * as storage from "../../common/storage";
import { KeyPair } from "../../common/model/KeyPair";
import { Profile } from "../../common/model/Profile";

const Options = () => {
  let loaded = useLoaderData() as {
    currentKey: string;
    keypairs: KeyPair[];
    profile: Profile;
  };
  let currentKey = loaded.currentKey;
  let keypairs = loaded.keypairs;
  let profile = loaded.profile;

  const keys = loaded.keypairs;
  const onKeyChange = onKeyChangeHandler.bind(this);
  let revalidator = useRevalidator();

  const allowedPolicies = loaded.profile.policies.filter((policy) => {
    return policy.accept == "true";
  });
  const deniedPolicies = loaded.profile.policies.filter((policy) => {
    return policy.accept == "false";
  });

  let notEmpty = currentKey != "";

  useEffect(() => {
    browser.storage.local.onChanged.addListener(handleChange);
    return () => {
      browser.storage.local.onChanged.removeListener(handleChange);
    };
  }, []);

  const handleChange = async (changes) => {
    const changedItems = Object.keys(changes);
    let needsReload = false;
    const currentProfileKey = await storage.getCurrentOptionPubkey();

    // options needs reload if options current key changed, or displayed profile changed
    changedItems.map((item) => {
      if (!needsReload && item == "current_options_pubkey") needsReload = true;
      if (!needsReload && item == currentProfileKey) needsReload = true;
    });

    if (needsReload) {
      // loaded = await load();
      // setPublicKey(loaded.currentKey);
      revalidator.revalidate();
    }
  };

  function onKeyChangeHandler(key: string) {
    storage.setCurrentOptionPubkey(key);
  }

  return (
    <div className="w-[600px] mt-4 mx-auto border-2">
      <div className="z-40 relative">
        <AppBar
          onKeyChange={onKeyChange}
          currentKey={loaded.currentKey}
          keypairs={loaded.keypairs}
        ></AppBar>
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
              Allowed Permissions
            </h1>
            <Permissions
              currentKey={loaded.currentKey}
              policies={allowedPolicies}
            />
            {deniedPolicies.length > 0 && (
              <>
                <h1 className="font-semibold text-lg text-aka-blue pt-2">
                  Denied Permissions
                </h1>
                <Permissions
                  currentKey={loaded.currentKey}
                  policies={deniedPolicies}
                />
              </>
            )}
            <p className="mt-2">
              * Allowed permissions take precedence over denied permissions.
            </p>
          </Panel>
          <Panel>
            <h1 className="font-semibold text-lg text-aka-blue pt-1">
              Preferred Relays
            </h1>
            <Relays currentKey={loaded.currentKey} profile={loaded.profile} />
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

const load = async (): Promise<{
  currentKey: string;
  keypairs: KeyPair[];
  profile: Profile;
}> => {
  const keypairs = await storage.getKeys();
  let currentKey = await storage.getCurrentOptionPubkey();
  if (currentKey == "") {
    const keypair = keypairs.find((keypair) => keypair.isCurrent);
    if (keypair) {
      currentKey = keypair.public_key;
      storage.setCurrentOptionPubkey(currentKey);
    }
  }
  let profile = await storage.getProfile(currentKey);

  return { currentKey, keypairs, profile };
};

export const loader = async (): Promise<{
  currentKey: string;
  keypairs: KeyPair[];
  profile: Profile;
}> => {
  return load();
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const selectedPubkey = updates.selectedPubkey;
  await storage.setCurrentPubkey(selectedPubkey);
  return redirect("/options");
}

export default Options;
