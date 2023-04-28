import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link, useLoaderData, redirect } from "react-router-dom";
import Storage from "../../common/Storage";
import Panel from "./Panel";
import { IKeyPair } from "../../common/model/keypair";
import { PencilSquareIcon } from "./PencilSquareIcon";

function PrivateKeyDisplay(props: any) {
  const childRef = useRef();

  const [showPrivate, setShowPrivate] = useState(props.showPrivate);
  const parentSetShowPrivate = props.setShowPrivate;
  const profile = props.profile as IKeyPair;

  useEffect(() => {
    parentSetShowPrivate(showPrivate);
  }, [parentSetShowPrivate, showPrivate]);

  if (showPrivate) {
    return (
      <div>
        <div
          id="data"
          className="flex flex-col items-center flex-1 p-2 w-auto gap-2 border"
        >
          <div id="nsec" className="w-80">
            <div id="npsec_label" className="font-semibold">
              Private Key (nsec)
            </div>
            <div id="nsec_value" className="break-words">
              {profile.get_nsec()}
            </div>
          </div>
          <div id="privatekey" className="w-80">
            <div id="privatekey_label" className="font-semibold">
              Private Key (hex)
            </div>
            <div id="privatekey_value" className="break-words">
              {profile.get_privatekey()}
            </div>
          </div>

          <div id="toggleButton" className="w-80"></div>
          <button
            onClick={(e) => {
              setShowPrivate(false);
            }}
            className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded"
          >
            hide private key
          </button>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <button
          onClick={(e) => {
            setShowPrivate(true);
          }}
          className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded"
        >
          show private key
        </button>
      </div>
    );
  }
}

function Profile() {
  const currentProfile = useLoaderData() as IKeyPair;
  const [showPrivate, setShowPrivate] = useState(false);

  // make wrapper function to give child
  const wrapperSetShowPrivate = useCallback(
    (val: boolean) => {
      setShowPrivate(val);
    },
    [setShowPrivate]
  );

  return (
    <div>
      <div id="panel_outer" className="p-5">
        <Panel>
          <div
            id="panel_inner"
            className="flex flex-col items-center flex-1 p-1 w-auto gap-1"
          >
            <div
              id="top_row"
              className="w-full flex flex-row flex-nowrap justify-between"
            >
              <div className="font-semibold text-lg text-aka-blue">
                <Link to={`/profiles/${currentProfile.get_publickey()}/edit`}>
                  {currentProfile.get_name()}
                </Link>
              </div>
              <Link to={`/profiles/${currentProfile.get_publickey()}/edit`}>
                <div className="w-4 h-4">
                  <PencilSquareIcon stroke="#234e70" />
                </div>
              </Link>
            </div>
          </div>
          <div
            id="data"
            className="flex flex-col items-center flex-1 p-1 w-auto gap-2"
          >
            <div id="npub" className="w-80">
              <div id="npub_label" className="font-semibold">
                Public Key (npub)
              </div>
              <div id="npub_value" className="break-words">
                {currentProfile.get_npub()}
              </div>
            </div>
            <div id="pubkey" className="w-80">
              <div id="pubkey_label" className="font-semibold">
                Public Key (hex)
              </div>
              <div id="pubkey_value" className="break-words">
                {currentProfile.get_publickey()}
              </div>
            </div>
            <PrivateKeyDisplay
              showPrivate={showPrivate}
              setShowPrivate={wrapperSetShowPrivate}
              profile={currentProfile}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

export const loader = async () => {
  const storage = Storage.getInstance();
  const currentKey = await storage.getCurrentKey();

  console.log("Profile loader() currentKey: " + JSON.stringify(currentKey));
  if (currentKey == null) return redirect("/popup");

  return currentKey;
  /*
  return redirect("/profiles/" + currentKey.get_publickey());
  */
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const selectedPubkey = updates.selectedPubkey;

  return null;
}

export default Profile;
