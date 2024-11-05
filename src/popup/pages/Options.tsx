import React, { useEffect, useState } from "react";
import Panel from "../../common/components/Panel";
import Relays from "../components/Relays";
import Permissions from "../components/Permissions";
import AppBar from "../components/Appbar";
import * as storage from "../../common/storage";
import { KeyPair } from "../../common/model/KeyPair";
import { Profile } from "../../common/model/Profile";
import { Policy } from "../../common/model/Policy";

const Options = () => {
  const [data, setData] = useState<{
    currentKey: string;
    keypairs: KeyPair[];
    profile: Profile | null;
  }>({ currentKey: "", keypairs: [], profile: null });

  const setKey = async (key: string) => {
    if (data.currentKey == key) {
      return;
    }

    const updated = await load(key);
    setData(updated);
  };

  const reload = async () => {
    const updated = await load(data.currentKey);
    setData(updated);
  };

  const getAllowedPolicies = () => {
    if (!data.profile?.policies) {
      return [] as Policy[];
    }

    return data.profile.policies.filter((policy) => {
      return policy.accept == "true";
    });
  };

  const getDeniedPolicies = () => {
    if (!data.profile?.policies) {
      return [] as Policy[];
    }

    return data.profile.policies.filter((policy) => {
      return policy.accept == "false";
    });
  };

  let notEmpty = data.currentKey != "";

  // when app bar key selected
  function onKeyChangeHandler(key: string) {
    setKey(key);
  }

  // when polices changed
  function onPolicyChangeHandler() {
    reload();
  }

  const onKeyChange = onKeyChangeHandler.bind(this);
  const onPolicyChange = onPolicyChangeHandler.bind(this);

  useEffect(() => {
    const doInitialLoad = async () => {
      const keypair = await storage.getCurrentKey();
      setKey(keypair.public_key);
    };

    doInitialLoad();
  }, []);

  return (
    <div className="w-[600px] mt-4 mx-auto border-2">
      <div className="z-40 relative">
        <AppBar
          onKeyChange={onKeyChange}
          currentKey={data.currentKey}
          keypairs={data.keypairs}
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
              currentKey={data.currentKey}
              policies={getAllowedPolicies()}
              onChange={onPolicyChange}
            />
            {getDeniedPolicies().length > 0 && (
              <>
                <h1 className="font-semibold text-lg text-aka-blue pt-2">
                  Denied Permissions
                </h1>
                <Permissions
                  currentKey={data.currentKey}
                  policies={getDeniedPolicies()}
                  onChange={onPolicyChange}
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

            <Relays currentKey={data.currentKey} profile={data.profile} />
          </Panel>
        </div>
      )}
    </div>
  );
};

type LoaderResult = {
  currentKey: string;
  keypairs: KeyPair[];
  profile: Profile | null;
};

const load = async (currentKey: string): Promise<LoaderResult> => {
  let result: LoaderResult = {
    currentKey: currentKey,
    keypairs: [],
    profile: null,
  };

  // console.log(`load called with currentKey: ${currentKey}`);

  try {
    // console.log(`load getCurrentOptionPubkey(): ${result.currentKey}`);

    result.keypairs = await storage.getKeys();
    if (result.currentKey != "") {
      result.profile = await storage.getProfile(result.currentKey);
    }
  } catch (error) {
    console.error(error);
  }

  if (result.currentKey == "") {
    const keypair = result.keypairs.find((keypair) => keypair.isCurrent);
    if (keypair) {
      result.currentKey = keypair.public_key;
    }
  }

  // console.log(`load called: ${JSON.stringify(result)}`);
  return result;
};

export default Options;
