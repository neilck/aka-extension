import React, { FocusEvent, useState, useEffect } from "react";
import { Form, redirect, useLoaderData, useActionData } from "react-router-dom";
import Panel from "../../common/components/Panel";
import InputButton from "../../common/components/InputButton";
import { BackButton } from "../components//BackButton";
import { KeyPair } from "../../common/model/KeyPair";
import * as storage from "../../common/storage";
import { isKeyValid, getPublicKeyStr } from "../../common/util";
import { nip19 } from "nostr-tools";
import { saveProfile, getDefaultColor } from "../../common/common";

function ProfileCreate() {
  const [errors, setErrors] = useState({ privateKey: "", name: "" });
  const actionError = useActionData() as string;
  const [defaultColor, setDefaultColor] = useState(getDefaultColor());

  const privateKeyOnBlurHandler = (e: FocusEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    if (value == "") {
      return;
    }

    const privatekey = isKeyValid(value);
    if (!privatekey) {
      setErrors({ privateKey: "not a valid private key", name: errors.name });
      return;
    }

    const inputName = document.querySelector("#name") as HTMLInputElement;
    inputName.value = getNpubshort(privatekey);
  };

  const nameOnBlurHandler = (e: FocusEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    if (value == "")
      setErrors({
        privateKey: errors.privateKey,
        name: "name can not be empty",
      });
  };

  return (
    <div className="p-5 w-[400px]">
      <Panel>
        <div className="h-6 w-6 cursor-pointer hover:bg-gray-100">
          <BackButton />
        </div>
        <h1 className="font-semibold text-lg text-aka-blue">New Profile</h1>
        <Form
          id="profileForm"
          action="/profiles/create"
          method="post"
          autoComplete="off"
        >
          <div className="flex flex-col items-center flex-1 w-auto">
            <div className="w-full">
              <label htmlFor="privateKey">Private key</label>
              <input
                type="text"
                id="privateKey"
                name="privateKey"
                placeholder="private key (nsec or hex)"
                onBlur={privateKeyOnBlurHandler}
                onFocus={(e) =>
                  setErrors({ privateKey: "", name: errors.name })
                }
                className="w-full bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
              />
              <div className="h-4 text-red-500">
                {errors?.privateKey && <span>{errors.privateKey}</span>}
              </div>
            </div>

            <div className="w-full">
              <label htmlFor="privateKey">Profile name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="profile name"
                onBlur={nameOnBlurHandler}
                onFocus={(e) =>
                  setErrors({ privateKey: errors.privateKey, name: "" })
                }
                className="w-full bg-gray-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2 placeholder:italic placeholder:text-slate-400 border border-slate-300"
              />
              <div className="h-4 text-red-500">
                {errors?.name && <span>{errors.name}</span>}
              </div>
            </div>

            <div className="w-full">
              <label htmlFor="color">Profile color</label>
              <input
                type="color"
                id="color"
                name="color"
                defaultValue={defaultColor}
                className="w-full h-10 p-1 bg-gray-100 dark:bg-slate-900 border border-slate-300"
              />
            </div>
          </div>
          {actionError && (
            <div id="actionError" className="h-4 text-red-500 text-center">
              {actionError}
            </div>
          )}
          <div className="mx-auto w-[4.5rem] pt-4">
            <InputButton>Save</InputButton>
          </div>
        </Form>
      </Panel>
    </div>
  );
}

function getNpubshort(private_key: string) {
  let public_key = getPublicKeyStr(private_key);
  let npub = nip19.npubEncode(public_key);
  return npub.substring(0, 9) + "..." + npub.substring(npub.length - 5);
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const formkey = formData.get("privateKey");
  const color = formData.get("color");

  let name = formData.get("name") as string;
  name = name.replace(/\p{C}/gu, "");

  if (name == "") return "name can not be blank";

  const privatekey = isKeyValid(formkey);
  if (privatekey == null) return "private key is not valid";

  const keypairs = await storage.getKeys();
  const existingKey = keypairs.find(
    (keypair) => keypair.private_key === privatekey
  );

  if (existingKey) {
    return `private key already in use by profile ${existingKey.name}`;
  }

  // save data
  const keypair = KeyPair.initKeyPair(privatekey, name, true);
  await storage.upsertKey(keypair);

  // init profileData
  let profileData = { policies: {}, relays: {}, protocol_handler: "", color: color};
  saveProfile(keypair.public_key, profileData);

  return redirect("/profiles");
}

export default ProfileCreate;
